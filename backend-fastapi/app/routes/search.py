"""
Search Routes - Part 2: Intelligent Search Engine
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.models.search_schemas import (
    SemanticSearchRequest, SemanticSearchResponse,
    HybridSearchRequest, CodeSearchRequest, CodeSearchResponse,
    RAGQuestionRequest, RAGResponse,
    SimilarContentRequest, ContentSearchResponse,
    ChunkResult, ContentResult, CodeResult, SourceCitation
)
from app.services.retrieval_service import get_retrieval_service
from app.services.rag_service import get_rag_service
from app.services.embedding_service import get_embedding_service
from app.services.indexing_service import get_indexing_service
from app.core.security import get_current_user, require_admin

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/semantic", response_model=dict)
async def semantic_search(
    request: SemanticSearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Perform semantic search using natural language.

    Uses vector similarity to find relevant content chunks based on meaning,
    not just keyword matching.

    Returns ranked results with similarity scores.
    """
    retrieval_service = get_retrieval_service()

    try:
        results = await retrieval_service.search_chunks(
            query=request.query,
            top_k=request.top_k,
            threshold=request.threshold,
            category=request.category,
            content_type=request.content_type,
            week=request.week
        )

        # Format results
        formatted_results = [
            ChunkResult(
                chunk_id=str(r.get('chunk_id', '')),
                content_id=str(r.get('content_id', '')),
                chunk_text=r.get('chunk_text', ''),
                chunk_type=r.get('chunk_type', 'text'),
                chunk_index=r.get('chunk_index', 0),
                similarity=round(r.get('similarity', 0), 4),
                content_title=r.get('content_title', ''),
                content_category=r.get('content_category', ''),
                content_type=r.get('content_type', ''),
                content_topic=r.get('content_topic'),
                content_week=r.get('content_week')
            )
            for r in results
        ]

        return {
            "success": True,
            "data": {
                "query": request.query,
                "total_results": len(formatted_results),
                "results": [r.model_dump() for r in formatted_results],
                "search_type": "semantic"
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search error: {str(e)}"
        )


@router.post("/hybrid", response_model=dict)
async def hybrid_search(
    request: HybridSearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Perform hybrid search combining keyword and semantic matching.

    Weights can be adjusted to favor either approach:
    - Higher keyword_weight: Better for exact matches
    - Higher semantic_weight: Better for conceptual matches
    """
    retrieval_service = get_retrieval_service()

    try:
        results = await retrieval_service.hybrid_search(
            query=request.query,
            top_k=request.top_k,
            keyword_weight=request.keyword_weight,
            semantic_weight=request.semantic_weight,
            category=request.category,
            content_type=request.content_type
        )

        formatted_results = [
            {
                "chunk_id": str(r.get('chunk_id', '')),
                "content_id": str(r.get('content_id', '')),
                "chunk_text": r.get('chunk_text', ''),
                "similarity": round(r.get('similarity', 0), 4),
                "semantic_score": round(r.get('semantic_score', 0), 4),
                "keyword_score": round(r.get('keyword_score', 0), 4),
                "content_title": r.get('content_title', ''),
                "content_category": r.get('content_category', ''),
                "content_type": r.get('content_type', '')
            }
            for r in results
        ]

        return {
            "success": True,
            "data": {
                "query": request.query,
                "total_results": len(formatted_results),
                "results": formatted_results,
                "search_type": "hybrid",
                "weights": {
                    "keyword": request.keyword_weight,
                    "semantic": request.semantic_weight
                }
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hybrid search error: {str(e)}"
        )


@router.post("/code", response_model=dict)
async def code_search(
    request: CodeSearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Search for code examples and snippets.

    Syntax-aware search that understands code structure.
    Can filter by programming language.
    """
    retrieval_service = get_retrieval_service()

    try:
        results = await retrieval_service.search_code(
            query=request.query,
            language=request.language,
            top_k=request.top_k
        )

        formatted_results = [
            CodeResult(
                chunk_id=str(r.get('chunk_id', '')),
                content_id=str(r.get('content_id', '')),
                code=r.get('code', ''),
                language=r.get('language', 'unknown'),
                function_name=r.get('function_name'),
                class_name=r.get('class_name'),
                similarity=round(r.get('similarity', 0), 4),
                content_title=r.get('content_title', ''),
                line_start=r.get('line_start'),
                line_end=r.get('line_end')
            )
            for r in results
        ]

        # Get unique languages found
        languages = list(set(r.language for r in formatted_results))

        return {
            "success": True,
            "data": {
                "query": request.query,
                "total_results": len(formatted_results),
                "results": [r.model_dump() for r in formatted_results],
                "languages_found": languages
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code search error: {str(e)}"
        )


@router.post("/ask", response_model=dict)
async def ask_question(
    request: RAGQuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Ask a question and get an AI-generated answer based on course materials.

    Uses Retrieval-Augmented Generation (RAG):
    1. Retrieves relevant content from course materials
    2. Uses retrieved context to generate accurate answer
    3. Includes source citations for verification

    Best for:
    - Questions about course content
    - Clarification of concepts
    - Finding specific information
    """
    rag_service = get_rag_service()

    try:
        result = await rag_service.answer_question(
            question=request.question,
            max_context_chunks=request.max_context_chunks,
            category=request.category,
            include_sources=request.include_sources
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to generate answer")
            )

        return {"success": True, "data": result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG error: {str(e)}"
        )


@router.post("/explain", response_model=dict)
async def explain_topic(
    topic: str = Query(..., min_length=3, max_length=200),
    category: str = Query(default=None),
    difficulty: str = Query(default="intermediate"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get an explanation of a topic based on course materials.

    Retrieves relevant content and generates a comprehensive explanation.
    """
    rag_service = get_rag_service()

    try:
        result = await rag_service.explain_topic(
            topic=topic,
            category=category,
            difficulty=difficulty
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explanation error: {str(e)}"
        )


@router.post("/code-examples", response_model=dict)
async def find_code_examples(
    concept: str = Query(..., min_length=3, max_length=200),
    language: str = Query(default="python"),
    max_examples: int = Query(default=3, ge=1, le=10),
    current_user: dict = Depends(get_current_user)
):
    """
    Find code examples for a programming concept.

    Searches lab materials for relevant code and provides explanations.
    """
    rag_service = get_rag_service()

    try:
        result = await rag_service.find_code_examples(
            concept=concept,
            language=language,
            max_examples=max_examples
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code examples error: {str(e)}"
        )


@router.get("/similar/{content_id}", response_model=dict)
async def find_similar_content(
    content_id: str,
    top_k: int = Query(default=5, ge=1, le=20),
    current_user: dict = Depends(get_current_user)
):
    """
    Find content similar to a specific item.

    Useful for "related content" recommendations.
    """
    retrieval_service = get_retrieval_service()

    try:
        results = await retrieval_service.find_similar_content(
            content_id=content_id,
            top_k=top_k
        )

        return {
            "success": True,
            "data": {
                "reference_content_id": content_id,
                "similar_content": results
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similar content error: {str(e)}"
        )


@router.post("/summarize/{content_id}", response_model=dict)
async def summarize_content(
    content_id: str,
    length: str = Query(default="medium", regex="^(short|medium|long)$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a summary of specific course content.

    Length options:
    - short: ~100 words
    - medium: ~200 words
    - long: ~400 words
    """
    rag_service = get_rag_service()

    try:
        result = await rag_service.summarize_content(
            content_id=content_id,
            max_length=length
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result.get("error", "Content not found")
            )

        return {"success": True, "data": result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarization error: {str(e)}"
        )


@router.get("/test-embedding", response_model=dict)
async def test_embedding(
    text: str = Query(..., min_length=3, max_length=500),
    current_user: dict = Depends(get_current_user)
):
    """
    Test endpoint for embedding generation.

    Generates an embedding for the provided text.
    Useful for debugging and verification.
    """
    embedding_service = get_embedding_service()

    try:
        embedding = await embedding_service.embed_text(text)

        return {
            "success": True,
            "data": {
                "text": text[:100] + "..." if len(text) > 100 else text,
                "embedding_dimension": len(embedding),
                "model": "BAAI/bge-base-en-v1.5",
                "embedding_preview": embedding[:5]  # First 5 values as preview
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Embedding error: {str(e)}"
        )


@router.get("/supported-features", response_model=dict)
async def get_supported_features():
    """
    Get information about supported search features.
    """
    return {
        "success": True,
        "data": {
            "search_types": [
                {"type": "semantic", "description": "Vector similarity search using embeddings"},
                {"type": "hybrid", "description": "Combined keyword and semantic search"},
                {"type": "code", "description": "Syntax-aware code search"}
            ],
            "rag_features": [
                {"feature": "ask", "description": "Question answering with sources"},
                {"feature": "explain", "description": "Topic explanations from materials"},
                {"feature": "code-examples", "description": "Find and explain code examples"},
                {"feature": "summarize", "description": "Summarize course content"}
            ],
            "embedding_model": {
                "name": "BAAI/bge-base-en-v1.5",
                "dimension": 768,
                "note": "BGE model uses query prefix for search queries"
            },
            "filters": ["category", "content_type", "week", "language"]
        }
    }


# ==================== INDEXING ENDPOINTS ====================

@router.post("/index/{content_id}", response_model=dict)
async def index_content(
    content_id: str,
    admin: dict = Depends(require_admin)
):
    """
    Index a specific content item for semantic search.

    Extracts text, creates chunks, generates embeddings, and stores in database.
    Admin only.
    """
    indexing_service = get_indexing_service()

    try:
        result = await indexing_service.index_content(content_id)

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Indexing failed")
            )

        return {"success": True, "data": result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Indexing error: {str(e)}"
        )


@router.post("/index-all", response_model=dict)
async def index_all_content(
    category: str = Query(default=None, description="Filter by category (theory/lab)"),
    admin: dict = Depends(require_admin)
):
    """
    Index all content in the database.

    Processes all content items and creates searchable chunks.
    Admin only. May take a while for large datasets.
    """
    indexing_service = get_indexing_service()

    try:
        result = await indexing_service.index_all_content(category=category)
        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Indexing error: {str(e)}"
        )


@router.post("/reindex/{content_id}", response_model=dict)
async def reindex_content(
    content_id: str,
    admin: dict = Depends(require_admin)
):
    """
    Reindex a content item (delete existing chunks and recreate).

    Use when content has been updated.
    Admin only.
    """
    indexing_service = get_indexing_service()

    try:
        result = await indexing_service.reindex_content(content_id)

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Reindexing failed")
            )

        return {"success": True, "data": result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reindexing error: {str(e)}"
        )


@router.get("/index-status", response_model=dict)
async def get_index_status(
    content_id: str = Query(default=None, description="Specific content ID (optional)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get indexing status.

    Without content_id: Returns overall indexing statistics.
    With content_id: Returns status for specific content.
    """
    indexing_service = get_indexing_service()

    try:
        result = await indexing_service.get_index_status(content_id)
        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status error: {str(e)}"
        )
