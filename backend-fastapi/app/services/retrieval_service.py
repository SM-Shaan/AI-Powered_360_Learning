"""
Retrieval Service - Part 2
Vector similarity search and content retrieval
"""

from typing import List, Optional, Dict, Any
from app.services.embedding_service import get_embedding_service
from app.core.supabase import get_supabase_admin
import json


class RetrievalService:
    """
    Service for semantic search and content retrieval.

    Uses vector similarity search with pgvector in Supabase.
    """

    def __init__(self):
        self.embedding_service = get_embedding_service()

    async def search_chunks(
        self,
        query: str,
        top_k: int = 10,
        threshold: float = 0.5,
        category: Optional[str] = None,
        content_type: Optional[str] = None,
        week: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar content chunks using vector similarity.

        Args:
            query: Search query in natural language
            top_k: Number of results to return
            threshold: Minimum similarity threshold (0-1)
            category: Filter by category (theory/lab)
            content_type: Filter by content type
            week: Filter by week number

        Returns:
            List of matching chunks with similarity scores
        """
        # Generate query embedding
        query_embedding = await self.embedding_service.embed_query(query)

        # Call Supabase function for similarity search
        supabase = get_supabase_admin()

        try:
            # Use the RPC function we created
            result = supabase.rpc(
                'search_similar_chunks',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': threshold,
                    'match_count': top_k,
                    'filter_category': category,
                    'filter_content_type': content_type,
                    'filter_week': week
                }
            ).execute()

            if result.data:
                return result.data
            else:
                # If RPC returns empty, use fallback
                return await self._fallback_search(query_embedding, top_k, threshold, category, content_type, week)

        except Exception as e:
            print(f"RPC search error (using fallback): {e}")
            # Fallback to manual query if RPC fails
            return await self._fallback_search(query_embedding, top_k, threshold, category, content_type, week)

    async def _fallback_search(
        self,
        query_embedding: List[float],
        top_k: int,
        threshold: float,
        category: Optional[str],
        content_type: Optional[str],
        week: Optional[int]
    ) -> List[Dict[str, Any]]:
        """Fallback search using direct query if RPC not available"""
        supabase = get_supabase_admin()

        # Build query - join with content table
        query = supabase.table('content_chunks').select(
            'id, content_id, chunk_text, chunk_type, chunk_index'
        ).limit(100)  # Get more to filter

        result = query.execute()

        if not result.data:
            return []

        # Get content metadata for all chunks
        content_ids = list(set(c['content_id'] for c in result.data))
        content_result = supabase.table('content').select(
            'id, title, category, content_type, topic, week'
        ).in_('id', content_ids).execute()

        content_map = {c['id']: c for c in (content_result.data or [])}

        # Build results with content metadata
        results_with_similarity = []
        for chunk in result.data:
            content_meta = content_map.get(chunk['content_id'], {})

            # Apply filters
            if category and content_meta.get('category') != category:
                continue
            if content_type and content_meta.get('content_type') != content_type:
                continue
            if week and content_meta.get('week') != week:
                continue

            results_with_similarity.append({
                'chunk_id': chunk['id'],
                'content_id': chunk['content_id'],
                'chunk_text': chunk['chunk_text'],
                'chunk_type': chunk['chunk_type'],
                'chunk_index': chunk['chunk_index'],
                'similarity': 0.6,  # Default similarity for fallback
                'content_title': content_meta.get('title', ''),
                'content_category': content_meta.get('category', ''),
                'content_type': content_meta.get('content_type', ''),
                'content_topic': content_meta.get('topic'),
                'content_week': content_meta.get('week')
            })

        return results_with_similarity[:top_k]

    async def search_content(
        self,
        query: str,
        top_k: int = 10,
        threshold: float = 0.5,
        category: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar content at document level.

        Args:
            query: Search query
            top_k: Number of results
            threshold: Minimum similarity
            category: Filter by category
            content_type: Filter by type

        Returns:
            List of matching content items
        """
        query_embedding = await self.embedding_service.embed_query(query)
        supabase = get_supabase_admin()

        try:
            result = supabase.rpc(
                'search_similar_content',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': threshold,
                    'match_count': top_k,
                    'filter_category': category,
                    'filter_content_type': content_type
                }
            ).execute()

            return result.data if result.data else []

        except Exception as e:
            print(f"Content search error: {e}")
            return []

    async def hybrid_search(
        self,
        query: str,
        top_k: int = 10,
        keyword_weight: float = 0.3,
        semantic_weight: float = 0.7,
        category: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Combine keyword and semantic search results.

        Args:
            query: Search query
            top_k: Number of results
            keyword_weight: Weight for keyword matches (0-1)
            semantic_weight: Weight for semantic matches (0-1)
            category: Filter by category
            content_type: Filter by type

        Returns:
            Combined and re-ranked results
        """
        # Get semantic results
        semantic_results = await self.search_chunks(
            query=query,
            top_k=top_k * 2,  # Get more for merging
            threshold=0.4,
            category=category,
            content_type=content_type
        )

        # Get keyword results
        keyword_results = await self._keyword_search(query, top_k * 2, category, content_type)

        # Merge and re-rank
        combined = {}

        # Add semantic results
        for r in semantic_results:
            key = r['chunk_id']
            combined[key] = {
                **r,
                'semantic_score': r.get('similarity', 0),
                'keyword_score': 0
            }

        # Add/update keyword results
        for r in keyword_results:
            key = r.get('id', r.get('chunk_id', ''))
            if key in combined:
                combined[key]['keyword_score'] = r.get('keyword_score', 0.5)
            else:
                combined[key] = {
                    'chunk_id': key,
                    'content_id': r.get('content_id', ''),
                    'chunk_text': r.get('chunk_text', r.get('title', '')),
                    'chunk_type': r.get('chunk_type', 'text'),
                    'semantic_score': 0,
                    'keyword_score': r.get('keyword_score', 0.5),
                    'content_title': r.get('title', ''),
                    'content_category': r.get('category', ''),
                    'content_type': r.get('content_type', ''),
                    'content_topic': r.get('topic', ''),
                    'content_week': r.get('week')
                }

        # Calculate combined score
        results = []
        for key, item in combined.items():
            combined_score = (
                item['semantic_score'] * semantic_weight +
                item['keyword_score'] * keyword_weight
            )
            item['similarity'] = combined_score
            results.append(item)

        # Sort by combined score
        results.sort(key=lambda x: x['similarity'], reverse=True)

        return results[:top_k]

    async def _keyword_search(
        self,
        query: str,
        top_k: int,
        category: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Perform keyword search on content and content_chunks"""
        supabase = get_supabase_admin()
        results = []

        # 1. Search in content metadata (title, description, topic)
        search_term = f"%{query}%"
        db_query = supabase.table('content').select('*')
        db_query = db_query.or_(
            f"title.ilike.{search_term},"
            f"description.ilike.{search_term},"
            f"topic.ilike.{search_term}"
        )

        if category:
            db_query = db_query.eq('category', category)
        if content_type:
            db_query = db_query.eq('content_type', content_type)

        db_query = db_query.limit(top_k)
        result = db_query.execute()

        query_lower = query.lower()
        for item in (result.data or []):
            score = 0
            if query_lower in (item.get('title') or '').lower():
                score += 0.4
            if query_lower in (item.get('description') or '').lower():
                score += 0.3
            if query_lower in (item.get('topic') or '').lower():
                score += 0.3

            item['keyword_score'] = min(score, 1.0) if score > 0 else 0.2
            results.append(item)

        # 2. Also search directly in content_chunks for text matches
        # This is crucial for finding code/function names
        chunk_results = await self._search_chunk_text(query, top_k, category)
        results.extend(chunk_results)

        return results

    async def _search_chunk_text(
        self,
        query: str,
        top_k: int,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search directly in chunk_text for keyword matches"""
        supabase = get_supabase_admin()

        # Extract meaningful search terms
        import re
        terms = re.findall(r'\w+', query)
        terms = [t for t in terms if len(t) >= 3]  # Skip short words

        if not terms:
            return []

        results = []
        seen_chunks = set()

        for term in terms[:5]:  # Search top 5 terms
            try:
                # Search in chunk_text
                response = supabase.table('content_chunks').select(
                    'id, content_id, chunk_text, chunk_type, chunk_index'
                ).ilike('chunk_text', f'%{term}%').limit(top_k).execute()

                if not response.data:
                    continue

                # Get content metadata for matching chunks
                content_ids = list(set(c['content_id'] for c in response.data))
                content_result = supabase.table('content').select(
                    'id, title, category, content_type'
                ).in_('id', content_ids).execute()

                content_map = {c['id']: c for c in (content_result.data or [])}

                for chunk in response.data:
                    if chunk['id'] in seen_chunks:
                        continue

                    content_meta = content_map.get(chunk['content_id'], {})

                    # Apply category filter
                    if category and content_meta.get('category') != category:
                        continue

                    seen_chunks.add(chunk['id'])

                    # Calculate relevance based on match quality
                    chunk_text_lower = chunk['chunk_text'].lower()
                    term_lower = term.lower()
                    match_count = chunk_text_lower.count(term_lower)

                    results.append({
                        'chunk_id': chunk['id'],
                        'content_id': chunk['content_id'],
                        'chunk_text': chunk['chunk_text'],
                        'chunk_type': chunk['chunk_type'],
                        'content_title': content_meta.get('title', ''),
                        'content_category': content_meta.get('category', ''),
                        'content_type': content_meta.get('content_type', ''),
                        'keyword_score': min(0.3 + (match_count * 0.1), 0.9)
                    })

            except Exception as e:
                print(f"Chunk text search error for term '{term}': {e}")
                continue

        return results[:top_k]

    async def search_code(
        self,
        query: str,
        language: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for code chunks with optional language filter.

        Args:
            query: Code-related search query
            language: Programming language filter
            top_k: Number of results

        Returns:
            Code chunks with metadata
        """
        # Generate embedding for code search
        query_embedding = await self.embedding_service.embed_query(query)

        supabase = get_supabase_admin()

        # Search in chunks where chunk_type is 'code'
        db_query = supabase.table('content_chunks').select(
            '*, content:content_id(title, category, content_type, topic)'
        ).eq('chunk_type', 'code')

        if language:
            db_query = db_query.eq('metadata->>language', language)

        result = db_query.limit(top_k * 3).execute()

        # Since we can't easily do vector search here without RPC,
        # return top results based on metadata
        code_results = []
        for chunk in (result.data or []):
            code_results.append({
                'chunk_id': chunk['id'],
                'content_id': chunk['content_id'],
                'code': chunk['chunk_text'],
                'language': chunk.get('metadata', {}).get('language', 'unknown'),
                'function_name': chunk.get('metadata', {}).get('function_name'),
                'class_name': chunk.get('metadata', {}).get('class_name'),
                'similarity': 0.5,  # Placeholder without vector search
                'content_title': chunk.get('content', {}).get('title', ''),
                'line_start': chunk.get('metadata', {}).get('line_start'),
                'line_end': chunk.get('metadata', {}).get('line_end')
            })

        return code_results[:top_k]

    async def get_context_for_rag(
        self,
        query: str,
        max_chunks: int = 5,
        max_tokens: int = 3000
    ) -> tuple[str, List[Dict[str, Any]]]:
        """
        Get context for RAG by retrieving relevant chunks.

        Args:
            query: User question/query
            max_chunks: Maximum number of chunks to include
            max_tokens: Approximate max tokens for context

        Returns:
            Tuple of (combined_context, source_chunks)
        """
        # Search for relevant chunks
        chunks = await self.search_chunks(query, top_k=max_chunks * 2, threshold=0.4)

        # Build context string
        context_parts = []
        sources = []
        current_tokens = 0
        token_estimate = lambda x: len(x) // 4  # Rough estimate

        for chunk in chunks[:max_chunks]:
            chunk_text = chunk.get('chunk_text', '')
            chunk_tokens = token_estimate(chunk_text)

            if current_tokens + chunk_tokens > max_tokens:
                break

            source_info = f"[Source: {chunk.get('content_title', 'Unknown')}]"
            context_parts.append(f"{source_info}\n{chunk_text}")
            sources.append(chunk)
            current_tokens += chunk_tokens

        combined_context = "\n\n---\n\n".join(context_parts)

        return combined_context, sources

    async def find_similar_content(
        self,
        content_id: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find content similar to a given content item.

        Args:
            content_id: ID of the reference content
            top_k: Number of similar items to return

        Returns:
            List of similar content items
        """
        supabase = get_supabase_admin()

        # Get the content's embedding
        result = supabase.table('content').select('embedding, title, category, content_type').eq('id', content_id).execute()

        if not result.data or not result.data[0].get('embedding'):
            return []

        content_embedding = result.data[0]['embedding']
        content_category = result.data[0].get('category')

        # Search for similar content
        try:
            similar = supabase.rpc(
                'search_similar_content',
                {
                    'query_embedding': content_embedding,
                    'match_threshold': 0.5,
                    'match_count': top_k + 1,  # +1 to exclude self
                    'filter_category': content_category,
                    'filter_content_type': None
                }
            ).execute()

            # Filter out the original content
            results = [r for r in (similar.data or []) if r['content_id'] != content_id]
            return results[:top_k]

        except Exception as e:
            print(f"Similar content search error: {e}")
            return []


# Singleton instance
_retrieval_service: Optional[RetrievalService] = None


def get_retrieval_service() -> RetrievalService:
    """Get or create retrieval service instance"""
    global _retrieval_service
    if _retrieval_service is None:
        _retrieval_service = RetrievalService()
    return _retrieval_service
