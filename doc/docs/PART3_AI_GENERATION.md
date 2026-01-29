# Part 3: AI-Generated Learning Materials

## Overview

Part 3 implements an AI-powered content generation system that creates learning materials using:
- **External Context**: Wikipedia API for factual grounding
- **AI Generation**: OpenRouter API (Claude) for content creation

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   FastAPI        │────▶│  Wikipedia API  │
│   (React)       │     │   Backend        │     │  (External)     │
│   /generate     │     │                  │     └─────────────────┘
└─────────────────┘     │  Generation      │
                        │  Service         │────▶┌─────────────────┐
                        │                  │     │  OpenRouter API │
                        └──────────────────┘     │  (Claude AI)    │
                                                 └─────────────────┘
```

## Features

### 1. Theory Notes Generation
- Comprehensive study notes on any topic
- Difficulty levels: beginner, intermediate, advanced
- Optional practical examples
- Structured with Overview, Key Concepts, Explanation, Summary

### 2. Slides Generation
- Presentation outlines with speaker notes
- Configurable number of slides (5-30)
- JSON structured output for easy rendering
- Bullet points and speaker notes per slide

### 3. Lab Code Generation
- Code examples in multiple languages
- Supported: Python, JavaScript, TypeScript, Java, C/C++, C#, Go, Rust, SQL
- Optional comments and test cases
- Educational explanations included

### 4. Quiz Generation
- Multiple question types: MCQ, True/False, Short Answer
- Configurable number of questions (3-20)
- Includes correct answers and explanations
- Difficulty-adjusted content

## API Endpoints

### Generate Theory Notes
```
POST /api/generate/notes
```
**Request Body:**
```json
{
  "topic": "Binary Search Trees",
  "difficulty": "intermediate",
  "include_examples": true,
  "additional_context": "Focus on balancing algorithms"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "theory_notes",
    "topic": "Binary Search Trees",
    "difficulty": "intermediate",
    "content": "# Binary Search Trees\n\n## Overview\n...",
    "sources": [
      {"type": "wikipedia", "articles": ["Binary search tree", "Tree (data structure)"]}
    ],
    "metadata": {
      "model": "anthropic/claude-sonnet-4",
      "tokens_used": 1523
    }
  }
}
```

### Generate Slides
```
POST /api/generate/slides
```
**Request Body:**
```json
{
  "topic": "Machine Learning Basics",
  "num_slides": 10,
  "additional_context": null
}
```

### Generate Lab Code
```
POST /api/generate/code
```
**Request Body:**
```json
{
  "topic": "Implementing a Stack",
  "language": "python",
  "difficulty": "beginner",
  "include_comments": true,
  "include_tests": true
}
```

### Generate Quiz
```
POST /api/generate/quiz
```
**Request Body:**
```json
{
  "topic": "Database Normalization",
  "num_questions": 5,
  "question_types": ["mcq", "true_false", "short_answer"],
  "difficulty": "intermediate"
}
```

### Search Wikipedia (Preview Sources)
```
GET /api/generate/wikipedia/search?query=Binary%20Search&max_results=5
```

### Get Supported Languages
```
GET /api/generate/supported-languages
```

## File Structure

```
backend-fastapi/
├── app/
│   ├── routes/
│   │   └── generation.py          # API endpoints
│   ├── services/
│   │   ├── generation_service.py  # AI generation logic
│   │   └── wikipedia_service.py   # Wikipedia API client
│   └── models/
│       └── generation_schemas.py  # Pydantic schemas

frontend/
├── src/
│   ├── pages/
│   │   └── Generate.jsx           # Generation UI
│   └── services/
│       └── api.js                 # API client (generationAPI)
```

## Configuration

### Environment Variables (.env)
```env
# OpenRouter API (Required for AI Generation)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### OpenRouter Settings
- **Model**: `anthropic/claude-sonnet-4`
- **Max Tokens**: 4096
- **Temperature**: 0.7

## External Context Flow

1. **User Input**: Topic entered in frontend
2. **Wikipedia Search**: Backend queries Wikipedia API for relevant articles
3. **Context Extraction**: Article summaries combined into context string
4. **AI Generation**: Context + user prompt sent to Claude via OpenRouter
5. **Response**: Generated content returned with source attribution

```python
# Simplified flow in generation_service.py
async def generate_theory_notes(topic):
    # 1. Fetch Wikipedia context
    wiki_context = await wiki_service.get_context_for_topic(topic)

    # 2. Build prompt with context
    prompt = f"""
    Topic: {topic}

    Reference Material:
    {wiki_context['combined_context']}

    Generate comprehensive study notes...
    """

    # 3. Call OpenRouter API
    response = await self._call_openrouter(system_prompt, prompt)

    # 4. Return with sources
    return {
        "content": response["content"],
        "sources": [{"type": "wikipedia", "articles": wiki_context["articles"]}]
    }
```

## Frontend Usage

### Generate Page (`/generate`)

1. **Select Type**: Notes, Slides, Code, or Quiz
2. **Enter Topic**: Any educational topic
3. **Preview Sources**: Click to see Wikipedia articles that will be used
4. **Configure Options**: Difficulty, language, etc.
5. **Generate**: Click to create content
6. **View Results**: Rendered markdown/structured content
7. **Copy**: Copy generated content to clipboard

### API Client Usage
```javascript
import { generationAPI } from '../services/api';

// Generate notes
const result = await generationAPI.generateNotes({
  topic: "Binary Search Trees",
  difficulty: "intermediate",
  include_examples: true
});

// Search Wikipedia
const sources = await generationAPI.searchWikipedia("Machine Learning");
```

## Testing

### Manual Testing

1. **Start Backend**:
   ```bash
   cd backend-fastapi
   uvicorn app.main:app --reload
   ```

2. **Test Wikipedia**:
   - Open `http://localhost:8000/docs`
   - Try `GET /api/generate/wikipedia/search`
   - Verify articles are returned

3. **Test Generation**:
   - Try `POST /api/generate/notes`
   - Verify content is generated with sources

### Verification Checklist

| Feature | Test | Expected Result |
|---------|------|-----------------|
| Wikipedia Search | Query "Python programming" | Returns 3+ articles |
| Notes Generation | Topic "Data Structures" | Markdown content with sections |
| Code Generation | Topic "Sorting algorithms", language "python" | Syntactically correct code |
| Quiz Generation | Topic "SQL", 5 questions | JSON with questions and answers |
| Source Attribution | Any generation | Sources array with Wikipedia articles |

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 403 Wikipedia | Missing User-Agent | Fixed in wikipedia_service.py |
| 401 Unauthorized | Invalid/missing token | Login first |
| 500 Generation Failed | Invalid API key | Check OPENROUTER_API_KEY in .env |
| Timeout | Large generation | Increase timeout or reduce scope |

## Limitations

1. **Wikipedia Only**: External context limited to Wikipedia (Part 2 RAG will add internal context)
2. **Rate Limits**: OpenRouter API has rate limits based on plan
3. **Token Limits**: Max 4096 output tokens per generation
4. **Language Support**: Code generation limited to listed languages

## Future Enhancements (Part 2 Integration)

When Part 2 (RAG) is implemented:
- Internal course materials will be searchable
- Generation will combine Wikipedia + uploaded content
- Better grounding in course-specific materials

## Dependencies

```
httpx>=0.24.0          # HTTP client for Wikipedia/OpenRouter
anthropic>=0.18.1      # (Optional) Direct Anthropic API
pydantic>=2.5.0        # Request/Response schemas
```

## References

- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page)
- [Claude Documentation](https://docs.anthropic.com/)
