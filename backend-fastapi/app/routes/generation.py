"""
Generation Routes - Part 3: AI-Generated Learning Materials
"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.models.generation_schemas import (
    GenerateNotesRequest, GenerateNotesResponse,
    GenerateSlidesRequest, GenerateSlidesResponse,
    GenerateCodeRequest, GenerateCodeResponse,
    GenerateQuizRequest, GenerateQuizResponse,
    WikipediaSearchResponse
)
from app.services.generation_service import get_generation_service
from app.services.wikipedia_service import get_wikipedia_service
from app.core.security import get_current_user

router = APIRouter(prefix="/generate", tags=["Generation"])


@router.post("/notes", response_model=dict)
async def generate_theory_notes(
    request: GenerateNotesRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate theory reading notes for a topic.

    Uses Wikipedia as external context source and Claude AI for generation.
    """
    service = get_generation_service()

    try:
        result = await service.generate_theory_notes(
            topic=request.topic,
            additional_context=request.additional_context,
            difficulty=request.difficulty.value,
            include_examples=request.include_examples
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Generation failed")
            )

        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation error: {str(e)}"
        )


@router.post("/slides", response_model=dict)
async def generate_slides(
    request: GenerateSlidesRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate slide presentation outline for a topic.

    Returns structured slide content with titles, bullets, and speaker notes.
    """
    service = get_generation_service()

    try:
        result = await service.generate_slides_outline(
            topic=request.topic,
            num_slides=request.num_slides,
            additional_context=request.additional_context
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Generation failed")
            )

        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation error: {str(e)}"
        )


@router.post("/code", response_model=dict)
async def generate_lab_code(
    request: GenerateCodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate lab code examples for a programming topic.

    Includes code, comments, usage examples, and optional tests.
    Supported languages: Python, JavaScript, TypeScript, Java, C/C++, Go, Rust, SQL
    """
    service = get_generation_service()

    try:
        result = await service.generate_lab_code(
            topic=request.topic,
            language=request.language.value,
            difficulty=request.difficulty.value,
            include_comments=request.include_comments,
            include_tests=request.include_tests
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Generation failed")
            )

        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation error: {str(e)}"
        )


@router.post("/quiz", response_model=dict)
async def generate_quiz(
    request: GenerateQuizRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate quiz questions for a topic.

    Supports multiple question types: MCQ, short answer, true/false.
    Includes answers and explanations.
    """
    service = get_generation_service()

    try:
        result = await service.generate_quiz(
            topic=request.topic,
            num_questions=request.num_questions,
            question_types=request.question_types,
            difficulty=request.difficulty.value
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Generation failed")
            )

        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation error: {str(e)}"
        )


@router.get("/wikipedia/search", response_model=dict)
async def search_wikipedia(
    query: str,
    max_results: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """
    Search Wikipedia for a topic (for preview/context selection).

    Returns article summaries that can be used as context for generation.
    """
    if len(query) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query must be at least 2 characters"
        )

    wiki_service = get_wikipedia_service()

    try:
        context = await wiki_service.get_context_for_topic(query, max_articles=max_results)

        return {
            "success": True,
            "data": context
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Wikipedia search error: {str(e)}"
        )


@router.get("/supported-languages", response_model=dict)
async def get_supported_languages():
    """Get list of supported programming languages for code generation"""
    return {
        "success": True,
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
