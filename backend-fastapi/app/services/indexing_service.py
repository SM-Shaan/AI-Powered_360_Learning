"""
Indexing Service - Part 2
Process and index content for semantic search
"""

from typing import Optional, List, Dict, Any
from app.services.chunking_service import get_chunking_service
from app.services.embedding_service import get_embedding_service
from app.core.supabase import get_supabase_admin
import json


class IndexingService:
    """
    Service for indexing content into searchable chunks with embeddings.

    Pipeline:
    1. Fetch content from database
    2. Download file from storage
    3. Extract text from file
    4. Chunk text into segments
    5. Generate embeddings for each chunk
    6. Store chunks with embeddings in content_chunks table
    """

    def __init__(self):
        self.chunking_service = get_chunking_service()
        self.embedding_service = get_embedding_service()

    async def index_content(self, content_id: str) -> Dict[str, Any]:
        """
        Index a single content item.

        Args:
            content_id: UUID of the content to index

        Returns:
            Indexing result with chunk count and status
        """
        supabase = get_supabase_admin()

        # 1. Fetch content metadata
        content_result = supabase.table('content').select('*').eq('id', content_id).execute()

        if not content_result.data:
            return {
                "success": False,
                "error": "Content not found",
                "content_id": content_id
            }

        content = content_result.data[0]
        file_path = content.get('file_path')
        file_name = content.get('file_name', '')
        mime_type = content.get('mime_type', '')

        # 2. Get file content from storage or use description
        full_text = ""
        chunks = []

        if file_path:
            try:
                # Download file from Supabase storage
                file_response = supabase.storage.from_('materials').download(file_path)

                if file_response:
                    # Process the file
                    full_text, chunks = self.chunking_service.process_document(
                        file_response,
                        file_name,
                        mime_type
                    )
            except Exception as e:
                print(f"Error downloading file: {e}")
                # Fall back to description
                full_text = content.get('description', '') or content.get('title', '')

        if not full_text:
            # Use title and description as fallback
            full_text = f"{content.get('title', '')}\n\n{content.get('description', '')}"

        if not chunks:
            # Create chunks from text
            chunks = self.chunking_service.chunk_text(full_text, "text")

        if not chunks:
            return {
                "success": False,
                "error": "No content to index",
                "content_id": content_id
            }

        # 3. Delete existing chunks for this content 
        supabase.table('content_chunks').delete().eq('content_id', content_id).execute()

        # 4. Generate embeddings and store chunks
        chunks_stored = 0
        errors = []

        for i, chunk in enumerate(chunks):
            try:
                # Generate embedding
                embedding = await self.embedding_service.embed_document(chunk.text)

                # Prepare chunk data 
                chunk_data = {
                    "content_id": content_id,
                    "chunk_index": i,
                    "chunk_text": chunk.text[:10000],  # Limit text size
                    "chunk_type": chunk.chunk_type,
                    "start_position": chunk.start_position,
                    "end_position": chunk.end_position,
                    "embedding": embedding,
                    "metadata": json.dumps(getattr(chunk, 'metadata', {}) or {})
                }

                # Store chunk
                supabase.table('content_chunks').insert(chunk_data).execute()
                chunks_stored += 1

            except Exception as e:
                errors.append(f"Chunk {i}: {str(e)}")
                print(f"Error indexing chunk {i}: {e}")

        # 5. Generate and store document-level embedding
        try:
            # Use first 2000 chars for document embedding
            doc_text = full_text[:2000]
            doc_embedding = await self.embedding_service.embed_document(doc_text)

            # Update content with embedding and extracted text
            supabase.table('content').update({
                "embedding": doc_embedding,
                "text_content": full_text[:50000]  # Store extracted text
            }).eq('id', content_id).execute()

        except Exception as e:
            errors.append(f"Document embedding: {str(e)}")

        return {
            "success": True,
            "content_id": content_id,
            "title": content.get('title'),
            "chunks_created": chunks_stored,
            "total_chunks": len(chunks),
            "text_length": len(full_text),
            "errors": errors if errors else None
        }

    async def index_all_content(self, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Index all content in the database.

        Args:
            category: Optional filter by category (theory/lab)

        Returns:
            Summary of indexing results
        """
        supabase = get_supabase_admin()

        # Fetch all content
        query = supabase.table('content').select('id, title')
        if category:
            query = query.eq('category', category)

        result = query.execute()

        if not result.data:
            return {
                "success": True,
                "message": "No content to index",
                "indexed": 0
            }

        results = []
        success_count = 0
        error_count = 0

        for content in result.data:
            index_result = await self.index_content(content['id'])
            results.append({
                "content_id": content['id'],
                "title": content['title'],
                "success": index_result.get('success', False),
                "chunks": index_result.get('chunks_created', 0)
            })

            if index_result.get('success'):
                success_count += 1
            else:
                error_count += 1

        return {
            "success": True,
            "total_content": len(result.data),
            "indexed_successfully": success_count,
            "errors": error_count,
            "results": results
        }

    async def reindex_content(self, content_id: str) -> Dict[str, Any]:
        """
        Reindex a content item (delete existing chunks and re-create).

        Args:
            content_id: UUID of the content to reindex

        Returns:
            Indexing result
        """
        # Delete existing chunks
        supabase = get_supabase_admin()
        supabase.table('content_chunks').delete().eq('content_id', content_id).execute()

        # Re-index
        return await self.index_content(content_id)

    async def get_index_status(self, content_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get indexing status for content.

        Args:
            content_id: Optional specific content ID

        Returns:
            Index status information
        """
        supabase = get_supabase_admin()

        if content_id:
            # Get status for specific content
            content = supabase.table('content').select('id, title, embedding').eq('id', content_id).execute()
            chunks = supabase.table('content_chunks').select('id').eq('content_id', content_id).execute()

            if not content.data:
                return {"success": False, "error": "Content not found"}

            return {
                "success": True,
                "content_id": content_id,
                "title": content.data[0].get('title'),
                "is_indexed": content.data[0].get('embedding') is not None,
                "chunk_count": len(chunks.data) if chunks.data else 0
            }

        else:
            # Get overall status
            total_content = supabase.table('content').select('id', count='exact').execute()
            indexed_content = supabase.table('content').select('id', count='exact').not_.is_('embedding', 'null').execute()
            total_chunks = supabase.table('content_chunks').select('id', count='exact').execute()

            return {
                "success": True,
                "total_content": total_content.count if hasattr(total_content, 'count') else len(total_content.data),
                "indexed_content": indexed_content.count if hasattr(indexed_content, 'count') else len(indexed_content.data),
                "total_chunks": total_chunks.count if hasattr(total_chunks, 'count') else len(total_chunks.data)
            }


# Singleton instance
_indexing_service: Optional[IndexingService] = None


def get_indexing_service() -> IndexingService:
    """Get or create indexing service instance"""
    global _indexing_service
    if _indexing_service is None:
        _indexing_service = IndexingService()
    return _indexing_service
