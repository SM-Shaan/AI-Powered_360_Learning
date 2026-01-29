# Part 5: Conversational Chat Interface

## Overview

Part 5 implements a conversational AI chat interface that provides a unified way to interact with all platform features through natural language.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chat Interface                            │
│                     (Frontend: Chat.jsx)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Chat API Routes                             │
│                   (/api/chat/message)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Chat Service                              │
│              (chat_service.py)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Intent     │  │   Context    │  │ Conversation │          │
│  │  Detection   │  │   Fetcher    │  │   Manager    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Part 2: RAG    │  │  Wikipedia API   │  │  OpenRouter API  │
│ (Course Context) │  │ (External Context│  │    (Claude)      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Features

### 1. Conversational Context
- Maintains conversation history
- Remembers previous messages for follow-up questions
- Context-aware responses

### 2. Automatic Context Retrieval
- **Internal Context**: Searches course materials using Part 2 RAG
- **External Context**: Fetches Wikipedia information
- Prioritizes course content over general knowledge

### 3. Intent Detection
- Automatically detects user intent:
  - `search`: Looking for materials
  - `explain`: Wants concept explanation
  - `generate`: Wants content generation
  - `summarize`: Wants summary
  - `question`: General question

### 4. Source Attribution
- Shows which sources were used
- Distinguishes course materials vs Wikipedia
- Shows relevance scores

### 5. Conversation Management
- Create new conversations
- View conversation history
- Delete/clear conversations

## API Endpoints

### Send Chat Message
```
POST /api/chat/message
```

**Request:**
```json
{
  "message": "Explain how binary search works",
  "conversation_id": "new"  // or existing conversation ID
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "# Binary Search\n\nBinary search is an efficient algorithm...",
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

### Get User Conversations
```
GET /api/chat/conversations
```

**Response:**
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

### Get Conversation History
```
GET /api/chat/conversations/{conversation_id}
```

**Response:**
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

### Create New Conversation
```
POST /api/chat/conversations/new
```

### Delete Conversation
```
DELETE /api/chat/conversations/{conversation_id}
```

### Clear Conversation
```
POST /api/chat/conversations/{conversation_id}/clear
```

### Get Suggested Prompts
```
GET /api/chat/suggestions
```

**Response:**
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
    }
  ]
}
```

## File Structure

```
backend-fastapi/
├── app/
│   ├── routes/
│   │   └── chat.py              # Chat API endpoints
│   └── services/
│       └── chat_service.py      # Chat business logic

frontend/
├── src/
│   ├── pages/
│   │   └── Chat.jsx             # Chat UI component
│   └── services/
│       └── api.js               # chatAPI methods
```

## Frontend Usage

### Chat Page Features

1. **Sidebar**
   - New chat button
   - Conversation list
   - Delete conversations

2. **Message Area**
   - User/assistant messages
   - Markdown rendering
   - Source attribution
   - Loading indicators

3. **Input Area**
   - Multi-line text input
   - Send button
   - Keyboard shortcuts (Enter to send)

4. **Empty State**
   - Welcome message
   - Suggested prompts by category

### Example Code

```jsx
import { chatAPI } from '../services/api';

// Send a message
const sendMessage = async (message) => {
  const response = await chatAPI.sendMessage(message, conversationId);
  const { message: reply, sources, metadata } = response.data.data;
  // Handle response
};

// Load conversation history
const loadHistory = async (convId) => {
  const response = await chatAPI.getConversation(convId);
  const { messages } = response.data.data;
  // Display messages
};
```

## Integration with Other Parts

### Part 2 (RAG) Integration
```python
# In chat_service.py
async def _get_course_context(self, query):
    retrieval_service = get_retrieval_service()
    chunks = await retrieval_service.search_chunks(
        query=query,
        top_k=4,
        threshold=0.35
    )
    return formatted_context
```

### Part 3 (Generation) Integration
The chat can trigger content generation based on intent:
- "Generate a quiz about sorting" → Quiz generation
- "Create study notes on databases" → Notes generation
- "Write a Python function for..." → Code generation

## System Prompt

The chat assistant uses this system prompt:

```
You are an AI learning assistant for a university course platform.
Your role is to help students learn by:
1. Answering questions about course materials
2. Explaining concepts clearly
3. Providing examples and analogies
4. Helping with problem-solving
5. Generating study materials when requested

IMPORTANT GUIDELINES:
- Always prioritize course materials when available
- Be accurate and educational
- If you're not sure, say so
- Reference specific sources when possible
- Keep responses focused and helpful
- Use markdown formatting for better readability
```

## Configuration

### Environment Variables
```env
OPENROUTER_API_KEY=your-key-here
```

### Service Settings
- Model: `anthropic/claude-sonnet-4`
- Max tokens: 2048
- Temperature: 0.7
- Context threshold: 0.35

## Error Handling

| Error | Cause | User Message |
|-------|-------|--------------|
| API key missing | Not configured | "API key not configured" |
| Rate limit | Too many requests | "Please wait and try again" |
| Context timeout | Slow retrieval | Falls back to Wikipedia only |
| Generation error | AI error | "I encountered an error. Please try again." |

## Testing

### Test Scenarios

1. **Basic Question**
   - Input: "What is a binary tree?"
   - Expected: Explanation with course + Wikipedia sources

2. **Follow-up Question**
   - Input: "How is it different from a BST?"
   - Expected: Contextual response using conversation history

3. **Search Request**
   - Input: "Find materials about sorting algorithms"
   - Expected: List of relevant course materials

4. **Generation Request**
   - Input: "Generate a quiz about linked lists"
   - Expected: Quiz questions from course context

### Manual Testing

1. Navigate to `/chat`
2. Try suggested prompts
3. Ask follow-up questions
4. Check source attribution
5. Test conversation history

## Limitations

1. **In-Memory Storage**: Conversations stored in memory (lost on restart)
2. **No Streaming**: Responses returned all at once
3. **Context Window**: Limited to last 10 messages
4. **No File Uploads**: Cannot analyze uploaded files in chat

## Future Enhancements

1. **Database Persistence**: Store conversations in Supabase
2. **Streaming Responses**: Real-time token streaming
3. **Voice Input**: Speech-to-text support
4. **File Analysis**: Analyze uploaded documents
5. **Multi-modal**: Image understanding
6. **Proactive Suggestions**: Suggest related topics

## Dependencies

```
httpx>=0.24.0      # HTTP client
pydantic>=2.5.0    # Request validation
```

## References

- [OpenRouter API](https://openrouter.ai/docs)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Lucide Icons](https://lucide.dev/)
