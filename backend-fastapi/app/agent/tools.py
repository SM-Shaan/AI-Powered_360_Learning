"""
Tools available to the Study Assistant agent.

Each tool wraps an existing service so the agent adds an orchestration layer
rather than a parallel implementation. Tools are plain async callables plus a
JSON schema describing their arguments - the schema is what the model sees, so
descriptions are written for the model, not for a human reader.

Every tool returns a dict with at least {"ok": bool}. Failures come back as
values rather than exceptions so a single broken tool degrades the answer
instead of killing the run.
"""

from typing import Any, Callable, Dict, List, Optional


async def search_materials(
    query: str,
    category: Optional[str] = None,
    top_k: int = 5,
) -> Dict[str, Any]:
    """Retrieve course-material chunks relevant to a query."""
    from app.services.retrieval_service import get_retrieval_service

    try:
        results = await get_retrieval_service().hybrid_search(
            query=query, top_k=top_k, category=category
        )
    except Exception as e:
        return {"ok": False, "error": f"retrieval failed: {e}", "results": []}

    trimmed = [
        {
            "content_id": r.get("content_id", ""),
            "title": r.get("content_title", "Untitled"),
            "category": r.get("content_category", ""),
            # Truncated: the agent needs enough to judge relevance, not the
            # whole chunk. Full text is fetched via get_material when needed.
            "excerpt": (r.get("chunk_text", "") or "")[:400],
            "score": round(
                r.get("combined_score", r.get("similarity", 0)) or 0, 3
            ),
        }
        for r in (results or [])
    ]

    return {"ok": True, "count": len(trimmed), "results": trimmed}


async def get_material(content_id: str) -> Dict[str, Any]:
    """Fetch one course material's full record by id."""
    from app.core.supabase import get_supabase

    try:
        result = (
            get_supabase()
            .table("content")
            .select("id, title, description, category, content_type, topic, week")
            .eq("id", content_id)
            .execute()
        )
    except Exception as e:
        return {"ok": False, "error": f"lookup failed: {e}"}

    if not result.data:
        return {"ok": False, "error": f"no material with id {content_id}"}

    return {"ok": True, "material": result.data[0]}


async def lookup_wikipedia(topic: str) -> Dict[str, Any]:
    """Fetch background context from Wikipedia for topics outside the course."""
    from app.services.wikipedia_service import get_wikipedia_service

    try:
        context = await get_wikipedia_service().get_context_for_topic(topic)
    except Exception as e:
        return {"ok": False, "error": f"wikipedia lookup failed: {e}"}

    if not context.get("found"):
        return {"ok": True, "found": False, "summary": ""}

    return {
        "ok": True,
        "found": True,
        "summary": (context.get("combined_context", "") or "")[:1500],
        "articles": [a.get("title") for a in context.get("articles", [])],
    }


async def generate_quiz(
    topic: str,
    num_questions: int = 3,
    difficulty: str = "intermediate",
) -> Dict[str, Any]:
    """Produce practice questions on a topic."""
    from app.services.generation_service import get_generation_service

    try:
        result = await get_generation_service().generate_quiz(
            topic=topic, num_questions=num_questions, difficulty=difficulty
        )
    except Exception as e:
        return {"ok": False, "error": f"quiz generation failed: {e}"}

    if not result.get("success"):
        return {"ok": False, "error": result.get("error", "generation failed")}

    return {"ok": True, "quiz": result.get("content", "")}


# --- Schemas the model sees --------------------------------------------------

TOOL_SCHEMAS: List[Dict[str, Any]] = [
    {
        "name": "search_materials",
        "description": (
            "Search the course materials for content relevant to a question. "
            "Use this FIRST for any question about course content - it is the "
            "authoritative source. Returns ranked excerpts with titles and ids."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "What to search for, in natural language.",
                },
                "category": {
                    "type": "string",
                    "enum": ["theory", "lab"],
                    "description": "Optional filter. Omit to search everything.",
                },
                "top_k": {
                    "type": "integer",
                    "description": "How many results to return (default 5).",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_material",
        "description": (
            "Fetch the full record for one course material by its id. Use after "
            "search_materials when an excerpt looks relevant but is truncated."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "content_id": {
                    "type": "string",
                    "description": "The content_id from a search_materials result.",
                },
            },
            "required": ["content_id"],
        },
    },
    {
        "name": "lookup_wikipedia",
        "description": (
            "Get general background on a topic from Wikipedia. Use ONLY when "
            "the course materials do not cover the topic - course content "
            "always takes precedence."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Topic to look up."},
            },
            "required": ["topic"],
        },
    },
    {
        "name": "generate_quiz",
        "description": (
            "Create practice questions on a topic. Use when the student asks to "
            "be tested, quizzed, or wants practice problems."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Quiz topic."},
                "num_questions": {
                    "type": "integer",
                    "description": "How many questions (default 3).",
                },
                "difficulty": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                },
            },
            "required": ["topic"],
        },
    },
]


TOOL_REGISTRY: Dict[str, Callable] = {
    "search_materials": search_materials,
    "get_material": get_material,
    "lookup_wikipedia": lookup_wikipedia,
    "generate_quiz": generate_quiz,
}


async def dispatch(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run a tool by name.

    Unknown names and bad arguments come back as error values rather than
    raising, because both are things the model can and should recover from on
    the next turn.
    """
    tool = TOOL_REGISTRY.get(name)
    if tool is None:
        return {"ok": False, "error": f"unknown tool '{name}'"}

    try:
        return await tool(**arguments)
    except TypeError as e:
        return {"ok": False, "error": f"bad arguments for '{name}': {e}"}
    except Exception as e:
        return {"ok": False, "error": f"tool '{name}' failed: {e}"}
