# Part 2: Intelligent Search Engine (RAG-Based) - Implementation Plan

## Overview

Build a semantic search system that allows students to query course materials using natural language, returning relevant documents, excerpts, and code snippets.

### Requirements (from Problem Statement)
- Semantic search beyond simple keyword matching
- RAG (Retrieval-Augmented Generation) based approach
- Return relevant documents, excerpts, or code snippets
- **Bonus**: Syntax-aware search for lab/code materials

---

## Current State

| Component | Status | Description |
|-----------|--------|-------------|
| Basic keyword search | ✅ Exists | `ilike` pattern matching on title, description, topic |
| Content storage | ✅ Exists | Supabase with files in storage bucket |
| Vector embeddings | ❌ Missing | No pgvector, no embedding columns |
| Semantic search | ❌ Missing | No similarity search |
| Document chunking | ❌ Missing | No text extraction/chunking |
| RAG pipeline | ❌ Missing | No retrieval-augmented generation |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Query                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Query Embedding                               │
│              (OpenAI/Voyage/Local Model)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Vector Similarity Search                       │
│                (pgvector cosine similarity)                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Content    │  │    Chunks    │  │     Code     │          │
│  │  Embeddings  │  │  Embeddings  │  │  Embeddings  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Retrieval Results                             │
│         (Top K documents + chunks + relevance scores)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RAG Response Generation                        │
│              (Claude with retrieved context)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Final Response                              │
│     (Answer + Source Citations + Relevant Excerpts)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Components

### 1. Database Schema Updates

**Enable pgvector extension:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**New Tables:**

```sql
-- Content chunks for semantic search
CREATE TABLE content_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_type VARCHAR(50), -- 'text', 'code', 'heading', 'list'
    start_page INTEGER,
    end_page INTEGER,
    embedding VECTOR(1536), -- OpenAI ada-002 dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX ON content_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add embedding to main content table for quick document-level search
ALTER TABLE content ADD COLUMN embedding VECTOR(1536);
ALTER TABLE content ADD COLUMN text_content TEXT; -- Extracted full text

CREATE INDEX ON content
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Similarity search function:**
```sql
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    content_id UUID,
    chunk_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.content_id,
        cc.chunk_text,
        1 - (cc.embedding <=> query_embedding) AS similarity
    FROM content_chunks cc
    WHERE 1 - (cc.embedding <=> query_embedding) > match_threshold
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

---

### 2. New Files to Create

| File | Purpose |
|------|---------|
| `app/services/embedding_service.py` | Generate embeddings via API |
| `app/services/chunking_service.py` | Extract and chunk document text |
| `app/services/retrieval_service.py` | Vector similarity search |
| `app/services/rag_service.py` | RAG orchestration |
| `app/routes/search.py` | Search API endpoints |
| `app/models/search_schemas.py` | Request/response schemas |

---

### 3. Embedding Service

**File:** `app/services/embedding_service.py`

```python
class EmbeddingService:
    """Generate embeddings using OpenAI or Voyage API"""

    def __init__(self):
        self.model = "text-embedding-3-small"  # or voyage-2
        self.dimension = 1536

    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        pass

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        pass

    async def embed_query(self, query: str) -> List[float]:
        """Optimized embedding for search queries"""
        pass
```

**Embedding Options:**

| Provider | Model | Dimensions | Cost | Notes |
|----------|-------|------------|------|-------|
| OpenAI | text-embedding-3-small | 1536 | $0.02/1M tokens | Best balance |
| OpenAI | text-embedding-3-large | 3072 | $0.13/1M tokens | Highest quality |
| Voyage | voyage-2 | 1024 | $0.10/1M tokens | Good for code |
| Local | all-MiniLM-L6-v2 | 384 | Free | Requires GPU |

---

### 4. Chunking Service

**File:** `app/services/chunking_service.py`

```python
class ChunkingService:
    """Extract and chunk text from documents"""

    def __init__(self):
        self.chunk_size = 512  # tokens
        self.chunk_overlap = 50

    async def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyPDF2"""
        pass

    async def extract_text_from_code(self, file_path: str) -> List[CodeChunk]:
        """Parse code into functions/classes"""
        pass

    def chunk_text(self, text: str, chunk_type: str = "text") -> List[Chunk]:
        """Split text into overlapping chunks"""
        pass

    def chunk_code(self, code: str, language: str) -> List[CodeChunk]:
        """Syntax-aware code chunking"""
        pass
```

**Chunking Strategies:**

| Content Type | Strategy |
|--------------|----------|
| PDF/Text | Fixed-size with overlap (512 tokens, 50 overlap) |
| Code | AST-based (functions, classes, blocks) |
| Slides | Per-slide chunking |
| Markdown | Section-based (by headers) |

---

### 5. Retrieval Service

**File:** `app/services/retrieval_service.py`

```python
class RetrievalService:
    """Vector similarity search and retrieval"""

    async def search_similar(
        self,
        query: str,
        top_k: int = 10,
        threshold: float = 0.7,
        filters: Optional[SearchFilters] = None
    ) -> List[SearchResult]:
        """
        Search for similar content using vector similarity

        1. Generate query embedding
        2. Search content_chunks table
        3. Apply filters (category, type, week)
        4. Return ranked results with scores
        """
        pass

    async def hybrid_search(
        self,
        query: str,
        top_k: int = 10,
        keyword_weight: float = 0.3,
        semantic_weight: float = 0.7
    ) -> List[SearchResult]:
        """
        Combine keyword and semantic search

        1. Run keyword search (existing)
        2. Run semantic search
        3. Merge and re-rank results
        """
        pass

    async def search_code(
        self,
        query: str,
        language: Optional[str] = None,
        top_k: int = 5
    ) -> List[CodeSearchResult]:
        """
        Syntax-aware code search

        1. Detect if query is about code
        2. Search code chunks with language filter
        3. Return with syntax highlighting info
        """
        pass
```

---

### 6. RAG Service

**File:** `app/services/rag_service.py`

```python
class RAGService:
    """Retrieval-Augmented Generation orchestration"""

    async def answer_question(
        self,
        question: str,
        max_context_chunks: int = 5,
        include_sources: bool = True
    ) -> RAGResponse:
        """
        Answer a question using RAG

        1. Retrieve relevant chunks
        2. Build context from chunks
        3. Generate answer with Claude
        4. Include source citations
        """
        pass

    async def explain_topic(
        self,
        topic: str,
        category: Optional[str] = None
    ) -> RAGResponse:
        """
        Explain a topic using course materials
        """
        pass

    async def find_code_examples(
        self,
        concept: str,
        language: str = "python"
    ) -> CodeExamplesResponse:
        """
        Find relevant code examples for a concept
        """
        pass
```

---

### 7. Search API Routes

**File:** `app/routes/search.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search/semantic` | POST | Semantic search with natural language |
| `/api/search/hybrid` | POST | Combined keyword + semantic search |
| `/api/search/code` | POST | Syntax-aware code search |
| `/api/search/ask` | POST | RAG-based question answering |
| `/api/search/similar/{content_id}` | GET | Find similar content |

**Request/Response Examples:**

```python
# Semantic Search Request
class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    top_k: int = Field(default=10, ge=1, le=50)
    threshold: float = Field(default=0.7, ge=0, le=1)
    category: Optional[str] = None  # theory, lab
    content_type: Optional[str] = None
    week: Optional[int] = None

# Search Result
class SearchResult(BaseModel):
    content_id: str
    title: str
    excerpt: str  # Relevant chunk text
    similarity_score: float
    category: str
    content_type: str
    file_name: Optional[str]
    highlight_positions: List[Tuple[int, int]]  # For UI highlighting

# RAG Response
class RAGResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    confidence: float
    related_topics: List[str]
```

---

### 8. Content Upload Pipeline Update

Modify upload flow to generate embeddings:

```
Upload File
    │
    ▼
Extract Text (PDF/Code/Markdown)
    │
    ▼
Chunk Text (strategy based on type)
    │
    ▼
Generate Embeddings (batch)
    │
    ▼
Store in content_chunks table
    │
    ▼
Generate document-level embedding
    │
    ▼
Update content table
```

---

## Dependencies to Add

**requirements.txt additions:**
```
openai>=1.0.0           # For embeddings API
tiktoken>=0.5.0         # Token counting for chunking
pypdf2>=3.0.0           # PDF text extraction (already exists)
sentence-transformers   # Optional: local embeddings
langchain-text-splitters # Smart text chunking
```

---

## Implementation Order

### Phase 1: Database Setup
1. Enable pgvector in Supabase
2. Create content_chunks table
3. Add embedding columns
4. Create similarity search function

### Phase 2: Core Services
1. Implement EmbeddingService (OpenAI API)
2. Implement ChunkingService
3. Update content upload to generate embeddings

### Phase 3: Search Implementation
1. Implement RetrievalService
2. Create search routes
3. Add search schemas

### Phase 4: RAG Integration
1. Implement RAGService
2. Add question-answering endpoint
3. Integrate with chat interface (Part 5)

### Phase 5: Code Search (Bonus)
1. Implement AST-based code chunking
2. Add syntax-aware search
3. Code snippet highlighting

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase_setup.sql` | Edit | Add pgvector, chunks table, functions |
| `requirements.txt` | Edit | Add openai, tiktoken, langchain |
| `app/services/embedding_service.py` | Create | Embedding generation |
| `app/services/chunking_service.py` | Create | Document chunking |
| `app/services/retrieval_service.py` | Create | Vector search |
| `app/services/rag_service.py` | Create | RAG orchestration |
| `app/routes/search.py` | Create | Search API endpoints |
| `app/models/search_schemas.py` | Create | Request/response models |
| `app/routes/__init__.py` | Edit | Add search_router |
| `app/main.py` | Edit | Include search router |
| `app/routes/content.py` | Edit | Call embedding on upload |
| `.env.example` | Edit | Add OPENAI_API_KEY |
| `app/core/config.py` | Edit | Add OpenAI config |

---

## Environment Variables

```env
# Add to .env
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

---

## Verification Steps

1. **Database**: Check pgvector extension
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

2. **Embeddings**: Test embedding generation
   ```bash
   curl -X POST http://localhost:8000/api/search/test-embedding \
     -H "Authorization: Bearer TOKEN" \
     -d '{"text": "machine learning algorithms"}'
   ```

3. **Search**: Test semantic search
   ```bash
   curl -X POST http://localhost:8000/api/search/semantic \
     -H "Authorization: Bearer TOKEN" \
     -d '{"query": "How do neural networks learn?", "top_k": 5}'
   ```

4. **RAG**: Test question answering
   ```bash
   curl -X POST http://localhost:8000/api/search/ask \
     -H "Authorization: Bearer TOKEN" \
     -d '{"question": "Explain backpropagation with examples from the course"}'
   ```

---

## Estimated Effort

| Component | Complexity | Estimated Time |
|-----------|------------|----------------|
| Database schema | Low | 1-2 hours |
| Embedding service | Medium | 2-3 hours |
| Chunking service | Medium | 3-4 hours |
| Retrieval service | Medium | 3-4 hours |
| Search routes | Low | 2-3 hours |
| RAG service | High | 4-5 hours |
| Upload pipeline update | Medium | 2-3 hours |
| Code search (bonus) | High | 4-5 hours |
| **Total** | | **~20-25 hours** |

---

## Alternative: Simpler Approach

If pgvector setup is complex, consider:

1. **Supabase Edge Functions** with built-in vector support
2. **Pinecone/Weaviate** as external vector DB
3. **ChromaDB** for local development

The plan above uses Supabase pgvector for simplicity and to keep everything in one database.
