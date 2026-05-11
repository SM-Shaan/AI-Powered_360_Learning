# AI-Powered 360 Learning Platform
## Core Features & Technical Overview

---

## Executive Summary

The AI-Powered 360 Learning Platform is a comprehensive university supplementary learning system that combines modern web technologies with advanced AI capabilities. Built with **React 19 + FastAPI**, powered by **Claude AI**, and backed by **Supabase**, the platform delivers an intelligent, context-aware learning experience that goes beyond traditional LMS solutions.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐│
│  │  Chat   │ │ Search  │ │  Forum  │ │ Upload  │ │    Dashboard    ││
│  │   AI    │ │  Multi  │ │Community│ │   OCR   │ │   Analytics     ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────────┬────────┘│
│       │           │           │           │               │         │
│       └───────────┴───────────┴───────────┴───────────────┘         │
│                               │                                      │
│                    ┌──────────▼──────────┐                          │
│                    │   AuthContext API   │                          │
│                    │   (State Manager)   │                          │
│                    └──────────┬──────────┘                          │
└───────────────────────────────┼─────────────────────────────────────┘
                                │ REST API
┌───────────────────────────────┼─────────────────────────────────────┐
│                       BACKEND (FastAPI)                             │
│  ┌────────────────────────────▼────────────────────────────────┐   │
│  │                    API Router Layer                          │   │
│  │   /auth  │  /content  │  /search  │  /chat  │  /forum       │   │
│  └────┬─────────┬────────────┬───────────┬─────────┬───────────┘   │
│       │         │            │           │         │               │
│  ┌────▼─────────▼────────────▼───────────▼─────────▼───────────┐   │
│  │                    Service Layer                             │   │
│  │  ChatService │ RetrievalService │ RAGService │ ForumService │   │
│  └────────────────────────────┬────────────────────────────────┘   │
│                               │                                     │
│  ┌────────────────────────────▼────────────────────────────────┐   │
│  │                AI Integration Layer                          │   │
│  │         Claude AI (via OpenRouter) + Wikipedia API           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────┐
│                       DATABASE (Supabase)                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────┐ │
│  │    Users    │ │   Content   │ │   Vector    │ │ Conversations │ │
│  │  & Roles    │ │  & Chunks   │ │ Embeddings  │ │  & Messages   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Functional Features

### 1. Intelligent AI Chat System

**Location:** `frontend/src/pages/Chat.jsx`

The chat interface is the platform's flagship feature, providing a sophisticated conversational AI experience with full context awareness.

#### Frontend Design

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌─────────────────────────────────────────┐ │
│  │   SIDEBAR        │  │           CHAT AREA                     │ │
│  │                  │  │  ┌──────────────────────────────────┐   │ │
│  │  🔍 Search       │  │  │  Welcome! How can I help you?    │   │ │
│  │                  │  │  │                                  │   │ │
│  │  + New Chat      │  │  │  [Suggestion Cards]              │   │ │
│  │                  │  │  │  ┌────────┐ ┌────────┐          │   │ │
│  │  ─────────────   │  │  │  │Explain │ │Find    │          │   │ │
│  │                  │  │  │  │Concept │ │Code    │          │   │ │
│  │  📝 Conversation │  │  │  └────────┘ └────────┘          │   │ │
│  │  📝 Conversation │  │  └──────────────────────────────────┘   │ │
│  │  📝 Conversation │  │                                         │ │
│  │                  │  │  ┌──────────────────────────────────┐   │ │
│  │                  │  │  │ Message with Source Attribution  │   │ │
│  │                  │  │  │ ┌─────────────────────────────┐  │   │ │
│  │                  │  │  │ │ 📚 lecture.pdf (95% match)  │  │   │ │
│  │                  │  │  │ └─────────────────────────────┘  │   │ │
│  │                  │  │  └──────────────────────────────────┘   │ │
│  │                  │  │                                         │ │
│  │                  │  │  ┌──────────────────────────────────┐   │ │
│  │                  │  │  │  💬 Type your message...    [↵]  │   │ │
│  └──────────────────┘  │  └──────────────────────────────────┘   │ │
└────────────────────────────────────────────────────────────────────┘
```

#### Key Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Conversation Persistence** | Full chat history saved to database | `localStorage` for current session, Supabase for permanent storage |
| **Source Attribution** | Every AI response shows cited sources with relevance scores | Badge components with match percentages |
| **Message Actions** | Copy, thumbs up/down, regenerate responses | Action buttons with visual feedback |
| **Typing Indicators** | Real-time feedback during AI response generation | Animated loading states |
| **Auto-scrolling** | Automatic scroll to latest messages with manual override | Scroll detection with "scroll to bottom" button |
| **Multi-line Input** | Enter to send, Shift+Enter for new lines | Keyboard event handling |

#### Unique Logic: Multi-Strategy Content Retrieval

The chat system employs a sophisticated 4-tier retrieval strategy:

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│  1. Direct Text Search              │ ◄── Fast, exact matches
│     (Most reliable)                 │
└─────────────────┬───────────────────┘
                  │ If insufficient results
                  ▼
┌─────────────────────────────────────┐
│  2. Individual Term Extraction      │ ◄── Break query into searchable terms
│     Search each term separately     │
└─────────────────┬───────────────────┘
                  │ If still insufficient
                  ▼
┌─────────────────────────────────────┐
│  3. Hybrid Semantic Search          │ ◄── Vector embeddings + keywords
│     (60% keyword, 40% semantic)     │     Weight: 0.6 / 0.4
└─────────────────┬───────────────────┘
                  │ If still insufficient
                  ▼
┌─────────────────────────────────────┐
│  4. Raw File Search Fallback        │ ◄── Direct file content retrieval
│     (Last resort)                   │
└─────────────────────────────────────┘
                  │
                  ▼
        Deduplicate & Validate
                  │
                  ▼
        AI Response Generation
                  │
                  ▼
        Grounding Verification
```

---

### 2. Advanced Multi-Mode Search

**Location:** `frontend/src/pages/Search.jsx`

The search system provides four distinct search modes optimized for different use cases.

#### Search Modes Comparison

| Mode | Icon | Use Case | Technical Implementation |
|------|------|----------|-------------------------|
| **Ask AI** | 🤖 | Direct answers from materials | RAG pipeline with source verification |
| **Semantic** | 🧠 | Conceptually similar content | Vector similarity using BGE embeddings |
| **Hybrid** | ⚖️ | Balanced keyword + concept search | Weighted combination (configurable) |
| **Code** | 💻 | Programming examples & snippets | Syntax-aware with language detection |

#### Frontend Implementation

```jsx
// Search Mode Selector UI
┌──────────────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌────────┐          │
│  │ Ask AI  │  │ Semantic │  │ Hybrid │  │  Code  │          │
│  │   🤖   │  │    🧠    │  │   ⚖️   │  │   💻   │          │
│  └─────────┘  └──────────┘  └────────┘  └────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🔍  Search course materials...                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Filters: [Category ▼] [Content Type ▼] [Language ▼]        │
└──────────────────────────────────────────────────────────────┘
```

#### Unique Logic: Context Validation Pipeline

Before generating AI responses, the system validates retrieved context:

```
Retrieved Content
      │
      ▼
┌─────────────────────────────────────┐
│  VALIDATION CHECKS                  │
│  ─────────────────────              │
│  ✓ Language match verification      │
│  ✓ Content type relevance           │
│  ✓ Topic alignment scoring          │
│  ✓ Duplicate removal                │
│  ✓ Minimum relevance threshold      │
└─────────────────┬───────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
  ┌─────────┐           ┌─────────────┐
  │ PASS    │           │ FAIL        │
  │ Generate│           │ Honest      │
  │ Response│           │ Disclaimer  │
  └─────────┘           └─────────────┘
```

**Honest AI Responses:** When content doesn't match the user's request (e.g., asking for Python but only C++ exists), the system explicitly informs users rather than providing misleading information.

---

### 3. Community Forum with AI Integration

**Location:** `frontend/src/pages/Forum.jsx` + `frontend/src/components/forum/`

A full-featured discussion platform enhanced with AI capabilities.

#### Forum Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         FORUM SYSTEM                               │
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │   ForumPost     │  │  ForumPost      │  │   ForumCreate       │ │
│  │   List          │  │  Detail         │  │   Modal             │ │
│  │                 │  │                 │  │                     │ │
│  │  • Filtering    │  │  • Full post    │  │  • Title/Body       │ │
│  │  • Sorting      │  │  • Answers      │  │  • Type selector    │ │
│  │  • Search       │  │  • Comments     │  │  • Tags             │ │
│  │  • Pagination   │  │  • Voting       │  │  • AI bot checkbox  │ │
│  │  • Popular tags │  │  • Accept answer│  │                     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
│                                                                     │
│  Post Types:                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ ❓ Question  │ │ 💬 Discussion│  │ 📢 Announcement          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

#### Features

| Feature | Description | UI Element |
|---------|-------------|------------|
| **Voting System** | Community-driven content ranking | Up/down arrows with vote counts |
| **Answer Acceptance** | Mark correct answers for questions | Checkmark button (for post authors) |
| **AI Bot Answers** | Optional AI-generated responses | Checkbox during post creation |
| **Threaded Comments** | Nested discussion structure | Indented comment display |
| **Tag System** | Categorize and discover content | Clickable tag badges |
| **Status Filters** | Open, Resolved, Closed states | Filter dropdown menu |

---

### 4. Intelligent Content Upload with OCR

**Location:** `frontend/src/pages/Upload.jsx`

Admin-exclusive content management with dual upload modes.

#### Upload Modes

```
┌────────────────────────────────────────────────────────────────────┐
│                        UPLOAD INTERFACE                            │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐│
│  │   📄 Documents & Code    │  │   ✍️ Handwritten Notes (OCR)     ││
│  │                          │  │                                  ││
│  │   • PDF documents        │  │   • Image upload                 ││
│  │   • PowerPoint slides    │  │   • AI-powered text extraction   ││
│  │   • Code files (.py,.js) │  │   • Makes notes searchable       ││
│  │   • Text files           │  │   • Preserves handwriting style  ││
│  └──────────────────────────┘  └──────────────────────────────────┘│
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Metadata Input                                               │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐ │  │
│  │  │   Title    │ │   Category   │ │   Topic    │ │   Tags   │ │  │
│  │  └────────────┘ └──────────────┘ └────────────┘ └──────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Recently Uploaded                                            │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │ 📄 lecture_notes.pdf   |  Theory  |  [View] [Delete]    │ │  │
│  │  │ 💻 algorithm.py        |  Lab     |  [View] [Delete]    │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

#### Content Processing Pipeline

```
File Upload
     │
     ▼
┌─────────────────────────────────────┐
│  1. Validation                      │
│     • File type check               │
│     • Size limits                   │
│     • Duplicate detection           │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  2. Storage                         │
│     • Supabase Storage upload       │
│     • Metadata extraction           │
│     • Database record creation      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  3. Indexing                        │
│     • Text extraction               │
│     • Content chunking              │
│     • Vector embedding generation   │
│     • Searchable index update       │
└─────────────────────────────────────┘
```

---

### 5. Role-Based Dashboard System

**Location:** `frontend/src/pages/StudentDashboard.jsx`, `AdminDashboard.jsx`

#### Student Dashboard

```
┌────────────────────────────────────────────────────────────────────┐
│                      STUDENT DASHBOARD                              │
│                                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐                  │
│  │  📊 Learning Stats  │  │  🎯 Quick Actions   │                  │
│  │                     │  │                     │                  │
│  │  Materials viewed   │  │  [Start Chat]       │                  │
│  │  Questions asked    │  │  [Search Content]   │                  │
│  │  Forum activity     │  │  [Visit Forum]      │                  │
│  └─────────────────────┘  └─────────────────────┘                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  📚 Recent Materials                                          │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │  │
│  │  │  Lecture 5      │ │  Lab Exercise   │ │  Code Sample    │ │  │
│  │  │  PDF • Theory   │ │  PDF • Lab      │ │  Python • Code  │ │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

#### Admin Dashboard

Extends student features with:
- Content management overview
- User management (view all users)
- Upload statistics
- System health metrics
- Quick access to admin tools

---

### 6. Authentication & Authorization

**Location:** `frontend/src/contexts/AuthContext.jsx`, `frontend/src/pages/Login.jsx`

#### Security Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                           │
│                                                                     │
│  User Credentials                                                   │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────┐                           │
│  │  Backend Validation                  │                           │
│  │  • Email/password verification       │                           │
│  │  • bcrypt hash comparison            │                           │
│  │  • Role retrieval                    │                           │
│  └─────────────────┬───────────────────┘                           │
│                    │                                                │
│                    ▼                                                │
│  ┌─────────────────────────────────────┐                           │
│  │  JWT Token Generation                │                           │
│  │  • User ID encoded                   │                           │
│  │  • Role included                     │                           │
│  │  • Expiry: 24 hours (configurable)   │                           │
│  └─────────────────┬───────────────────┘                           │
│                    │                                                │
│                    ▼                                                │
│  ┌─────────────────────────────────────┐                           │
│  │  Frontend Storage                    │                           │
│  │  • Token → localStorage              │                           │
│  │  • AuthContext state update          │                           │
│  │  • Axios header injection            │                           │
│  └─────────────────────────────────────┘                           │
└────────────────────────────────────────────────────────────────────┘
```

#### Protected Routes

| Route | Access Level | Component |
|-------|--------------|-----------|
| `/dashboard` | All authenticated | StudentDashboard |
| `/browse` | All authenticated | Browse |
| `/search` | All authenticated | Search |
| `/chat` | All authenticated | Chat |
| `/forum` | All authenticated | Forum |
| `/upload` | Admin only | Upload |
| `/generate` | Admin only | Generate |
| `/admin` | Admin only | AdminDashboard |

---

## Technical Nuances & Unique Implementations

### 1. Grounding Verification System

The platform includes a sophisticated mechanism to ensure AI responses are grounded in actual course materials:

```javascript
// Grounding Score Calculation
{
  "grounding_score": 0.85,        // 85% of response uses verified sources
  "sources_used": ["lecture.pdf", "notes.md"],
  "unverified_claims": 2,         // Claims without source backing
  "hallucination_risk": "low"     // Risk assessment
}
```

This prevents the AI from generating plausible but incorrect information.

### 2. Intent Detection Engine

The chat system automatically detects user intent to optimize response generation:

| Detected Intent | Trigger Patterns | Response Strategy |
|----------------|------------------|-------------------|
| `search` | "find", "search for", "where is" | Retrieval-focused |
| `explain` | "explain", "what is", "how does" | Educational explanation |
| `generate` | "create", "write", "generate" | Content generation |
| `code` | "code", "function", "implement" | Code-focused with syntax |
| `file_request` | "show me file.cpp", "get the file" | Full file delivery |

### 3. Language-Aware Code Handling

When users request code, the system:

1. **Detects requested language** from query (e.g., "Python example")
2. **Extracts available languages** from indexed content
3. **Validates match** between request and availability
4. **Provides honest feedback** if language mismatch occurs

```
User: "Show me Python implementation of sorting"
System: [Checks index]
        Found: C++, JavaScript (no Python)
        Response: "I don't have Python examples for sorting,
                   but I can show you the C++ implementation..."
```

### 4. Vector Search Implementation

Using **BAAI/bge-base-en-v1.5** embeddings (768 dimensions):

```sql
-- Supabase RPC function for similarity search
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
```

### 5. Conversation Context Window

The chat maintains context through:

- **Last 10 messages** included in each API call
- **Full history** preserved in database
- **Token counting** for optimal context utilization
- **Automatic summarization** for long conversations

### 6. State Persistence Strategy

| Data Type | Storage | Purpose |
|-----------|---------|---------|
| Auth token | localStorage | Session persistence |
| Current conversation ID | localStorage | Resume chat sessions |
| Search filters | localStorage | UX convenience |
| Conversation history | Supabase | Permanent record |
| User preferences | Supabase | Cross-device sync |

---

## UI/UX Design Patterns

### 1. Responsive Layout System

```
Desktop (>1024px)        Tablet (768-1024px)      Mobile (<768px)
┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐
│ Sidebar │  Content  │  │ Collapsible│Content │  │   Content    │
│         │           │  │   Sidebar  │        │  │              │
│         │           │  │     ☰      │        │  │      ☰       │
│         │           │  │            │        │  │   (Drawer)   │
└─────────────────────┘  └─────────────────────┘  └──────────────┘
```

### 2. Visual Feedback System

| Interaction | Feedback | Component |
|-------------|----------|-----------|
| Loading | Animated spinner with context text | Custom loader |
| Success | Green toast notification | Toast component |
| Error | Red toast with retry option | Error boundary |
| Typing | Animated dots | Message indicator |
| Hover | Scale/color transition | TailwindCSS utilities |

### 3. Card-Based Information Architecture

```
┌─────────────────────────────────────┐
│  📄 Content Card                    │
│  ─────────────────────              │
│  Title                              │
│  ┌───────┐ ┌───────┐ ┌───────────┐ │
│  │ Badge │ │ Badge │ │  Preview  │ │
│  │(Type) │ │(Topic)│ │  Button   │ │
│  └───────┘ └───────┘ └───────────┘ │
│                                     │
│  Description text with truncation...│
│                                     │
│  [View] [Download] [Actions...]     │
└─────────────────────────────────────┘
```

---

## Performance Optimizations

### 1. Lazy Loading
- Route-based code splitting
- Component-level lazy loading for heavy features
- Image lazy loading with placeholders

### 2. Caching Strategy
- LocalStorage for frequently accessed data
- React state memoization
- API response caching (search results)

### 3. Efficient Rendering
- Virtual scrolling for long lists (forum, chat)
- Debounced search inputs
- Optimistic UI updates

---

## Security Measures

| Layer | Implementation |
|-------|----------------|
| **Authentication** | JWT with bcrypt password hashing |
| **Authorization** | Role-based access control (RBAC) |
| **API Security** | Bearer token validation on all protected routes |
| **Database** | Row Level Security (RLS) in Supabase |
| **Input Validation** | Server-side validation for all inputs |
| **XSS Prevention** | React's built-in escaping + sanitization |

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, Vite | UI framework, build tool |
| **Styling** | TailwindCSS | Utility-first CSS |
| **Icons** | Lucide React | Consistent iconography |
| **Routing** | React Router v7 | SPA navigation |
| **HTTP Client** | Axios | API communication |
| **Backend** | FastAPI, Python | High-performance API |
| **Database** | Supabase (PostgreSQL) | Data persistence |
| **Storage** | Supabase Storage | File storage |
| **AI** | Claude (via OpenRouter) | Intelligence layer |
| **Embeddings** | BGE-base-en-v1.5 | Vector search |
| **Knowledge** | Wikipedia API | Supplementary information |

---

## Conclusion

The AI-Powered 360 Learning Platform represents a modern approach to educational technology, combining:

- **Intelligent Search**: Multi-mode search with semantic understanding
- **Honest AI**: Grounding verification prevents misinformation
- **Community Learning**: Forum with AI-enhanced discussions
- **Seamless UX**: Responsive design with thoughtful interactions
- **Robust Security**: Enterprise-grade authentication and authorization
- **Scalable Architecture**: Service-oriented backend with vector search

The platform is designed to grow with institutional needs while maintaining performance and reliability.

---

*Documentation generated for AI-Powered 360 Learning Platform*
