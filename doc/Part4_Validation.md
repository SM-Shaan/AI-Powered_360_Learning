# Part 4: Content Validation & Evaluation System

This document describes the Content Validation & Evaluation System for validating AI-generated content.

## Overview

The validation system ensures AI-generated content is:
- **Correct** - Syntactically valid and executable
- **Relevant** - Addresses the intended topic
- **Academically reliable** - Well-structured and grounded in facts

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

| Level | Description |
|-------|-------------|
| `syntax_only` | Only check syntax (fastest) |
| `with_execution` | Syntax + run code in sandbox |
| `full` | All checks including AI evaluation |

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

| Language | Syntax Check | Execution |
|----------|--------------|-----------|
| Python | ✅ Full (AST) | ✅ Yes |
| JavaScript | ✅ Basic | ❌ No |
| TypeScript | ✅ Basic | ❌ No |
| Others | ❌ No | ❌ No |

### Security Checks

The following are blocked during code execution:
- Dangerous imports: `os`, `subprocess`, `socket`, `requests`, etc.
- Dangerous functions: `eval()`, `exec()`, `__import__()`
- File write operations
- Network operations

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
| `validation_level` | enum | No | `syntax_only`, `with_execution`, `full` |

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

---

## Quick Syntax Check

Fast, unauthenticated syntax validation for real-time UI feedback.

### Endpoint
```
POST /api/validate/quick-check?code={code}&language={language}
```

### Example
```bash
curl -X POST "http://localhost:8000/api/validate/quick-check?code=def%20hello():%0A%20%20print('hi')&language=python"
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

---

## Error Handling

### Syntax Errors
```json
{
  "success": true,
  "data": {
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
}
```

### Execution Timeout
```json
{
  "execution": {
    "executed": true,
    "success": false,
    "timeout": true,
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

### Validate Theory Content
```bash
curl -X POST http://localhost:8000/api/validate/theory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "# Neural Networks\n\n## Overview\nNeural networks are...",
    "topic": "neural networks",
    "validation_level": "full"
  }'
```

### Quick Syntax Check (No Auth)
```bash
curl -X POST "http://localhost:8000/api/validate/quick-check?code=print('hello')&language=python"
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
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Request   │────▶│   Syntax     │────▶│  Execution  │
│             │     │  Validation  │     │  (Python)   │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Response   │◀────│   Combine    │◀────│     AI      │
│             │     │   Results    │     │  Evaluation │
└─────────────┘     └──────────────┘     └─────────────┘
```

---

## Configuration

The validation service uses the same OpenRouter API configuration as the generation service:

```env
OPENROUTER_API_KEY=your-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Execution Limits

| Setting | Value |
|---------|-------|
| Timeout | 10 seconds |
| Max output | 5000 characters |
| Max error output | 2000 characters |
