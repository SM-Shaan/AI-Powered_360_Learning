# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

# Authentication Endpoints

## Register User
```
POST /api/auth/register
```

Creates a new user account.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Unique username (3-50 chars) |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 6 chars) |
| role | string | No | "student" (default) or "admin" |

**Example Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "student"
}
```

**Example Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2024-01-29T10:30:00Z"
  }
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Invalid input / Email already exists |
| 422 | Validation error |

---

## Login
```
POST /api/auth/login
```

Authenticates user and returns JWT token.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email |
| password | string | Yes | User's password |

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 401 | Invalid email or password |

---

## Get Current User
```
GET /api/auth/me
```

Returns the currently authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2024-01-29T10:30:00Z",
    "updated_at": "2024-01-29T10:30:00Z"
  }
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 401 | Not authenticated / Invalid token |

---

## Update Profile
```
PUT /api/auth/profile
```

Updates the current user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | No | New username |
| email | string | No | New email |

**Example Request:**
```json
{
  "username": "johndoe_updated"
}
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe_updated",
    "email": "john@example.com",
    "role": "student"
  }
}
```

---

## Change Password
```
PUT /api/auth/password
```

Changes the current user's password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentPassword | string | Yes | Current password |
| newPassword | string | Yes | New password (min 6 chars) |

**Example Request:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Current password is incorrect |

---

## Get All Users (Admin Only)
```
GET /api/auth/users
```

Returns list of all users. Admin access required.

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "created_at": "2024-01-29T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "username": "student1",
      "email": "student@example.com",
      "role": "student",
      "created_at": "2024-01-29T11:00:00Z"
    }
  ]
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 403 | Admin access required |

---

# Content Management Endpoints

## Get All Content
```
GET /api/content
```

Returns all content with optional filters. Public access.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by "theory" or "lab" |
| content_type | string | Filter by "slides", "pdf", "code", "notes", "reference" |
| topic | string | Filter by topic (partial match) |
| week | integer | Filter by week number (1-52) |
| tags | string | Filter by tags (comma-separated) |
| search | string | Search in title, description, topic |

**Example Request:**
```
GET /api/content?category=theory&week=5&search=algorithms
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "title": "Introduction to Algorithms",
      "description": "Basic algorithm concepts and complexity analysis",
      "category": "theory",
      "content_type": "slides",
      "file_path": "theory/770e8400.pdf",
      "file_name": "algorithms_intro.pdf",
      "file_size": 2048576,
      "mime_type": "application/pdf",
      "topic": "Algorithms",
      "week": 5,
      "tags": ["algorithms", "complexity", "big-o"],
      "uploaded_by": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-29T12:00:00Z",
      "updated_at": "2024-01-29T12:00:00Z"
    }
  ]
}
```

---

## Get Content by ID
```
GET /api/content/{content_id}
```

Returns a single content item by ID. Public access.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| content_id | UUID | Content ID |

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Introduction to Algorithms",
    "description": "Basic algorithm concepts",
    "category": "theory",
    "content_type": "slides",
    "file_path": "theory/770e8400.pdf",
    "file_name": "algorithms_intro.pdf",
    "file_size": 2048576,
    "mime_type": "application/pdf",
    "topic": "Algorithms",
    "week": 5,
    "tags": ["algorithms", "complexity"],
    "uploaded_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-29T12:00:00Z",
    "updated_at": "2024-01-29T12:00:00Z"
  }
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 404 | Content not found |

---

## Upload Content (Admin Only)
```
POST /api/content
```

Uploads new content. Admin access required.

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | File to upload (max 50MB) |
| title | string | Yes | Content title |
| category | string | Yes | "theory" or "lab" |
| content_type | string | Yes | "slides", "pdf", "code", "notes", "reference" |
| description | string | No | Content description |
| topic | string | No | Topic name |
| week | integer | No | Week number (1-52) |
| tags | string | No | Comma-separated tags |

**Allowed File Types:**
- Documents: `.pdf`, `.ppt`, `.pptx`, `.txt`, `.md`
- Code: `.py`, `.js`, `.ts`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.go`, `.rs`, `.rb`, `.php`, `.sql`, `.sh`
- Data: `.ipynb`, `.json`, `.html`, `.css`, `.xml`, `.yaml`, `.yml`

**Example Request (curl):**
```bash
curl -X POST "http://localhost:8000/api/content" \
  -H "Authorization: Bearer <token>" \
  -F "file=@lecture1.pdf" \
  -F "title=Lecture 1: Introduction" \
  -F "category=theory" \
  -F "content_type=slides" \
  -F "topic=Introduction" \
  -F "week=1" \
  -F "tags=intro,basics"
```

**Example Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "title": "Lecture 1: Introduction",
    "description": "",
    "category": "theory",
    "content_type": "slides",
    "file_path": "theory/880e8400.pdf",
    "file_name": "lecture1.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "topic": "Introduction",
    "week": 1,
    "tags": ["intro", "basics"],
    "uploaded_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-29T14:00:00Z"
  }
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Invalid file type / File too large |
| 403 | Admin access required |
| 500 | Upload failed |

---

## Update Content (Admin Only)
```
PUT /api/content/{content_id}
```

Updates content metadata. Admin access required.

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| content_id | UUID | Content ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | New title |
| description | string | No | New description |
| category | string | No | "theory" or "lab" |
| content_type | string | No | Content type |
| topic | string | No | Topic name |
| week | integer | No | Week number |
| tags | array | No | Array of tags |

**Example Request:**
```json
{
  "title": "Updated Lecture Title",
  "topic": "Advanced Algorithms",
  "tags": ["algorithms", "advanced", "sorting"]
}
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "title": "Updated Lecture Title",
    "topic": "Advanced Algorithms",
    "tags": ["algorithms", "advanced", "sorting"],
    "updated_at": "2024-01-29T15:00:00Z"
  }
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 403 | Admin access required |
| 404 | Content not found |

---

## Delete Content (Admin Only)
```
DELETE /api/content/{content_id}
```

Deletes content and associated file. Admin access required.

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| content_id | UUID | Content ID |

**Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Content deleted successfully"
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 403 | Admin access required |
| 404 | Content not found |

---

## Download Content
```
GET /api/content/{content_id}/download
```

Downloads the content file.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| content_id | UUID | Content ID |

**Response:**
- Returns file as streaming download
- Content-Disposition header with filename

**Error Responses:**
| Status | Description |
|--------|-------------|
| 404 | Content or file not found |

---

## Get Content Statistics
```
GET /api/content/stats/overview
```

Returns content statistics. Public access.

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "byCategory": {
      "theory": 30,
      "lab": 15
    },
    "byType": {
      "slides": 20,
      "pdf": 10,
      "code": 8,
      "notes": 5,
      "reference": 2
    },
    "byWeek": {
      "week_1": 5,
      "week_2": 8,
      "week_3": 6
    }
  }
}
```

---

# AI Generation Endpoints (Part 3)

## Generate Theory Notes
```
POST /api/generate/notes
```

Generates comprehensive study notes using AI with Wikipedia context.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| topic | string | Yes | - | Topic to generate notes for (3-200 chars) |
| difficulty | string | No | "intermediate" | "beginner", "intermediate", or "advanced" |
| include_examples | boolean | No | true | Include practical examples |
| additional_context | string | No | null | Extra context (max 2000 chars) |

**Example Request:**
```json
{
  "topic": "Binary Search Trees",
  "difficulty": "intermediate",
  "include_examples": true,
  "additional_context": "Focus on balancing algorithms like AVL and Red-Black trees"
}
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "theory_notes",
    "topic": "Binary Search Trees",
    "difficulty": "intermediate",
    "content": "# Binary Search Trees\n\n## Overview\nA Binary Search Tree (BST) is a node-based binary tree data structure...\n\n## Key Concepts\n- **Node Structure**: Each node contains a key, left child, right child...\n\n## Detailed Explanation\n...\n\n## Examples\n```python\nclass Node:\n    def __init__(self, key):\n        self.key = key\n        self.left = None\n        self.right = None\n```\n\n## Summary\n- BSTs provide O(log n) average case operations...\n\n## Further Reading\n- AVL Trees\n- Red-Black Trees",
    "sources": [
      {
        "type": "wikipedia",
        "articles": ["Binary search tree", "Tree (data structure)", "Self-balancing binary search tree"]
      }
    ],
    "metadata": {
      "model": "anthropic/claude-sonnet-4",
      "tokens_used": 1847
    }
  }
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Invalid request / API key not configured |
| 401 | Not authenticated |
| 500 | Generation failed |

---

## Generate Slides
```
POST /api/generate/slides
```

Generates presentation slide outlines with speaker notes.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| topic | string | Yes | - | Presentation topic (3-200 chars) |
| num_slides | integer | No | 10 | Number of slides (5-30) |
| additional_context | string | No | null | Extra context (max 2000 chars) |

**Example Request:**
```json
{
  "topic": "Introduction to Machine Learning",
  "num_slides": 12,
  "additional_context": "Target audience: undergraduate CS students"
}
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "slides",
    "topic": "Introduction to Machine Learning",
    "num_slides": 12,
    "slides": [
      {
        "slide_number": 1,
        "title": "Introduction to Machine Learning",
        "bullets": [
          "What is Machine Learning?",
          "Why is it important?",
          "Course Overview"
        ],
        "speaker_notes": "Welcome students and introduce the topic. Mention real-world applications they interact with daily."
      },
      {
        "slide_number": 2,
        "title": "What is Machine Learning?",
        "bullets": [
          "Subset of Artificial Intelligence",
          "Systems that learn from data",
          "Improve performance without explicit programming",
          "Pattern recognition and prediction"
        ],
        "speaker_notes": "Define ML formally. Use the Arthur Samuel quote about learning without being explicitly programmed."
      },
      {
        "slide_number": 3,
        "title": "Types of Machine Learning",
        "bullets": [
          "Supervised Learning",
          "Unsupervised Learning",
          "Reinforcement Learning",
          "Semi-supervised Learning"
        ],
        "speaker_notes": "Give brief examples of each type. Supervised: spam detection, Unsupervised: customer segmentation, RL: game playing."
      }
    ],
    "sources": [
      {
        "type": "wikipedia",
        "articles": ["Machine learning", "Artificial intelligence", "Supervised learning"]
      }
    ],
    "metadata": {
      "model": "anthropic/claude-sonnet-4",
      "tokens_used": 2156
    }
  }
}
```

---

## Generate Lab Code
```
POST /api/generate/code
```

Generates educational code examples with explanations.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| topic | string | Yes | - | Programming topic (3-200 chars) |
| language | string | No | "python" | Programming language |
| difficulty | string | No | "intermediate" | Difficulty level |
| include_comments | boolean | No | true | Add explanatory comments |
| include_tests | boolean | No | true | Include unit tests |

**Supported Languages:**
- `python`, `javascript`, `typescript`, `java`
- `cpp`, `c`, `csharp`, `go`, `rust`, `sql`

**Example Request:**
```json
{
  "topic": "Implementing a Binary Search",
  "language": "python",
  "difficulty": "beginner",
  "include_comments": true,
  "include_tests": true
}
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "lab_code",
    "topic": "Implementing a Binary Search",
    "language": "python",
    "difficulty": "beginner",
    "content": "# Binary Search Implementation\n\n## Overview\nBinary search is an efficient algorithm for finding an item in a sorted list...\n\n## Main Code\n\n```python\ndef binary_search(arr, target):\n    \"\"\"\n    Performs binary search on a sorted array.\n    \n    Args:\n        arr: Sorted list of elements\n        target: Element to find\n    \n    Returns:\n        Index of target if found, -1 otherwise\n    \"\"\"\n    left, right = 0, len(arr) - 1\n    \n    while left <= right:\n        # Calculate middle index\n        mid = (left + right) // 2\n        \n        if arr[mid] == target:\n            return mid  # Found!\n        elif arr[mid] < target:\n            left = mid + 1  # Search right half\n        else:\n            right = mid - 1  # Search left half\n    \n    return -1  # Not found\n```\n\n## Example Usage\n\n```python\nnumbers = [1, 3, 5, 7, 9, 11, 13, 15]\nresult = binary_search(numbers, 7)\nprint(f\"Found at index: {result}\")  # Output: Found at index: 3\n```\n\n## Test Cases\n\n```python\nimport unittest\n\nclass TestBinarySearch(unittest.TestCase):\n    def test_found(self):\n        self.assertEqual(binary_search([1, 2, 3, 4, 5], 3), 2)\n    \n    def test_not_found(self):\n        self.assertEqual(binary_search([1, 2, 3, 4, 5], 6), -1)\n    \n    def test_empty_array(self):\n        self.assertEqual(binary_search([], 1), -1)\n\nif __name__ == '__main__':\n    unittest.main()\n```\n\n## Key Concepts\n- Time Complexity: O(log n)\n- Space Complexity: O(1)\n- Requires sorted input\n- Divide and conquer approach",
    "sources": [
      {
        "type": "wikipedia",
        "articles": ["Binary search algorithm", "Search algorithm"]
      }
    ],
    "metadata": {
      "model": "anthropic/claude-sonnet-4",
      "tokens_used": 1654,
      "language": "python"
    }
  }
}
```

---

## Generate Quiz
```
POST /api/generate/quiz
```

Generates quiz questions with answers and explanations.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| topic | string | Yes | - | Quiz topic (3-200 chars) |
| num_questions | integer | No | 5 | Number of questions (3-20) |
| question_types | array | No | ["mcq", "short_answer", "true_false"] | Types to include |
| difficulty | string | No | "intermediate" | Difficulty level |

**Question Types:**
- `mcq` - Multiple Choice Questions
- `true_false` - True/False Questions
- `short_answer` - Short Answer Questions

**Example Request:**
```json
{
  "topic": "SQL Database Basics",
  "num_questions": 5,
  "question_types": ["mcq", "true_false"],
  "difficulty": "beginner"
}
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "quiz",
    "topic": "SQL Database Basics",
    "num_questions": 5,
    "difficulty": "beginner",
    "quiz": {
      "quiz_title": "Quiz on SQL Database Basics",
      "questions": [
        {
          "question_number": 1,
          "type": "mcq",
          "question": "Which SQL command is used to retrieve data from a database?",
          "options": [
            "A) INSERT",
            "B) SELECT",
            "C) UPDATE",
            "D) DELETE"
          ],
          "correct_answer": "B",
          "explanation": "SELECT is the SQL command used to query and retrieve data from one or more tables in a database."
        },
        {
          "question_number": 2,
          "type": "true_false",
          "question": "A PRIMARY KEY can contain NULL values.",
          "correct_answer": false,
          "explanation": "A PRIMARY KEY constraint uniquely identifies each record in a table and cannot contain NULL values. It must contain unique, non-null values."
        },
        {
          "question_number": 3,
          "type": "mcq",
          "question": "Which clause is used to filter records in a SELECT statement?",
          "options": [
            "A) ORDER BY",
            "B) GROUP BY",
            "C) WHERE",
            "D) HAVING"
          ],
          "correct_answer": "C",
          "explanation": "The WHERE clause is used to filter records based on specified conditions before any grouping occurs."
        },
        {
          "question_number": 4,
          "type": "true_false",
          "question": "SQL is case-sensitive for keywords like SELECT and FROM.",
          "correct_answer": false,
          "explanation": "SQL keywords are not case-sensitive. SELECT, select, and Select are all equivalent. However, table and column names may be case-sensitive depending on the database system."
        },
        {
          "question_number": 5,
          "type": "mcq",
          "question": "What does CRUD stand for in database operations?",
          "options": [
            "A) Create, Read, Update, Delete",
            "B) Copy, Restore, Undo, Drop",
            "C) Connect, Retrieve, Upload, Disconnect",
            "D) Compile, Run, Upload, Debug"
          ],
          "correct_answer": "A",
          "explanation": "CRUD represents the four basic operations of persistent storage: Create (INSERT), Read (SELECT), Update (UPDATE), and Delete (DELETE)."
        }
      ]
    },
    "sources": [
      {
        "type": "wikipedia",
        "articles": ["SQL", "Database", "Relational database"]
      }
    ],
    "metadata": {
      "model": "anthropic/claude-sonnet-4",
      "tokens_used": 1432
    }
  }
}
```

---

## Search Wikipedia
```
GET /api/generate/wikipedia/search
```

Searches Wikipedia for articles related to a topic. Used to preview external context sources.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query (min 2 chars) |
| max_results | integer | No | 5 | Maximum articles to return |

**Example Request:**
```
GET /api/generate/wikipedia/search?query=Neural%20Networks&max_results=3
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "topic": "Neural Networks",
    "found": true,
    "articles": [
      {
        "title": "Neural network",
        "extract": "A neural network is a network or circuit of biological neurons, or, in a modern sense, an artificial neural network, composed of artificial neurons or nodes.",
        "description": "Network of biological or artificial neurons",
        "url": "https://en.wikipedia.org/wiki/Neural_network",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/..."
      },
      {
        "title": "Artificial neural network",
        "extract": "Artificial neural networks (ANNs), usually simply called neural networks (NNs), are computing systems inspired by the biological neural networks that constitute animal brains.",
        "description": "Computational model used in machine learning",
        "url": "https://en.wikipedia.org/wiki/Artificial_neural_network",
        "thumbnail": null
      },
      {
        "title": "Deep learning",
        "extract": "Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning.",
        "description": "Branch of machine learning",
        "url": "https://en.wikipedia.org/wiki/Deep_learning",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/..."
      }
    ],
    "combined_context": "## Neural network\nA neural network is a network or circuit of biological neurons...\n\n## Artificial neural network\nArtificial neural networks (ANNs)...\n\n## Deep learning\nDeep learning is part of a broader family..."
  }
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Query too short |
| 401 | Not authenticated |

---

## Get Supported Languages
```
GET /api/generate/supported-languages
```

Returns list of supported programming languages for code generation.

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "languages": [
      {"value": "python", "label": "Python", "extension": ".py"},
      {"value": "javascript", "label": "JavaScript", "extension": ".js"},
      {"value": "typescript", "label": "TypeScript", "extension": ".ts"},
      {"value": "java", "label": "Java", "extension": ".java"},
      {"value": "cpp", "label": "C++", "extension": ".cpp"},
      {"value": "c", "label": "C", "extension": ".c"},
      {"value": "csharp", "label": "C#", "extension": ".cs"},
      {"value": "go", "label": "Go", "extension": ".go"},
      {"value": "rust", "label": "Rust", "extension": ".rs"},
      {"value": "sql", "label": "SQL", "extension": ".sql"}
    ]
  }
}
```

---

# Chat Endpoints (Part 5)

## Send Chat Message
```
POST /api/chat/message
```

Send a message to the AI chat assistant.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| message | string | Yes | - | User message (1-4000 chars) |
| conversation_id | string | No | "new" | Conversation ID or "new" for new conversation |

**Example Request:**
```json
{
  "message": "Explain how binary search works",
  "conversation_id": "new"
}
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "# Binary Search\n\nBinary search is an efficient algorithm for finding an item in a sorted list...",
    "sources": [
      {
        "type": "course",
        "title": "Algorithms Lecture 3",
        "relevance": 0.85
      },
      {
        "type": "wikipedia",
        "title": "Binary search algorithm"
      }
    ],
    "intent": {
      "type": "explain",
      "confidence": 0.8
    },
    "metadata": {
      "model": "anthropic/claude-sonnet-4",
      "tokens_used": 450,
      "course_context_used": true,
      "wikipedia_context_used": true
    }
  }
}
```

---

## Get User Conversations
```
GET /api/chat/conversations
```

Get all conversations for the current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-29T10:00:00Z",
      "message_count": 5,
      "last_message": "How does quicksort compare to..."
    }
  ]
}
```

---

## Get Conversation History
```
GET /api/chat/conversations/{conversation_id}
```

Get a specific conversation with full message history.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| conversation_id | string | Conversation ID |

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-29T10:00:00Z",
    "messages": [
      {
        "role": "user",
        "content": "Explain binary search",
        "timestamp": "2024-01-29T10:00:00Z"
      },
      {
        "role": "assistant",
        "content": "Binary search is...",
        "timestamp": "2024-01-29T10:00:05Z",
        "sources": [...]
      }
    ]
  }
}
```

---

## Create New Conversation
```
POST /api/chat/conversations/new
```

Create a new conversation.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "New conversation created"
  }
}
```

---

## Delete Conversation
```
DELETE /api/chat/conversations/{conversation_id}
```

Delete a conversation.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| conversation_id | string | Conversation ID |

**Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Conversation deleted"
}
```

---

## Clear Conversation
```
POST /api/chat/conversations/{conversation_id}/clear
```

Clear all messages in a conversation but keep the conversation.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| conversation_id | string | Conversation ID |

**Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Conversation cleared"
}
```

---

## Get Suggested Prompts
```
GET /api/chat/suggestions
```

Get suggested prompts for the chat.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Example Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "category": "Search",
      "prompts": [
        "Find materials about data structures",
        "Search for content on machine learning"
      ]
    },
    {
      "category": "Explain",
      "prompts": [
        "Explain how binary search works",
        "What is object-oriented programming?"
      ]
    },
    {
      "category": "Generate",
      "prompts": [
        "Generate a quiz about sorting algorithms",
        "Create study notes on databases"
      ]
    }
  ]
}
```

---

# Utility Endpoints

## Health Check
```
GET /api/health
```

Returns API health status.

**Example Response (200 OK):**
```json
{
  "status": "ok",
  "message": "AI Learning Platform API is running"
}
```

---

## Root
```
GET /
```

Returns API information.

**Example Response (200 OK):**
```json
{
  "message": "AI-Powered Learning Platform API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

---

# Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

For validation errors (422):
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

# Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10 requests/minute |
| Content Read | 100 requests/minute |
| Content Write | 20 requests/minute |
| AI Generation | 10 requests/minute |

---

# Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |
