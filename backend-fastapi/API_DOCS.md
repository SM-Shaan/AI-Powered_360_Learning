# AI-Powered Learning Platform API Documentation

**Base URL:** `http://localhost:8000/api`

**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Content Management](#content-management)
3. [Health Check](#health-check)

---

## Authentication

### Register User

Create a new user account.

```
POST /auth/register
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Username (3-50 characters) |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 6 characters) |
| role | string | No | User role: `student` (default) or `admin` |

**Example Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "student"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Email already registered / Username already taken
- `500` - Failed to create user

---

### Login

Authenticate an existing user.

```
POST /auth/login
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401` - Invalid email or password
- `500` - Database connection error

---

### Get Current User

Get the authenticated user's profile.

```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "student",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401` - Not authenticated / Invalid or expired token

---

### Update Profile

Update the current user's profile.

```
PUT /auth/profile
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | No | New username (3-50 characters) |
| email | string | No | New email address |

**Example Request:**
```json
{
  "username": "newusername"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "username": "newusername",
  "email": "john@example.com",
  "role": "student",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400` - Username already taken / Email already registered
- `401` - Not authenticated

---

### Change Password

Change the current user's password.

```
PUT /auth/password
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| current_password | string | Yes | Current password |
| new_password | string | Yes | New password (min 6 characters) |

**Example Request:**
```json
{
  "current_password": "oldpassword123",
  "new_password": "newsecurepassword456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `400` - Current password is incorrect
- `401` - Not authenticated

---

### Get All Users (Admin Only)

Get a list of all users.

```
GET /auth/users
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "student",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Admin access required

---

## Content Management

### Get All Content

Retrieve all content with optional filters.

```
GET /content/
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category: `theory` or `lab` |
| content_type | string | Filter by type: `slides`, `pdf`, `code`, `notes`, `reference` |
| topic | string | Filter by topic (partial match) |
| week | integer | Filter by week number (1-52) |
| tags | string | Filter by tags (comma-separated) |
| search | string | Search in title, description, and topic |

**Example Request:**
```
GET /content/?category=theory&week=1&search=python
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "title": "Introduction to Python",
      "description": "Basic Python programming concepts",
      "category": "theory",
      "content_type": "slides",
      "file_path": "theory/uuid.pdf",
      "file_name": "python-intro.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "topic": "Python Basics",
      "week": 1,
      "tags": ["python", "programming", "basics"],
      "uploaded_by": "admin-uuid",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Get Content Statistics

Get content statistics overview.

```
GET /content/stats/overview
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "byCategory": {
      "theory": 15,
      "lab": 10
    },
    "byType": {
      "slides": 8,
      "pdf": 10,
      "code": 5,
      "notes": 2
    },
    "byWeek": {
      "week_1": 5,
      "week_2": 8,
      "week_3": 12
    }
  }
}
```

---

### Get Content by ID

Retrieve a single content item by ID.

```
GET /content/{content_id}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| content_id | string | Content UUID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "Introduction to Python",
    "description": "Basic Python programming concepts",
    "category": "theory",
    "content_type": "slides",
    "file_path": "theory/uuid.pdf",
    "file_name": "python-intro.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "topic": "Python Basics",
    "week": 1,
    "tags": ["python", "programming"],
    "uploaded_by": "admin-uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `404` - Content not found

---

### Upload Content (Admin Only)

Upload new content with a file.

```
POST /content/
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | The file to upload |
| title | string | Yes | Content title |
| category | string | Yes | `theory` or `lab` |
| content_type | string | Yes | `slides`, `pdf`, `code`, `notes`, or `reference` |
| description | string | No | Content description |
| topic | string | No | Topic name |
| week | integer | No | Week number (1-52) |
| tags | string | No | Comma-separated tags |

**Allowed File Types:**
- Documents: `.pdf`, `.ppt`, `.pptx`, `.txt`, `.md`
- Code: `.py`, `.js`, `.ts`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.go`, `.rs`, `.rb`, `.php`, `.sql`, `.sh`
- Data: `.ipynb`, `.json`, `.html`, `.css`, `.xml`, `.yaml`, `.yml`

**Example (cURL):**
```bash
curl -X POST "http://localhost:8000/api/content/" \
  -H "Authorization: Bearer <token>" \
  -F "file=@lecture.pdf" \
  -F "title=Python Basics" \
  -F "category=theory" \
  -F "content_type=slides" \
  -F "description=Introduction to Python" \
  -F "topic=Python" \
  -F "week=1" \
  -F "tags=python,basics,programming"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "Python Basics",
    "description": "Introduction to Python",
    "category": "theory",
    "content_type": "slides",
    "file_path": "theory/uuid.pdf",
    "file_name": "lecture.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "topic": "Python",
    "week": 1,
    "tags": ["python", "basics", "programming"],
    "uploaded_by": "admin-uuid"
  }
}
```

**Error Responses:**
- `400` - Invalid file type / File too large
- `401` - Not authenticated
- `403` - Admin access required
- `500` - Failed to upload file

---

### Update Content (Admin Only)

Update content metadata.

```
PUT /content/{content_id}
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| content_id | string | Content UUID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | New title |
| description | string | No | New description |
| category | string | No | `theory` or `lab` |
| content_type | string | No | `slides`, `pdf`, `code`, `notes`, or `reference` |
| topic | string | No | New topic |
| week | integer | No | New week number |
| tags | array | No | New tags array |

**Example Request:**
```json
{
  "title": "Updated Python Basics",
  "tags": ["python", "updated", "beginner"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "Updated Python Basics",
    "description": "Introduction to Python",
    "category": "theory",
    "content_type": "slides",
    "tags": ["python", "updated", "beginner"]
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Admin access required
- `404` - Content not found

---

### Delete Content (Admin Only)

Delete content and its associated file.

```
DELETE /content/{content_id}
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| content_id | string | Content UUID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Content deleted successfully"
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Admin access required
- `404` - Content not found

---

### Download Content

Download the content file.

```
GET /content/{content_id}/download
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| content_id | string | Content UUID |

**Response (200 OK):**
- Returns file as binary stream with appropriate Content-Type header
- Content-Disposition header includes original filename

**Error Responses:**
- `404` - Content not found / File not found in storage

---

## Health Check

### API Health

Check if the API is running.

```
GET /health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "message": "AI Learning Platform API is running"
}
```

---

### Root Endpoint

Get API information.

```
GET /
```

**Response (200 OK):**
```json
{
  "message": "AI-Powered Learning Platform API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

---

## Interactive Documentation

FastAPI provides built-in interactive documentation:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

For validation errors:
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

## Enums Reference

### UserRole
| Value | Description |
|-------|-------------|
| `student` | Regular user with read access |
| `admin` | Administrator with full CRUD access |

### ContentCategory
| Value | Description |
|-------|-------------|
| `theory` | Theoretical content (lectures, notes) |
| `lab` | Practical/lab content (exercises, code) |

### ContentType
| Value | Description |
|-------|-------------|
| `slides` | Presentation slides |
| `pdf` | PDF documents |
| `code` | Source code files |
| `notes` | Text notes |
| `reference` | Reference materials |
