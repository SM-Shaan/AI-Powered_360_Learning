# Part 4: Content Validation & Evaluation System

## Overview

Part 4 implements a comprehensive validation and evaluation system for AI-generated content to ensure correctness, relevance, and academic reliability.

## Implementation Status

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Syntax checking/linting for code | ✅ Complete | Python AST, JS bracket matching |
| Reference grounding checks | ✅ Complete | Term matching against course materials |
| Rule-based/rubric evaluation | ✅ Complete | Structure validation with rules |
| Automated test cases for code | ✅ Complete | Sandboxed Python execution |
| AI-assisted self-evaluation | ✅ Complete | Claude-based scoring (1-5) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Validation Service                            │
│                (validation_service.py)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Code      │  │   Theory     │  │   AI Evaluation      │  │
│  │  Validation  │  │  Validation  │  │   (Claude API)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                 │                     │               │
│         ▼                 ▼                     ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ - Syntax     │  │ - Structure  │  │ Scores (1-5):        │  │
│  │ - Security   │  │ - Grounding  │  │ - Accuracy           │  │
│  │ - Execution  │  │ - Word count │  │ - Relevance          │  │
│  │ - Tests      │  │ - Sections   │  │ - Coherence          │  │
│  └──────────────┘  └──────────────┘  │ - Completeness       │  │
│                                       └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. Validate Code
```
POST /api/validate/code
```

**Request:**
```json
{
  "code": "def hello():\n    print('Hello')",
  "language": "python",
  "test_code": "hello()",
  "validation_level": "full"
}
```

**Response:**
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
      "stdout": "Hello\n",
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
        "overall": 4.25
      },
      "strengths": ["Clean syntax", "Works correctly"],
      "improvements": ["Add docstring", "Add error handling"]
    },
    "is_valid": true,
    "overall_score": 4.25,
    "summary": "Syntax valid. Execution successful. AI score: 4.25/5"
  }
}
```

### 2. Validate Theory Content
```
POST /api/validate/theory
```

**Request:**
```json
{
  "content": "# Binary Search\n\n## Overview\nBinary search is...",
  "topic": "Binary Search Algorithm",
  "content_ids": ["uuid-of-course-material"],
  "validation_level": "full"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content_type": "theory",
    "structure": {
      "has_overview": true,
      "has_key_concepts": true,
      "has_examples": true,
      "has_summary": false,
      "section_count": 4,
      "word_count": 350,
      "issues": [
        {
          "severity": "warning",
          "message": "Missing summary section",
          "suggestion": "Add a summary at the end"
        }
      ]
    },
    "grounding": {
      "is_grounded": true,
      "matched_terms": ["Binary Search", "Algorithm", "Array"],
      "confidence": 0.75,
      "sources_checked": 1
    },
    "ai_evaluation": {
      "scores": {
        "accuracy": 5,
        "relevance": 5,
        "coherence": 4,
        "completeness": 4,
        "overall": 4.5
      }
    },
    "is_valid": true,
    "overall_score": 4.5,
    "summary": "4 sections, 350 words. Grounded (75% confidence). AI score: 4.5/5"
  }
}
```

### 3. Validate Any Generated Content
```
POST /api/validate/content
```

**Request:**
```json
{
  "content": "Generated content here...",
  "content_type": "code|theory|slides|quiz",
  "topic": "Topic name",
  "language": "python",
  "validation_level": "full"
}
```

### 4. Quick Syntax Check (No Auth Required)
```
POST /api/validate/quick-check?language=python
Body: raw code string
```

### 5. Get Supported Checks
```
GET /api/validate/supported-checks
```

## Validation Levels

| Level | Syntax | Security | Execution | AI Evaluation |
|-------|--------|----------|-----------|---------------|
| `syntax_only` | ✅ | ✅ | ❌ | ❌ |
| `with_execution` | ✅ | ✅ | ✅ | ❌ |
| `full` | ✅ | ✅ | ✅ | ✅ |

## Features Detailed

### 1. Code Syntax Validation

**Python (Full Support):**
- AST parsing for syntax errors
- Line number identification
- Error message extraction

**JavaScript/TypeScript (Basic):**
- Bracket matching
- Common syntax issues

### 2. Security Checks

Blocked patterns for Python:
- Dangerous imports: `os`, `subprocess`, `socket`, etc.
- Dangerous functions: `eval()`, `exec()`, `__import__()`
- File operations: `open()` with write mode

### 3. Code Execution

- Sandboxed subprocess execution
- Configurable timeout (default 10s)
- Test code support
- Output capture (stdout/stderr)

### 4. Structure Validation (Theory)

Checks for:
- Overview/Introduction section
- Key Concepts section
- Examples
- Summary/Conclusion
- Minimum word count (100 words)
- Section organization (markdown headers)

### 5. Reference Grounding

- Extracts key terms from generated content
- Compares against uploaded course materials
- Calculates confidence score
- Reports matched/unmatched terms

### 6. AI Evaluation

Uses Claude to score content on:
- **Accuracy (1-5)**: Factual correctness
- **Relevance (1-5)**: Addresses the topic
- **Coherence (1-5)**: Well-organized
- **Completeness (1-5)**: Covers key concepts

Also provides:
- Strengths list
- Improvements list
- Explanation

---

## Testing Guide

### Test 1: Python Syntax Validation

**Test Valid Code:**
```bash
curl -X POST http://localhost:8000/api/validate/quick-check?language=python \
  -H "Content-Type: text/plain" \
  -d "def add(a, b):
    return a + b"
```

**Expected:** `is_valid: true`

**Test Invalid Code:**
```bash
curl -X POST http://localhost:8000/api/validate/quick-check?language=python \
  -H "Content-Type: text/plain" \
  -d "def add(a, b)
    return a + b"
```

**Expected:** `is_valid: false`, error at line 1 (missing colon)

---

### Test 2: Code Execution with Tests

```bash
curl -X POST http://localhost:8000/api/validate/code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)",
    "language": "python",
    "test_code": "assert factorial(5) == 120\nassert factorial(0) == 1\nprint(\"All tests passed!\")",
    "validation_level": "with_execution"
  }'
```

**Expected:**
- `syntax.is_valid: true`
- `execution.success: true`
- `execution.stdout: "All tests passed!\n"`

---

### Test 3: Security Check

```bash
curl -X POST http://localhost:8000/api/validate/code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "import os\nos.system(\"rm -rf /\")",
    "language": "python",
    "validation_level": "syntax_only"
  }'
```

**Expected:**
- `is_valid: true` (syntax is valid)
- `issues` contains warning about unsafe import `os`

---

### Test 4: Theory Validation

```bash
curl -X POST http://localhost:8000/api/validate/theory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "# Binary Search\n\n## Overview\nBinary search is an efficient algorithm for finding an item in a sorted list.\n\n## How It Works\n1. Compare target with middle element\n2. If equal, found\n3. If less, search left half\n4. If greater, search right half\n\n## Example\nSearching for 7 in [1,3,5,7,9]:\n- Middle: 5, 7 > 5, search right\n- Middle: 7, found!\n\n## Time Complexity\nO(log n) - very efficient for large datasets.",
    "topic": "Binary Search Algorithm",
    "validation_level": "full"
  }'
```

**Expected:**
- `structure.has_overview: true`
- `structure.has_examples: true`
- `structure.section_count: 4`
- `grounding.is_grounded: true`
- `ai_evaluation.scores.overall: 4+`

---

### Test 5: Full Code Validation with AI

```bash
curl -X POST http://localhost:8000/api/validate/code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "def binary_search(arr, target):\n    \"\"\"Search for target in sorted array.\"\"\"\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
    "language": "python",
    "test_code": "assert binary_search([1,2,3,4,5], 3) == 2\nassert binary_search([1,2,3,4,5], 6) == -1\nprint(\"Tests passed!\")",
    "validation_level": "full"
  }'
```

**Expected:**
- `syntax.is_valid: true`
- `execution.success: true`
- `ai_evaluation.evaluated: true`
- `ai_evaluation.scores.accuracy: 5`
- `overall_score: 4+`

---

### Test 6: JavaScript Validation

```bash
curl -X POST http://localhost:8000/api/validate/quick-check?language=javascript \
  -H "Content-Type: text/plain" \
  -d "function add(a, b) {
    return a + b;
}"
```

**Expected:** `is_valid: true`

**Test with unmatched brackets:**
```bash
curl -X POST http://localhost:8000/api/validate/quick-check?language=javascript \
  -H "Content-Type: text/plain" \
  -d "function add(a, b) {
    return a + b;"
```

**Expected:** `is_valid: false`, issue about unclosed bracket

---

### Test 7: Generic Content Validation

```bash
curl -X POST http://localhost:8000/api/validate/content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "# Quiz: Data Structures\n\n1. What is O(1)?\n   a) Constant time\n   b) Linear time\n   c) Quadratic time\n\n2. Which data structure uses LIFO?\n   a) Queue\n   b) Stack\n   c) Array",
    "content_type": "quiz",
    "topic": "Data Structures",
    "validation_level": "full"
  }'
```

---

## Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "Part 4 - Validation API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Quick Syntax Check",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/validate/quick-check?language=python",
        "body": {
          "mode": "raw",
          "raw": "def hello():\n    print('Hello')"
        }
      }
    },
    {
      "name": "Validate Code (Full)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/validate/code",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"code\": \"def add(a,b): return a+b\", \"language\": \"python\", \"validation_level\": \"full\"}"
        }
      }
    },
    {
      "name": "Validate Theory",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/validate/theory",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"content\": \"# Topic\\n\\n## Overview\\nContent here...\", \"topic\": \"Test Topic\", \"validation_level\": \"full\"}"
        }
      }
    },
    {
      "name": "Get Supported Checks",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/validate/supported-checks"
      }
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:8000"},
    {"key": "token", "value": "your-jwt-token"}
  ]
}
```

---

## Frontend Integration

The validation can be triggered from the Generate page after content is generated:

```javascript
// After generating content
const validateContent = async (content, type, topic) => {
  const response = await fetch('/api/validate/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      content: content,
      content_type: type,
      topic: topic,
      validation_level: 'full'
    })
  });
  return response.json();
};

// Display validation results
const showValidation = (result) => {
  console.log('Valid:', result.is_valid);
  console.log('Score:', result.overall_score);
  console.log('Summary:', result.summary);

  if (result.ai_evaluation) {
    console.log('Strengths:', result.ai_evaluation.strengths);
    console.log('Improvements:', result.ai_evaluation.improvements);
  }
};
```

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| 401 Unauthorized | Missing/invalid token | Login and use valid JWT |
| 500 Validation Error | Code execution timeout | Reduce code complexity |
| AI evaluation failed | API key issue | Check OPENROUTER_API_KEY |

---

## Files

```
backend-fastapi/
├── app/
│   ├── models/
│   │   └── validation_schemas.py    # Pydantic schemas
│   ├── routes/
│   │   └── validation.py            # API endpoints
│   └── services/
│       └── validation_service.py    # Validation logic
```
