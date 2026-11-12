"""
Study Assistant agent (LangGraph).

A multi-step agent that decides which tools to call, runs them, inspects the
results, and either calls more tools or writes a final grounded answer.

    reason  ->  (tool calls?)  ->  act  ->  reason  ->  ...  ->  synthesize

`reason` is the decision node: it asks the model what to do next given the
question and everything gathered so far. `act` executes the requested tools in
parallel. The loop continues until the model stops asking for tools or the
step budget is spent, at which point `synthesize` writes the answer from
whatever evidence exists.

Design choices worth noting:
  - Tool calls are parsed from a JSON response rather than provider-native
    tool-calling, so the same graph runs on OpenRouter or Anthropic without
    branching on provider.
  - Every step is recorded in `trace`, which is what makes the run debuggable
    and is the observability the agentic JDs ask for.
  - A hard `max_steps` bound guarantees termination even if the model loops.
"""

import json
import time
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agent.tools import TOOL_SCHEMAS, dispatch
from app.services import llm_client

MAX_STEPS = 4  # tool rounds before synthesis is forced


class AgentState(TypedDict, total=False):
    """State threaded through every node."""

    question: str
    category: Optional[str]

    # Accumulated tool results, oldest first.
    evidence: List[Dict[str, Any]]

    # Tool calls the reason node just requested.
    pending_calls: List[Dict[str, Any]]

    step: int
    trace: List[Dict[str, Any]]

    answer: str
    sources: List[Dict[str, Any]]
    error: Optional[str]


REASON_SYSTEM = """You are a study assistant for a university course. You plan \
which tools to use to answer a student's question.

You have these tools:
{tools}

Respond with ONLY a JSON object, no prose and no markdown fence:

{{"reasoning": "<one sentence on what you need and why>",
  "tool_calls": [{{"name": "<tool>", "arguments": {{...}}}}]}}

Rules:
- Course materials are authoritative. Search them before anything else.
- Request several tools at once when they are independent - they run in parallel.
- Return an empty tool_calls list when you have enough evidence to answer.
- Never repeat a call you have already made with the same arguments."""


SYNTHESIZE_SYSTEM = """You are a study assistant for a university course.

Write a clear, accurate answer using the evidence provided. Rules:
- Ground every claim in the evidence. Do not invent facts.
- If the evidence does not answer the question, say so plainly rather than \
guessing.
- Prefer course materials over Wikipedia when they conflict, and say which \
you used.
- Use markdown. Be direct and skip preamble."""


def _tool_descriptions() -> str:
    return "\n".join(
        f"- {t['name']}: {t['description']}" for t in TOOL_SCHEMAS
    )


def _parse_plan(raw: str) -> Dict[str, Any]:
    """
    Pull the plan JSON out of a model response.

    Models wrap JSON in prose or code fences often enough that a bare
    json.loads is unreliable, so fall back to the outermost braces. An
    unparseable plan is treated as "no tools" rather than an error - the agent
    then synthesizes from whatever it already has.
    """
    text = (raw or "").strip()

    if "```" in text:
        parts = text.split("```")
        for part in parts:
            candidate = part.strip()
            if candidate.startswith("json"):
                candidate = candidate[4:].strip()
            if candidate.startswith("{"):
                text = candidate
                break

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    return {"reasoning": "unparseable plan", "tool_calls": []}


def _evidence_digest(evidence: List[Dict[str, Any]]) -> str:
    if not evidence:
        return "(nothing gathered yet)"
    return "\n\n".join(
        f"[{item['tool']}] {json.dumps(item['result'], ensure_ascii=False)[:1200]}"
        for item in evidence
    )


# --- Nodes -------------------------------------------------------------------


async def reason_node(state: AgentState) -> Dict[str, Any]:
    """Decide what to do next: more tools, or enough to answer."""
    step = state.get("step", 0)
    trace = list(state.get("trace", []))

    prompt = (
        f"Student question: {state['question']}\n\n"
        f"Evidence gathered so far:\n{_evidence_digest(state.get('evidence', []))}\n\n"
        f"Tool round {step + 1} of {MAX_STEPS}. What next?"
    )

    started = time.monotonic()
    try:
        response = await llm_client.call_llm(
            system_prompt=REASON_SYSTEM.format(tools=_tool_descriptions()),
            user_prompt=prompt,
            max_tokens=800,
            temperature=0.2,  # planning wants consistency, not variety
            title="Study Assistant - reason",
        )
    except Exception as e:
        trace.append({"node": "reason", "step": step, "error": str(e)})
        return {"pending_calls": [], "trace": trace, "error": str(e)}

    plan = _parse_plan(response.get("content", ""))
    calls = plan.get("tool_calls") or []

    trace.append(
        {
            "node": "reason",
            "step": step,
            "reasoning": plan.get("reasoning", ""),
            "requested": [c.get("name") for c in calls],
            "ms": round((time.monotonic() - started) * 1000),
            "tokens": response.get("usage", {}).get("total_tokens"),
        }
    )

    return {"pending_calls": calls, "trace": trace, "step": step + 1}


async def act_node(state: AgentState) -> Dict[str, Any]:
    """Execute the requested tools concurrently."""
    import asyncio

    calls = state.get("pending_calls", [])
    evidence = list(state.get("evidence", []))
    trace = list(state.get("trace", []))

    started = time.monotonic()
    results = await asyncio.gather(
        *(dispatch(c.get("name", ""), c.get("arguments", {}) or {}) for c in calls),
        return_exceptions=True,
    )

    for call, result in zip(calls, results):
        if isinstance(result, Exception):
            result = {"ok": False, "error": str(result)}
        evidence.append(
            {
                "tool": call.get("name", "unknown"),
                "arguments": call.get("arguments", {}),
                "result": result,
            }
        )

    trace.append(
        {
            "node": "act",
            "step": state.get("step", 0),
            "ran": [c.get("name") for c in calls],
            "ok": [bool(e["result"].get("ok")) for e in evidence[-len(calls):]] if calls else [],
            "ms": round((time.monotonic() - started) * 1000),
        }
    )

    return {"evidence": evidence, "pending_calls": [], "trace": trace}


async def synthesize_node(state: AgentState) -> Dict[str, Any]:
    """Write the final answer from gathered evidence."""
    trace = list(state.get("trace", []))
    evidence = state.get("evidence", [])

    # Sources are pulled from tool output rather than from the model's prose,
    # so citations reflect what was actually retrieved.
    sources: List[Dict[str, Any]] = []
    for item in evidence:
        if item["tool"] == "search_materials" and item["result"].get("ok"):
            for r in item["result"].get("results", []):
                entry = {
                    "content_id": r.get("content_id"),
                    "title": r.get("title"),
                    "score": r.get("score"),
                }
                if entry not in sources:
                    sources.append(entry)

    prompt = (
        f"Student question: {state['question']}\n\n"
        f"Evidence:\n{_evidence_digest(evidence)}\n\n"
        "Write the answer."
    )

    started = time.monotonic()
    try:
        response = await llm_client.call_llm(
            system_prompt=SYNTHESIZE_SYSTEM,
            user_prompt=prompt,
            max_tokens=1500,
            temperature=0.3,
            title="Study Assistant - synthesize",
        )
        answer = response.get("content", "")
        tokens = response.get("usage", {}).get("total_tokens")
    except Exception as e:
        trace.append({"node": "synthesize", "error": str(e)})
        return {
            "answer": f"I could not generate an answer: {e}",
            "sources": sources,
            "trace": trace,
            "error": str(e),
        }

    trace.append(
        {
            "node": "synthesize",
            "ms": round((time.monotonic() - started) * 1000),
            "tokens": tokens,
            "sources": len(sources),
        }
    )

    return {"answer": answer, "sources": sources, "trace": trace}


# --- Routing -----------------------------------------------------------------


def should_continue(state: AgentState) -> str:
    """
    After reasoning: run tools, or stop and answer.

    Stops when the model asked for nothing, a call failed hard, or the step
    budget is exhausted - the last of which is what guarantees termination.
    """
    if state.get("error"):
        return "synthesize"
    if not state.get("pending_calls"):
        return "synthesize"
    if state.get("step", 0) >= MAX_STEPS:
        return "synthesize"
    return "act"


def build_graph():
    """Compile the agent graph."""
    graph = StateGraph(AgentState)

    graph.add_node("reason", reason_node)
    graph.add_node("act", act_node)
    graph.add_node("synthesize", synthesize_node)

    graph.add_edge(START, "reason")
    graph.add_conditional_edges(
        "reason",
        should_continue,
        {"act": "act", "synthesize": "synthesize"},
    )
    graph.add_edge("act", "reason")  # loop back to re-plan with new evidence
    graph.add_edge("synthesize", END)

    return graph.compile()


_compiled = None


def get_agent():
    """Compiled graph, built once and reused."""
    global _compiled
    if _compiled is None:
        _compiled = build_graph()
    return _compiled


async def run(question: str, category: Optional[str] = None) -> Dict[str, Any]:
    """
    Answer a question with the agent.

    Returns the answer plus the full trace, so callers can show or log exactly
    which tools ran and why.
    """
    started = time.monotonic()

    final_state = await get_agent().ainvoke(
        {
            "question": question,
            "category": category,
            "evidence": [],
            "pending_calls": [],
            "step": 0,
            "trace": [],
        }
    )

    return {
        "success": not final_state.get("error"),
        "question": question,
        "answer": final_state.get("answer", ""),
        "sources": final_state.get("sources", []),
        "trace": final_state.get("trace", []),
        "steps": final_state.get("step", 0),
        "tools_used": [e["tool"] for e in final_state.get("evidence", [])],
        "elapsed_ms": round((time.monotonic() - started) * 1000),
        "error": final_state.get("error"),
    }
