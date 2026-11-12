"""
Study Assistant agent endpoints.

Thin HTTP layer over app.agent.study_agent - orchestration lives in the graph,
not here.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.agent.study_agent import MAX_STEPS, run as run_agent
from app.agent.tools import TOOL_SCHEMAS
from app.core.security import get_current_user
from app.services import llm_client

router = APIRouter(prefix="/agent", tags=["Agent"])


class AgentAskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    category: Optional[str] = Field(
        None, description="Optional filter: 'theory' or 'lab'"
    )
    include_trace: bool = Field(
        True,
        description="Return the step-by-step execution trace alongside the answer.",
    )


@router.post("/ask", response_model=dict)
async def ask_agent(
    payload: AgentAskRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Answer a question using the multi-step Study Assistant agent.

    Unlike /chat (single-shot RAG) the agent plans, calls tools, inspects the
    results, and can loop before answering.
    """
    if not llm_client.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "No LLM provider configured. Set OPENROUTER_API_KEY or "
                "ANTHROPIC_API_KEY in the backend .env"
            ),
        )

    if payload.category and payload.category not in ("theory", "lab"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="category must be 'theory' or 'lab'",
        )

    result = await run_agent(payload.question, category=payload.category)

    if not payload.include_trace:
        result.pop("trace", None)

    return {"success": result["success"], "data": result}


@router.get("/tools", response_model=dict)
async def list_tools():
    """
    Describe the agent's tools and limits.

    Public so a UI can render the agent's capabilities before login.
    """
    return {
        "success": True,
        "data": {
            "tools": [
                {"name": t["name"], "description": t["description"]}
                for t in TOOL_SCHEMAS
            ],
            "max_steps": MAX_STEPS,
            "provider": llm_client.get_provider(),
            "model": llm_client.active_model(),
        },
    }
