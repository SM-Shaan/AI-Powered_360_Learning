# Part 4: Content Validation & Evaluation System

This document describes the Content Validation & Evaluation System for validating AI-generated content.

## Overview

The validation system ensures AI-generated content is:
- **Correct** - Syntactically valid and executable
- **Relevant** - Addresses the intended topic
- **Academically reliable** - Well-structured and grounded in course materials

## Validation Approaches

Based on the hackathon requirements, the system implements:

| Approach | Implementation |
|----------|----------------|
| Syntax checking/compilation | Python AST parsing, JS bracket matching |
| Reference grounding checks | Compare against uploaded course materials |
| Rule-based evaluation | Structure checks (sections, word count) |
| Automated test cases | Sandboxed Python execution with tests |
| AI-assisted evaluation | Claude-based quality scoring with rubric |

---

## API Endpoints

Base URL: `http://localhost:8000/api/validate`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/code` | POST | Yes | Validate generated code |
| `/theory` | POST | Yes | Validate theory content |
| `/content` | POST | Yes | Auto-route based on content type |
| `/quick-check` | POST | No | Fast syntax check only |
| `/supported-checks` | GET | No | List validation capabilities |

---

## Code Validation

### Endpoint
```
POST /api/validate/code
```

### Request Body
```json
{
  "code": "def hello():\n    print('Hello World')",
  "language": "python",
  "test_code": "hello()",
  "validation_level": "full"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Code to validate |
| `language` | string | No | Programming language (default: python) |
| `test_code` | string | No | Optional test code to execute |
| `validation_level` | enum | No | `syntax_only`, `with_execution`, `full` |

### Validation Levels

| Level | Description | Speed |
|-------|-------------|-------|
| `syntax_only` | Only check syntax | Fast |
| `with_execution` | Syntax + run code in sandbox | Medium |
| `full` | All checks including AI evaluation | Slow |

### Response
```json
{
  "success": true,
  "data": {
    "content_type": "code",
    "syntax": {
      "is_valid": true,
      "language": "python",
      "issues": [],
      "error_message": null
    },
    "execution": {
      "executed": true,
      "success": true,
      "stdout": "Hello World\n",
      "stderr": null,
      "return_code": 0,
      "timeout": false
    },
    "ai_evaluation": {
      "evaluated": true,
      "scores": {
        "accuracy": 5,
        "relevance": 4,
        "coherence": 5,
        "completeness": 3,
        "overall": 4.3
      },
      "explanation": "Well-written code...",
      "strengths": ["Clear implementation"],
      "improvements": ["Add error handling"]
    },
    "is_valid": true,
    "overall_score": 4.3,
    "summary": "Syntax valid. Execution successful. AI score: 4.3/5"
  }
}
```

### Supported Languages

| Language | Syntax Check | Execution | Notes |
|----------|--------------|-----------|-------|
| Python | ✅ Full (AST) | ✅ Yes | Full support |
| JavaScript | ✅ Basic | ❌ No | Bracket matching only |
| TypeScript | ✅ Basic | ❌ No | Bracket matching only |
| C/C++ | ❌ No | ❌ No | Planned |
| Others | ❌ No | ❌ No | - |

### Security Checks (Blocked Operations)

The following are blocked during code execution:

**Blocked Imports:**
```
os, subprocess, shutil, sys, socket, requests, urllib, http,
ftplib, telnetlib, smtplib, pickle, shelve, marshal, importlib
```

**Blocked Functions:**
```
eval(), exec(), __import__(), compile(), open() with write mode
```

**Execution Limits:**
| Setting | Value |
|---------|-------|
| Timeout | 10 seconds |
| Max stdout | 5000 characters |
| Max stderr | 2000 characters |

---

## Theory Validation

### Endpoint
```
POST /api/validate/theory
```

### Request Body
```json
{
  "content": "# Machine Learning\n\n## Overview\n...",
  "topic": "machine learning",
  "content_ids": ["uuid-1", "uuid-2"],
  "validation_level": "full"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Theory content (markdown) |
| `topic` | string | Yes | Topic of the content |
| `content_ids` | array | No | Course material IDs for grounding check |
| `validation_level` | enum | No | `syntax_only`, `full` |

### Response
```json
{
  "success": true,
  "data": {
    "content_type": "theory",
    "structure": {
      "has_overview": true,
      "has_key_concepts": true,
      "has_examples": true,
      "has_summary": true,
      "section_count": 5,
      "word_count": 250,
      "issues": []
    },
    "grounding": {
      "is_grounded": true,
      "matched_terms": ["neural network", "supervised learning"],
      "confidence": 0.75,
      "sources_checked": 3
    },
    "ai_evaluation": {
      "evaluated": true,
      "scores": {
        "accuracy": 4,
        "relevance": 5,
        "coherence": 4,
        "completeness": 3,
        "overall": 4.0
      },
      "explanation": "Good coverage of basics...",
      "strengths": ["Accurate information"],
      "improvements": ["Add more examples"]
    },
    "is_valid": true,
    "overall_score": 4.0,
    "summary": "5 sections, 250 words. Grounded (75% confidence). AI score: 4.0/5"
  }
}
```

### Structure Validation

Checks for presence of:
- Overview/Introduction section
- Key Concepts section
- Examples
- Summary/Conclusion
- Adequate word count (warns if < 100 words)
- Section organization (markdown headers)

### Grounding Check

The grounding check compares generated content against course materials:
1. Extracts key terms from generated content
2. Fetches specified course materials from database
3. Matches terms against material titles, descriptions, topics, tags
4. Calculates confidence score (0-1)

---

## Quick Syntax Check

Fast, unauthenticated syntax validation for real-time UI feedback.

### Endpoint
```
POST /api/validate/quick-check?code={code}&language={language}
```

### Response
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "language": "python",
    "issues": [],
    "error_message": null
  }
}
```

---

## AI Evaluation Criteria

| Criterion | Description | Score Range |
|-----------|-------------|-------------|
| **Accuracy** | Is the content factually correct? | 1-5 |
| **Relevance** | Does it address the given topic? | 1-5 |
| **Coherence** | Is it well-organized and easy to follow? | 1-5 |
| **Completeness** | Does it cover the key concepts? | 1-5 |
| **Overall** | Average of all scores | 1-5 |

### Score Interpretation

| Score | Meaning |
|-------|---------|
| 4.5-5.0 | Excellent |
| 3.5-4.4 | Good |
| 2.5-3.4 | Acceptable |
| 1.5-2.4 | Needs improvement |
| 1.0-1.4 | Poor |

---

## Error Handling

### Syntax Errors
```json
{
  "syntax": {
    "is_valid": false,
    "issues": [
      {
        "severity": "error",
        "message": "'(' was never closed",
        "line": 1,
        "suggestion": "Fix the syntax error at the indicated line"
      }
    ],
    "error_message": "Syntax error at line 1: '(' was never closed"
  }
}
```

### Execution Timeout
```json
{
  "execution": {
    "executed": true,
    "success": false,
    "timeout": true,
    "stderr": "Execution timed out after 10 seconds",
    "error": "Timeout"
  }
}
```

### Security Block
```json
{
  "execution": {
    "executed": false,
    "success": false,
    "stderr": "Code contains blocked operations",
    "error": "Execution blocked due to security concerns"
  }
}
```

---

## Usage Examples

### Validate Python Code with Tests
```bash
curl -X POST http://localhost:8000/api/validate/code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "def add(a, b):\n    return a + b",
    "language": "python",
    "test_code": "assert add(2, 3) == 5\nassert add(-1, 1) == 0\nprint(\"All tests passed!\")",
    "validation_level": "with_execution"
  }'
```

### Validate Theory Content with Grounding
```bash
curl -X POST http://localhost:8000/api/validate/theory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "# Neural Networks\n\n## Overview\nNeural networks are...",
    "topic": "neural networks",
    "content_ids": ["content-uuid-1", "content-uuid-2"],
    "validation_level": "full"
  }'
```

### Quick Syntax Check (No Auth)
```bash
curl -X POST "http://localhost:8000/api/validate/quick-check" \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"hello\")", "language": "python"}'
```

### Get Supported Checks
```bash
curl http://localhost:8000/api/validate/supported-checks
```

---

## Architecture

```
app/
├── models/
│   └── validation_schemas.py    # Request/response Pydantic models
├── services/
│   └── validation_service.py    # Core validation logic
└── routes/
    └── validation.py            # API endpoints
```

### Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Code Validation                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Syntax  │───▶│ Security │───▶│Execution │───▶│    AI    │  │
│  │  Check   │    │  Check   │    │(Sandbox) │    │Evaluation│  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Combined Result                        │   │
│  │  • is_valid: bool                                       │   │
│  │  • overall_score: float                                 │   │
│  │  • summary: string                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       Theory Validation                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │Structure │───▶│Grounding │───▶│    AI    │                  │
│  │  Check   │    │  Check   │    │Evaluation│                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│       │               │               │                         │
│       ▼               ▼               ▼                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Combined Result                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration

The validation service uses OpenRouter API for AI evaluation:

```env
OPENROUTER_API_KEY=your-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## Integration with Part 3 (Generation)

Validation can be integrated with content generation:

```python
# Generate content
result = await generation_service.generate_lab_code(topic="sorting")

# Validate the generated code
validation = await validation_service.validate_code(
    code=result["content"],
    language="python",
    run_ai_evaluation=True,
    topic=topic
)

# Return both
return {
    "generated": result,
    "validation": validation
}
```

---

## Troubleshooting

### "OpenRouter API key not configured"
Add `OPENROUTER_API_KEY` to your `.env` file.

### Code execution blocked
Check if code contains blocked imports or functions. See Security Checks section.

### Low grounding confidence
- Ensure course materials are indexed (Part 2)
- Provide `content_ids` for specific materials to check against
- Use more specific topic descriptions

### AI evaluation returns null scores
- Check OpenRouter API key is valid
- Check API rate limits
- Response may have failed to parse as JSON
