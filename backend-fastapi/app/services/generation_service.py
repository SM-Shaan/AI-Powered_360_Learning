"""
AI Generation Service - Part 3
Generates learning materials using OpenRouter API with internal + external context

Internal Context: Course materials via Part 2 semantic search (RAG)
External Context: Wikipedia via MCP-style wrapper
"""

import httpx
from typing import Optional, Dict, List
from app.core.config import settings
from app.services.wikipedia_service import get_wikipedia_service
from app.services.retrieval_service import get_retrieval_service
import json


class GenerationService:
    """Service for AI-powered content generation using OpenRouter"""

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        # Use Claude Sonnet via OpenRouter
        self.model = "anthropic/claude-sonnet-4"

    async def _get_internal_context(
        self,
        topic: str,
        category: Optional[str] = None,
        max_chunks: int = 5
    ) -> Dict:
        """
        Fetch internal context from course materials using Part 2 semantic search.

        Args:
            topic: Topic to search for
            category: Filter by category (theory/lab)
            max_chunks: Maximum chunks to retrieve

        Returns:
            Dict with found status, context text, and sources
        """
        try:
            retrieval_service = get_retrieval_service()

            # Search for relevant chunks in course materials
            chunks = await retrieval_service.search_chunks(
                query=topic,
                top_k=max_chunks,
                threshold=0.4,
                category=category
            )

            if not chunks:
                return {
                    "found": False,
                    "context": "",
                    "sources": []
                }

            # Build context from chunks
            context_parts = []
            sources = []

            for chunk in chunks:
                source_title = chunk.get('content_title', 'Course Material')
                chunk_text = chunk.get('chunk_text', '')
                similarity = chunk.get('similarity', 0)

                # Only include reasonably relevant chunks
                if similarity >= 0.4:
                    context_parts.append(f"[From: {source_title}]\n{chunk_text}")

                    # Track unique sources
                    source_info = {
                        "title": source_title,
                        "content_id": chunk.get('content_id'),
                        "category": chunk.get('content_category'),
                        "relevance": round(similarity, 3)
                    }
                    if source_info not in sources:
                        sources.append(source_info)

            return {
                "found": len(context_parts) > 0,
                "context": "\n\n---\n\n".join(context_parts),
                "sources": sources
            }

        except Exception as e:
            print(f"Error fetching internal context: {e}")
            return {
                "found": False,
                "context": "",
                "sources": [],
                "error": str(e)
            }

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
        include_examples: bool = True,
        use_internal_context: bool = True
    ) -> Dict:
        """
        Generate theory reading notes for a topic

        Args:
            topic: Topic to generate notes for
            additional_context: Extra context to include
            difficulty: beginner, intermediate, or advanced
            include_examples: Whether to include examples
            use_internal_context: Whether to search course materials

        Returns:
            Generated notes with metadata
        """
        # Fetch INTERNAL context from course materials (Part 2)
        internal_context = {"found": False, "context": "", "sources": []}
        if use_internal_context:
            internal_context = await self._get_internal_context(topic, category="theory")

        # Fetch EXTERNAL context from Wikipedia
        wiki_service = get_wikipedia_service()
        wiki_context = await wiki_service.get_context_for_topic(topic)

        # Build the prompt
        system_prompt = """You are an expert educational content creator specializing in creating
comprehensive, well-structured learning materials for university students. Your notes should be:
- Clear and easy to understand
- Well-organized with logical flow
- Include key concepts and definitions
- Academically rigorous but accessible
- Include practical examples where appropriate

IMPORTANT: When course materials are provided, prioritize and ground your content in those materials.
The course-specific content should take precedence over general Wikipedia information."""

        context_section = ""

        # Internal context (course materials) - PRIORITY
        if internal_context.get("found"):
            context_section = f"""
## Course Materials (Primary Source):
{internal_context['context']}

Base your notes primarily on these course materials."""

        # External context (Wikipedia) - SUPPLEMENTARY
        if wiki_context.get("found"):
            context_section += f"""

## Reference Material from Wikipedia (Supplementary):
{wiki_context['combined_context'][:2500]}

Use this for additional context where course materials don't cover."""

        if additional_context:
            context_section += f"""

## Additional Context:
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

            # Combine sources
            sources = []
            if internal_context.get("sources"):
                sources.append({
                    "type": "course_materials",
                    "items": internal_context["sources"]
                })
            if wiki_context.get("articles"):
                sources.append({
                    "type": "wikipedia",
                    "articles": [a["title"] for a in wiki_context.get("articles", [])]
                })

            return {
                "success": True,
                "type": "theory_notes",
                "topic": topic,
                "difficulty": difficulty,
                "content": response["content"],
                "sources": sources,
                "metadata": {
                    "model": response["model"],
                    "tokens_used": response["usage"].get("completion_tokens", 0),
                    "internal_context_used": internal_context.get("found", False),
                    "external_context_used": wiki_context.get("found", False)
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
        additional_context: Optional[str] = None,
        use_internal_context: bool = True
    ) -> Dict:
        """
        Generate slide presentation outline for a topic

        Args:
            topic: Topic for the presentation
            num_slides: Target number of slides
            additional_context: Extra context to include
            use_internal_context: Whether to search course materials

        Returns:
            Slide outline with content for each slide
        """
        # Fetch INTERNAL context from course materials
        internal_context = {"found": False, "context": "", "sources": []}
        if use_internal_context:
            internal_context = await self._get_internal_context(topic, category="theory")

        # Fetch EXTERNAL context
        wiki_service = get_wikipedia_service()
        wiki_context = await wiki_service.get_context_for_topic(topic)

        system_prompt = """You are an expert at creating educational slide presentations.
Create clear, visually-oriented slide content that:
- Has one main idea per slide
- Uses bullet points effectively
- Includes speaker notes for elaboration
- Follows good presentation design principles

IMPORTANT: When course materials are provided, base your slides primarily on that content."""

        context_section = ""
        if internal_context.get("found"):
            context_section = f"""
Course Materials (Primary):
{internal_context['context'][:3000]}"""

        if wiki_context.get("found"):
            context_section += f"""

Wikipedia Reference (Supplementary):
{wiki_context['combined_context'][:2000]}"""

        if additional_context:
            context_section += f"\n\nAdditional Context:\n{additional_context}"

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

            # Combine sources
            sources = []
            if internal_context.get("sources"):
                sources.append({
                    "type": "course_materials",
                    "items": internal_context["sources"]
                })
            if wiki_context.get("articles"):
                sources.append({
                    "type": "wikipedia",
                    "articles": [a["title"] for a in wiki_context.get("articles", [])]
                })

            return {
                "success": True,
                "type": "slides",
                "topic": topic,
                "num_slides": num_slides,
                "slides": slides,
                "sources": sources,
                "metadata": {
                    "model": response["model"],
                    "tokens_used": response["usage"].get("completion_tokens", 0),
                    "internal_context_used": internal_context.get("found", False),
                    "external_context_used": wiki_context.get("found", False)
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
        include_tests: bool = True,
        use_internal_context: bool = True
    ) -> Dict:
        """
        Generate lab code examples for a topic

        Args:
            topic: Programming topic/concept
            language: Programming language
            difficulty: beginner, intermediate, or advanced
            include_comments: Add explanatory comments
            include_tests: Include test cases
            use_internal_context: Whether to search course materials

        Returns:
            Generated code with explanations
        """
        # Fetch INTERNAL context from course materials (lab category)
        internal_context = {"found": False, "context": "", "sources": []}
        if use_internal_context:
            internal_context = await self._get_internal_context(
                f"{topic} {language}",
                category="lab",
                max_chunks=5
            )

        # Fetch EXTERNAL context
        wiki_service = get_wikipedia_service()
        wiki_context = await wiki_service.get_context_for_topic(f"{topic} programming {language}")

        system_prompt = f"""You are an expert {language} programmer and educator.
Create well-structured, educational code that:
- Is syntactically correct and runnable
- Follows {language} best practices and conventions
- Includes clear, educational comments
- Demonstrates the concept effectively
- Is appropriate for university-level learning

IMPORTANT: When course lab materials are provided, follow the coding style and patterns used in those materials.
Adapt examples to be consistent with the course's approach."""

        context_section = ""
        if internal_context.get("found"):
            context_section = f"""
Course Lab Materials (Follow this style):
{internal_context['context'][:3000]}

Use similar patterns and coding style as shown in the course materials."""

        if wiki_context.get("found"):
            context_section += f"""

Wikipedia Reference (Supplementary):
{wiki_context['combined_context'][:1500]}"""

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

            # Combine sources
            sources = []
            if internal_context.get("sources"):
                sources.append({
                    "type": "course_materials",
                    "items": internal_context["sources"]
                })
            if wiki_context.get("articles"):
                sources.append({
                    "type": "wikipedia",
                    "articles": [a["title"] for a in wiki_context.get("articles", [])]
                })

            return {
                "success": True,
                "type": "lab_code",
                "topic": topic,
                "language": language,
                "difficulty": difficulty,
                "content": response["content"],
                "sources": sources,
                "metadata": {
                    "model": response["model"],
                    "tokens_used": response["usage"].get("completion_tokens", 0),
                    "language": language,
                    "internal_context_used": internal_context.get("found", False),
                    "external_context_used": wiki_context.get("found", False)
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
        difficulty: str = "intermediate",
        use_internal_context: bool = True
    ) -> Dict:
        """
        Generate quiz questions for a topic

        Args:
            topic: Topic for the quiz
            num_questions: Number of questions
            question_types: Types of questions (mcq, short_answer, true_false)
            difficulty: beginner, intermediate, or advanced
            use_internal_context: Whether to search course materials

        Returns:
            Quiz questions with answers
        """
        if question_types is None:
            question_types = ["mcq", "short_answer", "true_false"]

        # Fetch INTERNAL context from course materials
        internal_context = {"found": False, "context": "", "sources": []}
        if use_internal_context:
            internal_context = await self._get_internal_context(topic, max_chunks=6)

        # Fetch EXTERNAL context
        wiki_service = get_wikipedia_service()
        wiki_context = await wiki_service.get_context_for_topic(topic)

        system_prompt = """You are an expert educator creating assessment questions.
Create questions that:
- Test understanding, not just memorization
- Have clear, unambiguous answers
- Are appropriate for university-level students
- Include helpful explanations for the answers

IMPORTANT: When course materials are provided, create questions that test understanding
of the specific content covered in those materials. Questions should be grounded in the course content."""

        context_section = ""
        if internal_context.get("found"):
            context_section = f"""
Course Materials (Base questions on this content):
{internal_context['context'][:4000]}

Create questions that test understanding of this course content."""

        if wiki_context.get("found"):
            context_section += f"""

Wikipedia Reference (Supplementary):
{wiki_context['combined_context'][:2000]}"""

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

            # Combine sources
            sources = []
            if internal_context.get("sources"):
                sources.append({
                    "type": "course_materials",
                    "items": internal_context["sources"]
                })
            if wiki_context.get("articles"):
                sources.append({
                    "type": "wikipedia",
                    "articles": [a["title"] for a in wiki_context.get("articles", [])]
                })

            return {
                "success": True,
                "type": "quiz",
                "topic": topic,
                "num_questions": num_questions,
                "difficulty": difficulty,
                "quiz": quiz,
                "sources": sources,
                "metadata": {
                    "model": response["model"],
                    "tokens_used": response["usage"].get("completion_tokens", 0),
                    "internal_context_used": internal_context.get("found", False),
                    "external_context_used": wiki_context.get("found", False)
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
