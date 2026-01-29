"""
Validation Routes - Part 4: Content Validation & Evaluation System
"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.models.validation_schemas import (
    ValidateCodeRequest,
    ValidateTheoryRequest,
    ValidateGeneratedRequest,
    ValidationLevel
)
from app.services.validation_service import get_validation_service
from app.core.security import get_current_user

router = APIRouter(prefix="/validate", tags=["Validation"])


@router.post("/code", response_model=dict)
async def validate_code(
    request: ValidateCodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Validate generated code for syntax correctness and quality.

    Performs:
    - Syntax validation (AST parsing for Python)
    - Security checks for dangerous patterns
    - Optional code execution with tests
    - AI-assisted quality evaluation

    Supported languages: Python (full support), JavaScript/TypeScript (syntax only)
    """
    service = get_validation_service()

    try:
        # Determine if we should run AI evaluation
        run_ai = request.validation_level == ValidationLevel.full

        # Determine if we should execute code
        should_execute = request.validation_level in [ValidationLevel.with_execution, ValidationLevel.full]

        if not should_execute:
            # Syntax only validation
            if request.language == "python":
                syntax_result = service.validate_python_syntax(request.code)
            elif request.language in ["javascript", "typescript"]:
                syntax_result = service.validate_javascript_syntax(request.code)
            else:
                syntax_result = {
                    "is_valid": True,
                    "language": request.language,
                    "issues": [],
                    "error_message": None
                }

            # Add security checks
            security_issues = service.check_dangerous_code(request.code, request.language)
            syntax_result["issues"].extend(security_issues)

            return {
                "success": True,
                "data": {
                    "success": True,
                    "content_type": "code",
                    "syntax": syntax_result,
                    "execution": None,
                    "ai_evaluation": None,
                    "is_valid": syntax_result["is_valid"],
                    "overall_score": None,
                    "summary": "Syntax valid" if syntax_result["is_valid"] else "Syntax errors found"
                }
            }

        # Full validation with execution
        result = await service.validate_code(
            code=request.code,
            language=request.language,
            test_code=request.test_code,
            run_ai_evaluation=run_ai,
            topic="code validation"
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation error: {str(e)}"
        )


@router.post("/theory", response_model=dict)
async def validate_theory(
    request: ValidateTheoryRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Validate generated theory content for structure and quality.

    Performs:
    - Structure validation (sections, organization)
    - Reference grounding check against course materials
    - AI-assisted quality evaluation

    Returns scores for accuracy, relevance, coherence, and completeness.
    """
    service = get_validation_service()

    try:
        run_ai = request.validation_level == ValidationLevel.full

        result = await service.validate_theory(
            content=request.content,
            topic=request.topic,
            content_ids=request.content_ids,
            run_ai_evaluation=run_ai
        )

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation error: {str(e)}"
        )


@router.post("/content", response_model=dict)
async def validate_generated_content(
    request: ValidateGeneratedRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Validate any type of generated content.

    Automatically routes to appropriate validation based on content_type:
    - code: Syntax and execution validation
    - theory: Structure and grounding validation
    - slides/quiz: Structure and AI evaluation
    """
    service = get_validation_service()

    try:
        run_ai = request.validation_level == ValidationLevel.full

        if request.content_type.value == "code":
            # Extract code blocks if content is markdown
            code_blocks = service.extract_code_blocks(request.content, request.language or "python")
            code = code_blocks[0] if code_blocks else request.content

            result = await service.validate_code(
                code=code,
                language=request.language or "python",
                run_ai_evaluation=run_ai,
                topic=request.topic
            )

        elif request.content_type.value == "theory":
            result = await service.validate_theory(
                content=request.content,
                topic=request.topic,
                run_ai_evaluation=run_ai
            )

        else:
            # Generic validation for slides/quiz
            structure = service.validate_structure(request.content)

            ai_result = None
            if run_ai:
                ai_result = await service.ai_evaluate_content(
                    request.content,
                    request.content_type.value,
                    request.topic
                )

            overall_score = None
            if ai_result and ai_result.get("scores"):
                overall_score = ai_result["scores"]["overall"]

            result = {
                "success": True,
                "content_type": request.content_type.value,
                "is_valid": True,
                "overall_score": overall_score,
                "issues": structure["issues"],
                "ai_evaluation": ai_result,
                "summary": f"{structure['section_count']} sections. AI score: {overall_score}/5" if overall_score else f"{structure['section_count']} sections"
            }

        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation error: {str(e)}"
        )


@router.post("/quick-check", response_model=dict)
async def quick_syntax_check(
    code: str,
    language: str = "python"
):
    """
    Quick syntax check without authentication.

    Only performs basic syntax validation, no execution or AI evaluation.
    Useful for real-time feedback in the UI.
    """
    service = get_validation_service()

    try:
        if language == "python":
            result = service.validate_python_syntax(code)
        elif language in ["javascript", "typescript"]:
            result = service.validate_javascript_syntax(code)
        else:
            result = {
                "is_valid": True,
                "language": language,
                "issues": [{"severity": "info", "message": f"No syntax checker for {language}", "line": None, "suggestion": None}],
                "error_message": None
            }

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        return {
            "success": False,
            "data": {
                "is_valid": False,
                "language": language,
                "issues": [{"severity": "error", "message": str(e), "line": None, "suggestion": None}],
                "error_message": str(e)
            }
        }


@router.get("/supported-checks", response_model=dict)
async def get_supported_checks():
    """Get information about supported validation checks"""
    return {
        "success": True,
        "data": {
            "code_validation": {
                "full_support": ["python"],
                "syntax_only": ["javascript", "typescript"],
                "checks": ["syntax", "security", "execution", "ai_evaluation"]
            },
            "theory_validation": {
                "checks": ["structure", "grounding", "ai_evaluation"]
            },
            "validation_levels": [
                {"value": "syntax_only", "description": "Only check syntax (fastest)"},
                {"value": "with_execution", "description": "Syntax + run code (Python only)"},
                {"value": "full", "description": "All checks including AI evaluation"}
            ],
            "ai_evaluation_criteria": [
                {"name": "accuracy", "description": "Factual correctness (1-5)"},
                {"name": "relevance", "description": "Addresses the topic (1-5)"},
                {"name": "coherence", "description": "Well-organized (1-5)"},
                {"name": "completeness", "description": "Covers key concepts (1-5)"}
            ]
        }
    }
