# Part 2: Intelligent Search Engine (RAG-Based)

This document describes the semantic search and RAG system implementation.

## Overview

The search engine provides:
- **Semantic Search** - Vector similarity search using Nomic embeddings
- **Hybrid Search** - Combined keyword + semantic search
- **Code Search** - Syntax-aware code search
- **RAG Question Answering** - AI-powered answers grounded in course materials

## Setup

### 1. Database Setup (Supabase)

Run the SQL in `supabase_vector_setup.sql` in your Supabase SQL Editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Creates content_chunks table with embedding column
-- Creates similarity search functions
```

### 2. Environment Variables

Add to your `.env`:

```env
# Optional: HuggingFace token for higher rate limits
HUGGINGFACE_TOKEN=your-token
```

The Nomic embedding model works without authentication but has rate limits.

### 3. Restart Server

```bash
uvicorn app.main:app --reload
```

---

## API Endpoints

Base URL: `http://localhost:8000/api/search`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/semantic` | POST | Yes | Semantic vector search |
| `/hybrid` | POST | Yes | Combined keyword + semantic |
| `/code` | POST | Yes | Code-specific search |
| `/ask` | POST | Yes | RAG question answering |
| `/explain` | POST | Yes | Topic explanation |
| `/code-examples` | POST | Yes | Find code examples |
| `/similar/{id}` | GET | Yes | Find similar content |
| `/summarize/{id}` | POST | Yes | Summarize content |
| `/test-embedding` | GET | Yes | Test embedding generation |
| `/supported-features` | GET | No | List features |

---

## Semantic Search

### Endpoint
```
POST /api/search/semantic
```

### Request
```json
{
  "query": "How do neural networks learn?",
  "top_k": 10,
  "threshold": 0.5,
  "category": "theory",
  "content_type": null,
  "week": null
}
```

### Response
```json
{
  "success": true,
  "data": {
    "query": "How do neural networks learn?",
    "total_results": 5,
    "results": [
      {
        "chunk_id": "uuid",
        "content_id": "uuid",
        "chunk_text": "Neural networks learn through...",
        "chunk_type": "text",
        "similarity": 0.8234,
        "content_title": "Introduction to Deep Learning",
        "content_category": "theory",
        "content_type": "pdf"
      }
    ],
    "search_type": "semantic"
  }
}
```

---

## RAG Question Answering

### Endpoint
```
POST /api/search/ask
```

### Request
```json
{
  "question": "Explain backpropagation with examples from the course",
  "max_context_chunks": 5,
  "category": "theory",
  "include_sources": true
}
```

### Response
```json
{
  "success": true,
  "data": {
    "question": "Explain backpropagation...",
    "answer": "Based on the course materials, backpropagation is...",
    "confidence": 0.85,
    "sources": [
      {
        "content_id": "uuid",
        "title": "Neural Network Fundamentals",
        "category": "theory",
        "excerpt": "Backpropagation is the primary algorithm...",
        "relevance": 0.89
      }
    ],
    "related_topics": ["gradient descent", "neural networks"],
    "tokens_used": 450
  }
}
```

---

## Hybrid Search

Combines keyword matching with semantic similarity.

### Request
```json
{
  "query": "binary search tree",
  "top_k": 10,
  "keyword_weight": 0.3,
  "semantic_weight": 0.7
}
```

### Response includes both scores:
```json
{
  "results": [
    {
      "chunk_text": "...",
      "similarity": 0.75,
      "semantic_score": 0.82,
      "keyword_score": 0.45
    }
  ]
}
```

---

## Code Search

### Endpoint
```
POST /api/search/code
```

### Request
```json
{
  "query": "sorting algorithm implementation",
  "language": "python",
  "top_k": 5
}
```

### Response
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "chunk_id": "uuid",
        "code": "def quicksort(arr):\n    ...",
        "language": "python",
        "function_name": "quicksort",
        "similarity": 0.78,
        "content_title": "Lab 3: Sorting Algorithms"
      }
    ],
    "languages_found": ["python"]
  }
}
```

---

## Embedding Model

**Model:** `BAAI/bge-base-en-v1.5`
- **Dimension:** 768
- **Provider:** HuggingFace Inference API (router.huggingface.co)

### Query Prefix

BGE uses a query prefix for asymmetric search tasks:

| Task | Prefix | Usage |
|------|--------|-------|
| `search_query` | "Represent this sentence for searching relevant passages:" | Search input |
| `search_document` | None | Indexing content |

---

## Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Nomic Embedding │ (768 dimensions)
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   pgvector      │ (Cosine similarity)
│    Search       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Retrieved     │
│    Chunks       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Claude LLM     │ (RAG generation)
│   (OpenRouter)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Final Answer   │
│  with Sources   │
└─────────────────┘
```

---

## File Structure

```
app/
├── models/
│   └── search_schemas.py      # Request/response schemas
├── services/
│   ├── embedding_service.py   # Nomic embedding generation
│   ├── chunking_service.py    # Document chunking
│   ├── retrieval_service.py   # Vector similarity search
│   └── rag_service.py         # RAG orchestration
└── routes/
    └── search.py              # API endpoints
```

---

## Content Indexing Pipeline

When content is uploaded, it should be processed for search:

```
Upload File
    │
    ▼
Extract Text (PDF/Code/Markdown)
    │
    ▼
Chunk into segments (512 chars, 50 overlap)
    │
    ▼
Generate embeddings (Nomic)
    │
    ▼
Store in content_chunks table
```

### Manual Indexing (if needed)

To index existing content, create an indexing script:

```python
from app.services.chunking_service import get_chunking_service
from app.services.embedding_service import get_embedding_service

async def index_content(content_id, file_content, file_name, mime_type):
    chunking = get_chunking_service()
    embedding = get_embedding_service()

    # Extract and chunk
    full_text, chunks = chunking.process_document(file_content, file_name, mime_type)

    # Generate embeddings
    for chunk in chunks:
        chunk_embedding = await embedding.embed_document(chunk.text)
        # Store in database...
```

---

## Usage Examples

### Search for course content
```bash
curl -X POST http://localhost:8000/api/search/semantic \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning basics", "top_k": 5}'
```

### Ask a question
```bash
curl -X POST http://localhost:8000/api/search/ask \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is gradient descent?", "include_sources": true}'
```

### Find code examples
```bash
curl -X POST "http://localhost:8000/api/search/code-examples?concept=recursion&language=python" \
  -H "Authorization: Bearer TOKEN"
```

---

## Similarity Thresholds

| Threshold | Meaning |
|-----------|---------|
| 0.8+ | Very high similarity |
| 0.6-0.8 | Good match |
| 0.4-0.6 | Moderate relevance |
| <0.4 | Weak match |

Default threshold is 0.5 for balanced results.

---

## Troubleshooting

### "pgvector extension not found"
Run in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### "Embedding API rate limited"
- Add `HUGGINGFACE_TOKEN` to `.env`
- Or wait and retry (free tier has limits)

### "No search results"
- Check if content has been indexed (embeddings generated)
- Lower the threshold parameter
- Try broader search terms

### "RPC function not found"
Run the full `supabase_vector_setup.sql` script to create functions.
