"""
Pydantic schemas for Semantic Search (Part 2)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Tuple
from enum import Enum


class SearchType(str, Enum):
    semantic = "semantic"
    keyword = "keyword"
    hybrid = "hybrid"


# Request Schemas

class SemanticSearchRequest(BaseModel):
    """Request for semantic search"""
    query: str = Field(..., min_length=3, max_length=500, description="Natural language search query")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of results to return")
    threshold: float = Field(default=0.5, ge=0, le=1, description="Minimum similarity threshold")
    category: Optional[str] = Field(default=None, description="Filter by category (theory/lab)")
    content_type: Optional[str] = Field(default=None, description="Filter by content type")
    week: Optional[int] = Field(default=None, ge=1, le=52, description="Filter by week number")


class HybridSearchRequest(BaseModel):
    """Request for hybrid (keyword + semantic) search"""
    query: str = Field(..., min_length=3, max_length=500)
    top_k: int = Field(default=10, ge=1, le=50)
    keyword_weight: float = Field(default=0.3, ge=0, le=1, description="Weight for keyword search")
    semantic_weight: float = Field(default=0.7, ge=0, le=1, description="Weight for semantic search")
    category: Optional[str] = None
    content_type: Optional[str] = None


class CodeSearchRequest(BaseModel):
    """Request for code-specific search"""
    query: str = Field(..., min_length=3, max_length=500)
    language: Optional[str] = Field(default=None, description="Programming language filter")
    top_k: int = Field(default=5, ge=1, le=20)
    include_context: bool = Field(default=True, description="Include surrounding code context")


class RAGQuestionRequest(BaseModel):
    """Request for RAG-based question answering"""
    question: str = Field(..., min_length=5, max_length=1000, description="Question to answer")
    max_context_chunks: int = Field(default=5, ge=1, le=10, description="Max chunks to use as context")
    category: Optional[str] = Field(default=None, description="Limit search to category")
    include_sources: bool = Field(default=True, description="Include source citations")


class SimilarContentRequest(BaseModel):
    """Request to find similar content"""
    content_id: str = Field(..., description="Content ID to find similar items for")
    top_k: int = Field(default=5, ge=1, le=20)


# Response Schemas

class ChunkResult(BaseModel):
    """Individual chunk search result"""
    chunk_id: str
    content_id: str
    chunk_text: str
    chunk_type: str
    chunk_index: int
    similarity: float
    content_title: str
    content_category: str
    content_type: str
    content_topic: Optional[str] = None
    content_week: Optional[int] = None


class ContentResult(BaseModel):
    """Document-level search result"""
    content_id: str
    title: str
    description: Optional[str] = None
    category: str
    content_type: str
    topic: Optional[str] = None
    week: Optional[int] = None
    similarity: float
    excerpt: Optional[str] = None
    file_name: Optional[str] = None


class CodeResult(BaseModel):
    """Code search result"""
    chunk_id: str
    content_id: str
    code: str
    language: str
    function_name: Optional[str] = None
    class_name: Optional[str] = None
    similarity: float
    content_title: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None


class SourceCitation(BaseModel):
    """Source citation for RAG responses"""
    content_id: str
    title: str
    category: str
    excerpt: str
    relevance: float


class SemanticSearchResponse(BaseModel):
    """Response for semantic search"""
    success: bool
    query: str
    total_results: int
    results: List[ChunkResult]
    search_type: str = "semantic"


class ContentSearchResponse(BaseModel):
    """Response for document-level search"""
    success: bool
    query: str
    total_results: int
    results: List[ContentResult]
    search_type: str = "content"


class CodeSearchResponse(BaseModel):
    """Response for code search"""
    success: bool
    query: str
    total_results: int
    results: List[CodeResult]
    languages_found: List[str]


class RAGResponse(BaseModel):
    """Response for RAG question answering"""
    success: bool
    question: str
    answer: str
    confidence: float = Field(ge=0, le=1)
    sources: List[SourceCitation] = []
    related_topics: List[str] = []
    tokens_used: Optional[int] = None


class EmbeddingResponse(BaseModel):
    """Response for embedding generation (testing)"""
    success: bool
    text: str
    embedding_dimension: int
    model: str
