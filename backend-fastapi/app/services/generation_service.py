"""
AI Generation Service - Part 3
Generates learning materials using OpenRouter API with external context
"""

import httpx
from typing import Optional, Dict, List
from app.core.config import settings
from app.services.wikipedia_service import get_wikipedia_service
import json


class GenerationService:
    """Service for AI-powered content generation using OpenRouter"""

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        # Use Claude Sonnet via OpenRouter
        self.model = "anthropic/claude-sonnet-4"

    def _ensure_api_key(self):
        """Ensure OpenRouter API key is available"""
        if not self.api_key or self.api_key == "your-openrouter-api-key":
            raise ValueError("OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env")

    async def _call_openrouter(self, system_prompt: str, user_prompt: str) -> Dict:
        """
        Make a request to OpenRouter API

        Args:
            system_prompt: System message for the AI
            user_prompt: User message/request

        Returns:
            API response with content and usage info
        """
        self._ensure_api_key()

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "AI Learning Platform"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 4096,
            "temperature": 0.7
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return {
                "content": data["choices"][0]["message"]["content"],
                "usage": data.get("usage", {}),
                "model": data.get("model", self.model)
            }

    async def generate_theory_notes(
        self,
        topic: str,
        additional_context: Optional[str] = None,
        difficulty: str = "intermediate",
        include_examples: bool = True
    ) -> Dict:
        """
        Generate theory reading notes for a topic

        Args:
            topic: Topic to generate notes for
            additional_context: Extra context to include
            difficulty: beginner, intermediate, or advanced
            include_examples: Whether to include examples

        Returns:
            Generated notes with metadata
        """
        # Fetch external context from Wikipedia
        wiki_service = get_wikipedia_service()
        wiki_context = await wiki_service.get_context_for_topic(topic)

        # Build the prompt
        system_prompt = """You are an expert educational content creator specializing in creating
comprehensive, well-structured learning materials for university students. Your notes should be:
- Clear and easy to understand
- Well-organized with logical flow
- Include key concepts and definitions
- Academically rigorous but accessible
- Include practical examples where appropriate"""

        context_section = ""
        if wiki_context.get("found"):
            context_section = f"""
## Reference Material from Wikipedia:
{wiki_context['combined_context']}

Use this reference material to ground your notes in factual information."""

        if additional_context:
            context_section += f"""

## Additional Course Context:
{additional_context}"""

        user_prompt = f"""Create comprehensive study notes on the topic: "{topic}"

Difficulty level: {difficulty}
Include examples: {"Yes" if include_examples else "No"}

{context_section}

Please structure the notes with:
1. **Overview** - Brief introduction to the topic
2. **Key Concepts** - Main ideas and definitions
3. **Detailed Explanation** - In-depth coverage of the material
4. **Examples** - Practical examples (if requested)
5. **Summary** - Key takeaways
6. **Further Reading** - Suggested topics to explore

Format the output in clean Markdown."""

        try:
            response = await self._call_openrouter(system_prompt, user_prompt)

            return {
                "success": True,
                "type": "theory_notes",
                "topic": topic,
                "difficulty": difficulty,
                "content": response["content"],
                "sources": [
                    {"type": "wikipedia", "articles": [a["title"] for a in wiki_context.get("articles", [])]}
                ],
                "metadata": {
                    "model": response["model"],
                    "tokens_used": response["usage"].get("completion_tokens", 0)
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "theory_notes",
                "topic": topic
            }

    async def generate_slides_outline(
        self,
        topic: str,
        num_slides: int = 10,
        additional_context: Optional[str] = None
    ) -> Dict:
        """
        Generate slide presentation outline for a topic

        Args:
            topic: Topic for the presentation
            num_slides: Target number of slides
            additional_context: Extra context to include

        Returns:
            Slide outline with content for each slide
        """
        # Fetch external context
        wiki_service = get_wikipedia_service()
        wiki_context = await wiki_service.get_context_for_topic(topic)

        system_prompt = """You are an expert at creating educational slide presentations.
Create clear, visually-oriented slide content that:
- Has one main idea per slide
- Uses bullet points effectively
- Includes speaker notes for elaboration
- Follows good presentation design principles"""

        context_section = ""
        if wiki_context.get("found"):
            context_section = f"""
Reference Material:
{wiki_context['combined_context'][:3000]}"""

        if additional_context:
            context_section += f"\n\nCourse Context:\n{additional_context}"

        user_prompt = f"""Create a {num_slides}-slide presentation outline on: "{topic}"

{context_section}

For each slide, provide:
1. Slide title
2. 3-5 bullet points of content
3. Brief speaker notes

Format as JSON array with this structure:
[
  {{
    "slide_number": 1,
    "title": "Slide Title",
    "bullets": ["Point 1", "Point 2", "Point 3"],
    "speaker_notes": "Additional context for the presenter..."
  }}
]

Start with a title slide and end with a summary/Q&A slide."""

        try:
            response = await self._call_openrouter(system_prompt, user_prompt)
            content = response["content"]

            # Try to parse as JSON
            try:
                # Extract JSON from the response
                json_match = content
                if "```json" in content:
                    json_match = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    json_match = content.split("```")[1].split("```")[0]
                slides = json.loads(json_match)
            except:
                slides = content  # Return raw if parsing fails

            return {
                "success": True,
                "type": "slides",
                "topic": topic,
                "num_slides": num_slides,
                "slides": slides,
                "sources": [
                    {"type": "wikipedia", "articles": [a["title"] for a in wiki_context.get("articles", [])]}
                ],
                "metadata": {
                    "model": response["model"],
                    "tokens_used": response["usage"].get("completion_tokens", 0)
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "slides",
                "topic": topic
            }

    async def generate_lab_code(
        self,
        topic: str,
        language: str = "python",
        difficulty: str = "intermediate",
        include_comments: bool = True,
        include_tests: bool = True
    ) -> Dict:
        """
        Generate lab code examples for a topic

        Args:
            topic: Programming topic/concept
            language: Programming language
            difficulty: beginner, intermediate, or advanced
            include_comments: Add explanatory comments
            include_tests: Include test cases

        Returns:
            Generated code with explanations
        """
        # Fetch external context
        wiki_service = get_wikipedia_service()
        wiki_context = await wiki_service.get_context_for_topic(f"{topic} programming {language}")

        system_prompt = f"""You are an expert {language} programmer and educator.
Create well-structured, educational code that:
- Is syntactically correct and runnable
- Follows {language} best practices and conventions
- Includes clear, educational comments
- Demonstrates the concept effectively
- Is appropriate for university-level learning"""

        context_section = ""
        if wiki_context.get("found"):
            context_section = f"""
Reference Material:
{wiki_context['combined_context'][:2000]}"""

        user_prompt = f"""Create a {language} code example demonstrating: "{topic}"

Difficulty: {difficulty}
Include comments: {"Yes" if include_comments else "No"}
Include tests: {"Yes" if include_tests else "No"}

{context_section}

Provide:
1. **Overview** - Brief explanation of what the code demonstrates
2. **Main Code** - The implementation with comments
3. **Example Usage** - How to use the code
4. **Test Cases** - Unit tests (if requested)
5. **Key Concepts** - What students should learn from this

Ensure all code is syntactically correct and can be run directly."""

        try:
            response = await self._call_openrouter(system_prompt, user_prompt)

            return {
                "success": True,
                "type": "lab_code",
                "topic": topic,
                "language": language,
                "difficulty": difficulty,
                "content": response["content"],
                "sources": [
                    {"type": "wikipedia", "articles": [a["title"] for a in wiki_context.get("articles", [])]}
                ],
                "metadata": {
                    "model": response["model"],
                    "tokens_used": response["usage"].get("completion_tokens", 0),
                    "language": language
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "lab_code",
                "topic": topic
            }

    async def generate_quiz(
        self,
        topic: str,
        num_questions: int = 5,
        question_types: List[str] = None,
        difficulty: str = "intermediate"
    ) -> Dict:
        """
        Generate quiz questions for a topic

        Args:
            topic: Topic for the quiz
            num_questions: Number of questions
            question_types: Types of questions (mcq, short_answer, true_false)
            difficulty: beginner, intermediate, or advanced

        Returns:
            Quiz questions with answers
        """
        if question_types is None:
            question_types = ["mcq", "short_answer", "true_false"]

        # Fetch external context
        wiki_service = get_wikipedia_service()
        wiki_context = await wiki_service.get_context_for_topic(topic)

        system_prompt = """You are an expert educator creating assessment questions.
Create questions that:
- Test understanding, not just memorization
- Have clear, unambiguous answers
- Are appropriate for university-level students
- Include helpful explanations for the answers"""

        context_section = ""
        if wiki_context.get("found"):
            context_section = f"""
Reference Material:
{wiki_context['combined_context'][:3000]}"""

        types_str = ", ".join(question_types)
        user_prompt = f"""Create {num_questions} quiz questions on: "{topic}"

Difficulty: {difficulty}
Question types to include: {types_str}

{context_section}

Format as JSON:
{{
  "quiz_title": "Quiz on [Topic]",
  "questions": [
    {{
      "question_number": 1,
      "type": "mcq",
      "question": "Question text?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "A",
      "explanation": "Why this is correct..."
    }},
    {{
      "question_number": 2,
      "type": "true_false",
      "question": "Statement to evaluate",
      "correct_answer": true,
      "explanation": "Why this is true/false..."
    }},
    {{
      "question_number": 3,
      "type": "short_answer",
      "question": "Question requiring written response?",
      "sample_answer": "Expected answer content...",
      "key_points": ["Point 1", "Point 2"]
    }}
  ]
}}"""

        try:
            response = await self._call_openrouter(system_prompt, user_prompt)
            content = response["content"]

            # Try to parse as JSON
            try:
                json_match = content
                if "```json" in content:
                    json_match = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    json_match = content.split("```")[1].split("```")[0]
                quiz = json.loads(json_match)
            except:
                quiz = content

            return {
                "success": True,
                "type": "quiz",
                "topic": topic,
                "num_questions": num_questions,
                "difficulty": difficulty,
                "quiz": quiz,
                "sources": [
                    {"type": "wikipedia", "articles": [a["title"] for a in wiki_context.get("articles", [])]}
                ],
                "metadata": {
                    "model": response["model"],
                    "tokens_used": response["usage"].get("completion_tokens", 0)
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "quiz",
                "topic": topic
            }


# Singleton instance
_generation_service: Optional[GenerationService] = None


def get_generation_service() -> GenerationService:
    """Get or create generation service instance"""
    global _generation_service
    if _generation_service is None:
        _generation_service = GenerationService()
    return _generation_service
