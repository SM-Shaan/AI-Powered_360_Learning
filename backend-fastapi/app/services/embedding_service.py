"""
Embedding Service - Part 2
Generate embeddings using Nomic AI's nomic-embed-text-v1.5 model
"""

import httpx
from typing import List, Optional
from app.core.config import settings


class EmbeddingService:
    """
    Service for generating text embeddings using Nomic AI model.

    Uses nomic-embed-text-v1.5 which produces 768-dimensional embeddings.
    Supports multiple backends:
    - HuggingFace Inference API (requires token)
    - OpenRouter (if configured)
    """

    def __init__(self):
        self.model_name = "BAAI/bge-base-en-v1.5"
        self.dimension = 768
        self.hf_token = getattr(settings, 'huggingface_token', None)

        # Use HuggingFace Inference Router API
        self.hf_api_url = f"https://router.huggingface.co/hf-inference/models/{self.model_name}"

    def _get_headers(self) -> dict:
        """Get headers for HuggingFace API"""
        headers = {"Content-Type": "application/json"}
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"
        return headers

    def _prepare_text(self, text: str, task_type: str = "search_document") -> str:
        """
        Prepare text with optional query prefix for BGE model.

        BGE recommends prefixing queries with "Represent this sentence for searching relevant passages:"
        for asymmetric tasks. Documents don't need a prefix.
        """
        # Clean and truncate text
        text = text.strip()
        if len(text) > 8000:
            text = text[:8000]

        # BGE uses prefix only for queries, not documents
        if task_type == "search_query":
            return f"Represent this sentence for searching relevant passages: {text}"

        return text

    async def _call_hf_api(self, texts: List[str]) -> List[List[float]]:
        """Call HuggingFace API for embeddings"""
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.hf_api_url,
                    headers=self._get_headers(),
                    json={"inputs": texts}
                )

                if response.status_code == 503:
                    # Model loading, retry once
                    import asyncio
                    await asyncio.sleep(5)
                    response = await client.post(
                        self.hf_api_url,
                        headers=self._get_headers(),
                        json={"inputs": texts}
                    )

                if response.status_code == 200:
                    return response.json()

                # If 401/403, this is auth error - will use fallback
                if response.status_code in [401, 403]:
                    raise ValueError(f"401 Unauthorized: {response.text}")

                raise ValueError(f"Embedding API error: {response.status_code} - {response.text}")

        except httpx.RequestError as e:
            raise ValueError(f"Request error: {str(e)}")

    async def _generate_simple_embedding(self, text: str) -> List[float]:
        """
        Generate a simple hash-based embedding as fallback.
        This is NOT semantic but allows the system to work without external API.
        """
        import hashlib

        # Create deterministic embedding from text hash
        text_bytes = text.encode('utf-8')

        # Generate multiple hashes to fill 768 dimensions
        embedding = []
        for i in range(48):  # 48 * 16 = 768
            h = hashlib.md5(text_bytes + str(i).encode()).hexdigest()
            # Convert hex pairs to floats between -1 and 1
            for j in range(0, 32, 2):
                val = int(h[j:j+2], 16) / 127.5 - 1
                embedding.append(val)

        return embedding[:768]

    async def embed_text(self, text: str, task_type: str = "search_document") -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed
            task_type: Task prefix (search_document, search_query, classification, clustering)

        Returns:
            List of floats representing the embedding
        """
        prepared_text = self._prepare_text(text, task_type)

        try:
            result = await self._call_hf_api([prepared_text])

            # HuggingFace returns nested array for single input
            if isinstance(result, list) and len(result) > 0:
                if isinstance(result[0], list):
                    return result[0]
                return result

            raise ValueError(f"Unexpected embedding response format: {type(result)}")

        except Exception as e:
            # Check if it's an auth error or API unavailable
            error_str = str(e).lower()
            if any(x in error_str for x in ["401", "403", "unauthorized", "failed", "error"]):
                print(f"HuggingFace API issue: {e}")
                print("Using fallback embedding. For semantic search, set HUGGINGFACE_TOKEN in .env")
                return await self._generate_simple_embedding(prepared_text)
            raise

    async def embed_query(self, query: str) -> List[float]:
        """
        Generate embedding optimized for search queries.

        Args:
            query: Search query text

        Returns:
            Query embedding
        """
        return await self.embed_text(query, task_type="search_query")

    async def embed_document(self, document: str) -> List[float]:
        """
        Generate embedding for a document to be indexed.

        Args:
            document: Document text

        Returns:
            Document embedding
        """
        return await self.embed_text(document, task_type="search_document")

    async def embed_batch(
        self,
        texts: List[str],
        task_type: str = "search_document",
        batch_size: int = 32
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed
            task_type: Task prefix for all texts
            batch_size: Number of texts per API call

        Returns:
            List of embeddings
        """
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            prepared_batch = [self._prepare_text(t, task_type) for t in batch]

            try:
                result = await self._call_hf_api(prepared_batch)

                if isinstance(result, list):
                    all_embeddings.extend(result)
                else:
                    raise ValueError(f"Unexpected batch response format")

            except Exception as e:
                if "401" in str(e) or "Unauthorized" in str(e):
                    # Fallback for each text in batch
                    for text in prepared_batch:
                        emb = await self._generate_simple_embedding(text)
                        all_embeddings.append(emb)
                else:
                    raise

        return all_embeddings

    async def embed_code(self, code: str, language: str = "python") -> List[float]:
        """
        Generate embedding for code content.

        Args:
            code: Source code
            language: Programming language

        Returns:
            Code embedding
        """
        # Prefix with language for better code understanding
        prefixed_code = f"[{language}]\n{code}"
        return await self.embed_text(prefixed_code, task_type="search_document")


# Singleton instance
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """Get or create embedding service instance"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
