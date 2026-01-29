"""
RAG Service - Part 2
Retrieval-Augmented Generation for question answering
"""

import httpx
import json
from typing import List, Optional, Dict, Any
from app.services.retrieval_service import get_retrieval_service
from app.core.config import settings


class RAGService:
    """
    Service for Retrieval-Augmented Generation.

    Combines retrieved context from course materials with LLM generation
    to answer questions grounded in course content.
    """

    def __init__(self):
        self.retrieval_service = get_retrieval_service()
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        self.model = "anthropic/claude-sonnet-4"

    async def _call_llm(self, system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> Dict:
        """Make a request to the LLM API"""
        if not self.api_key or self.api_key == "your-openrouter-api-key":
            raise ValueError("OpenRouter API key not configured")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "AI Learning Platform - RAG"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": 0.3  # Lower temperature for factual responses
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return {
                "content": data["choices"][0]["message"]["content"],
                "usage": data.get("usage", {}),
                "model": data.get("model", self.model)
            }

    async def answer_question(
        self,
        question: str,
        max_context_chunks: int = 5,
        category: Optional[str] = None,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """
        Answer a question using RAG.

        1. Retrieve relevant chunks from course materials
        2. Build context from retrieved chunks
        3. Generate answer using LLM with context
        4. Include source citations

        Args:
            question: User's question
            max_context_chunks: Maximum chunks to use as context
            category: Optional category filter (theory/lab)
            include_sources: Whether to include source citations

        Returns:
            RAG response with answer and sources
        """
        # 1. Retrieve relevant context
        if category:
            chunks = await self.retrieval_service.search_chunks(
                query=question,
                top_k=max_context_chunks,
                threshold=0.4,
                category=category
            )
        else:
            chunks = await self.retrieval_service.search_chunks(
                query=question,
                top_k=max_context_chunks,
                threshold=0.4
            )

        # 2. Build context string
        context_parts = []
        sources = []

        for i, chunk in enumerate(chunks):
            chunk_text = chunk.get('chunk_text', '')
            title = chunk.get('content_title', 'Unknown')
            category = chunk.get('content_category', '')
            similarity = chunk.get('similarity', 0)

            context_parts.append(f"[Source {i+1}: {title} ({category})]\n{chunk_text}")

            if include_sources:
                sources.append({
                    "content_id": chunk.get('content_id', ''),
                    "title": title,
                    "category": category,
                    "excerpt": chunk_text[:200] + "..." if len(chunk_text) > 200 else chunk_text,
                    "relevance": round(similarity, 3)
                })

        context = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant course materials found."

        # 3. Generate answer with LLM
        system_prompt = """You are a helpful teaching assistant for a university course.
Your role is to answer student questions based on the provided course materials.

Guidelines:
- Base your answers on the provided context from course materials
- If the context doesn't contain enough information, say so clearly
- Be accurate and educational in your explanations
- Use examples from the context when helpful
- Cite which source you're drawing from when relevant (e.g., "According to Source 1...")
- If asked about something not in the materials, acknowledge that and provide general guidance

Format your response clearly with paragraphs. Use markdown formatting when helpful."""

        user_prompt = f"""Question: {question}

Course Materials Context:
{context}

Please answer the question based on the course materials above. If the materials don't fully address the question, acknowledge what's covered and what isn't."""

        try:
            response = await self._call_llm(system_prompt, user_prompt)
            answer = response["content"]

            # Calculate confidence based on context quality
            if chunks:
                avg_similarity = sum(c.get('similarity', 0) for c in chunks) / len(chunks)
                confidence = min(avg_similarity + 0.2, 1.0)  # Boost slightly
            else:
                confidence = 0.3  # Low confidence without context

            # Extract related topics from chunks
            related_topics = list(set(
                chunk.get('content_topic') for chunk in chunks
                if chunk.get('content_topic')
            ))[:5]

            return {
                "success": True,
                "question": question,
                "answer": answer,
                "confidence": round(confidence, 2),
                "sources": sources if include_sources else [],
                "related_topics": related_topics,
                "tokens_used": response.get("usage", {}).get("completion_tokens")
            }

        except Exception as e:
            return {
                "success": False,
                "question": question,
                "answer": f"I encountered an error while generating the answer: {str(e)}",
                "confidence": 0,
                "sources": [],
                "related_topics": [],
                "error": str(e)
            }

    async def explain_topic(
        self,
        topic: str,
        category: Optional[str] = None,
        difficulty: str = "intermediate"
    ) -> Dict[str, Any]:
        """
        Explain a topic using course materials.

        Args:
            topic: Topic to explain
            category: Optional category filter
            difficulty: Explanation difficulty level

        Returns:
            Explanation with sources
        """
        # Retrieve context about the topic
        context, sources = await self.retrieval_service.get_context_for_rag(
            query=f"explain {topic}",
            max_chunks=6
        )

        system_prompt = f"""You are an expert educator explaining concepts to university students.
Difficulty level: {difficulty}

Guidelines:
- Explain the topic clearly and thoroughly
- Use the provided course materials as your primary source
- Structure your explanation with clear sections
- Include relevant examples from the materials
- Define key terms
- Highlight important concepts"""

        user_prompt = f"""Topic to explain: {topic}

Course Materials:
{context}

Provide a comprehensive explanation of this topic based on the course materials."""

        try:
            response = await self._call_llm(system_prompt, user_prompt, max_tokens=3000)

            source_citations = [
                {
                    "content_id": s.get('content_id', ''),
                    "title": s.get('content_title', ''),
                    "category": s.get('content_category', ''),
                    "excerpt": s.get('chunk_text', '')[:150] + "...",
                    "relevance": round(s.get('similarity', 0), 3)
                }
                for s in sources
            ]

            return {
                "success": True,
                "topic": topic,
                "explanation": response["content"],
                "difficulty": difficulty,
                "sources": source_citations,
                "tokens_used": response.get("usage", {}).get("completion_tokens")
            }

        except Exception as e:
            return {
                "success": False,
                "topic": topic,
                "explanation": f"Error generating explanation: {str(e)}",
                "difficulty": difficulty,
                "sources": [],
                "error": str(e)
            }

    async def find_code_examples(
        self,
        concept: str,
        language: str = "python",
        max_examples: int = 3
    ) -> Dict[str, Any]:
        """
        Find and explain code examples for a concept.

        Args:
            concept: Programming concept to find examples for
            language: Programming language
            max_examples: Maximum number of examples

        Returns:
            Code examples with explanations
        """
        # Search for code chunks
        code_chunks = await self.retrieval_service.search_code(
            query=f"{concept} {language}",
            language=language,
            top_k=max_examples * 2
        )

        if not code_chunks:
            # Try broader search
            chunks = await self.retrieval_service.search_chunks(
                query=f"{concept} code example {language}",
                top_k=max_examples,
                threshold=0.3
            )
            code_chunks = [
                {
                    'code': c.get('chunk_text', ''),
                    'content_title': c.get('content_title', ''),
                    'language': language,
                    'similarity': c.get('similarity', 0)
                }
                for c in chunks
            ]

        # Format code examples
        examples = []
        for chunk in code_chunks[:max_examples]:
            code = chunk.get('code', chunk.get('chunk_text', ''))

            # Get explanation for the code
            system_prompt = f"""You are a programming instructor explaining {language} code.
Be concise but thorough. Focus on what the code does and key concepts it demonstrates."""

            user_prompt = f"""Explain this code example related to "{concept}":

```{language}
{code[:1500]}
```

Provide:
1. Brief description (1-2 sentences)
2. Key concepts demonstrated
3. Any important notes"""

            try:
                response = await self._call_llm(system_prompt, user_prompt, max_tokens=500)
                explanation = response["content"]
            except:
                explanation = "Code example from course materials."

            examples.append({
                "code": code,
                "language": language,
                "source": chunk.get('content_title', 'Course materials'),
                "function_name": chunk.get('function_name'),
                "explanation": explanation,
                "relevance": round(chunk.get('similarity', 0), 3)
            })

        return {
            "success": True,
            "concept": concept,
            "language": language,
            "examples": examples,
            "total_found": len(code_chunks)
        }

    async def summarize_content(
        self,
        content_id: str,
        max_length: str = "medium"
    ) -> Dict[str, Any]:
        """
        Summarize a specific content item.

        Args:
            content_id: ID of the content to summarize
            max_length: Summary length (short/medium/long)

        Returns:
            Summary of the content
        """
        from app.core.supabase import get_supabase_admin

        supabase = get_supabase_admin()

        # Get content and its chunks
        content_result = supabase.table('content').select('*').eq('id', content_id).execute()

        if not content_result.data:
            return {
                "success": False,
                "error": "Content not found"
            }

        content = content_result.data[0]

        # Get chunks for this content
        chunks_result = supabase.table('content_chunks').select('chunk_text, chunk_type').eq('content_id', content_id).order('chunk_index').execute()

        full_text = "\n\n".join([c['chunk_text'] for c in (chunks_result.data or [])])

        if not full_text:
            full_text = content.get('text_content', content.get('description', ''))

        length_tokens = {"short": 300, "medium": 600, "long": 1000}
        max_tokens = length_tokens.get(max_length, 600)

        system_prompt = """You are a study assistant creating summaries of course materials.
Create a clear, well-organized summary that captures the key points."""

        user_prompt = f"""Summarize this course material:

Title: {content.get('title', 'Untitled')}
Category: {content.get('category', '')}
Topic: {content.get('topic', '')}

Content:
{full_text[:6000]}

Create a {max_length} summary with:
- Main topic/purpose
- Key concepts covered
- Important takeaways"""

        try:
            response = await self._call_llm(system_prompt, user_prompt, max_tokens=max_tokens)

            return {
                "success": True,
                "content_id": content_id,
                "title": content.get('title'),
                "summary": response["content"],
                "length": max_length,
                "tokens_used": response.get("usage", {}).get("completion_tokens")
            }

        except Exception as e:
            return {
                "success": False,
                "content_id": content_id,
                "error": str(e)
            }


# Singleton instance
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get or create RAG service instance"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
