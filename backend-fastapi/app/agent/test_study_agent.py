"""
Study Assistant agent tests.

The LLM and the tools are both stubbed, so these exercise the parts the agent
actually owns - plan parsing, routing, parallel dispatch, evidence
accumulation, termination, and error handling - without network access or
API credits.

Run:  pytest app/agent/test_study_agent.py -q
"""

import json

import pytest

from app.agent import study_agent
from app.agent.study_agent import MAX_STEPS, _parse_plan, should_continue


# --- Plan parsing ------------------------------------------------------------


class TestParsePlan:
    def test_plain_json(self):
        plan = _parse_plan('{"reasoning": "r", "tool_calls": []}')
        assert plan["reasoning"] == "r"
        assert plan["tool_calls"] == []

    def test_fenced_json(self):
        raw = '```json\n{"reasoning": "r", "tool_calls": []}\n```'
        assert _parse_plan(raw)["reasoning"] == "r"

    def test_json_with_surrounding_prose(self):
        raw = 'Here is my plan:\n{"reasoning": "r", "tool_calls": []}\nHope that helps.'
        assert _parse_plan(raw)["reasoning"] == "r"

    def test_unparseable_degrades_to_no_tools(self):
        # Must not raise - an unparseable plan means "answer with what we have".
        plan = _parse_plan("I cannot help with that.")
        assert plan["tool_calls"] == []

    def test_empty_input(self):
        assert _parse_plan("")["tool_calls"] == []

    def test_preserves_tool_arguments(self):
        raw = '{"reasoning":"r","tool_calls":[{"name":"search_materials","arguments":{"query":"trees"}}]}'
        calls = _parse_plan(raw)["tool_calls"]
        assert calls[0]["arguments"]["query"] == "trees"


# --- Routing -----------------------------------------------------------------


class TestShouldContinue:
    def test_acts_when_tools_requested(self):
        state = {"pending_calls": [{"name": "search_materials"}], "step": 1}
        assert should_continue(state) == "act"

    def test_synthesizes_when_no_tools_requested(self):
        assert should_continue({"pending_calls": [], "step": 1}) == "synthesize"

    def test_synthesizes_at_step_budget(self):
        # Budget exhausted, so stop even though tools were requested. This is
        # the guard that guarantees termination.
        state = {"pending_calls": [{"name": "search_materials"}], "step": MAX_STEPS}
        assert should_continue(state) == "synthesize"

    def test_synthesizes_on_error(self):
        state = {"pending_calls": [{"name": "x"}], "step": 1, "error": "boom"}
        assert should_continue(state) == "synthesize"


# --- Full graph runs ---------------------------------------------------------


def _stub_llm(monkeypatch, plan_responses, answer="Final answer."):
    """
    Replace the LLM with scripted responses.

    plan_responses is consumed one per reason-node call; once exhausted the
    stub returns an empty plan, and the synthesize call returns `answer`.
    """
    calls = {"reason": 0, "synthesize": 0}
    queue = list(plan_responses)

    async def fake_call_llm(system_prompt, user_prompt, **kwargs):
        if "plan which tools" in system_prompt.lower() or "tool_calls" in system_prompt:
            calls["reason"] += 1
            payload = queue.pop(0) if queue else {"reasoning": "done", "tool_calls": []}
            return {"content": json.dumps(payload), "usage": {"total_tokens": 10}}
        calls["synthesize"] += 1
        return {"content": answer, "usage": {"total_tokens": 20}}

    monkeypatch.setattr(study_agent.llm_client, "call_llm", fake_call_llm)
    return calls


def _stub_tools(monkeypatch, result=None):
    ran = []

    async def fake_dispatch(name, arguments):
        ran.append((name, arguments))
        return result if result is not None else {"ok": True, "results": []}

    monkeypatch.setattr(study_agent, "dispatch", fake_dispatch)
    return ran


@pytest.mark.asyncio
class TestAgentRun:
    async def test_answers_without_tools(self, monkeypatch):
        _stub_llm(monkeypatch, [{"reasoning": "no lookup needed", "tool_calls": []}])
        _stub_tools(monkeypatch)

        result = await study_agent.run("What is 2+2?")

        assert result["success"] is True
        assert result["answer"] == "Final answer."
        assert result["tools_used"] == []

    async def test_runs_requested_tool_then_answers(self, monkeypatch):
        _stub_llm(
            monkeypatch,
            [
                {
                    "reasoning": "search first",
                    "tool_calls": [
                        {"name": "search_materials", "arguments": {"query": "bst"}}
                    ],
                },
                {"reasoning": "enough", "tool_calls": []},
            ],
        )
        ran = _stub_tools(
            monkeypatch,
            {
                "ok": True,
                "results": [
                    {"content_id": "c1", "title": "Trees", "excerpt": "...", "score": 0.9}
                ],
            },
        )

        result = await study_agent.run("Explain binary search trees")

        assert result["success"] is True
        assert ran == [("search_materials", {"query": "bst"})]
        assert result["tools_used"] == ["search_materials"]
        # Sources come from tool output, not from model prose.
        assert result["sources"][0]["content_id"] == "c1"

    async def test_parallel_tool_calls_all_execute(self, monkeypatch):
        _stub_llm(
            monkeypatch,
            [
                {
                    "reasoning": "two independent lookups",
                    "tool_calls": [
                        {"name": "search_materials", "arguments": {"query": "a"}},
                        {"name": "lookup_wikipedia", "arguments": {"topic": "b"}},
                    ],
                },
                {"reasoning": "done", "tool_calls": []},
            ],
        )
        ran = _stub_tools(monkeypatch)

        result = await study_agent.run("Compare a and b")

        assert len(ran) == 2
        assert set(result["tools_used"]) == {"search_materials", "lookup_wikipedia"}

    async def test_terminates_at_step_budget(self, monkeypatch):
        # A model that always asks for more tools must still terminate.
        always_search = {
            "reasoning": "keep going",
            "tool_calls": [{"name": "search_materials", "arguments": {"query": "x"}}],
        }
        _stub_llm(monkeypatch, [always_search] * 20)
        _stub_tools(monkeypatch)

        result = await study_agent.run("Never satisfied")

        assert result["success"] is True
        assert result["steps"] <= MAX_STEPS

    async def test_tool_failure_does_not_abort_run(self, monkeypatch):
        _stub_llm(
            monkeypatch,
            [
                {
                    "reasoning": "try search",
                    "tool_calls": [
                        {"name": "search_materials", "arguments": {"query": "x"}}
                    ],
                },
                {"reasoning": "answer anyway", "tool_calls": []},
            ],
        )
        _stub_tools(monkeypatch, {"ok": False, "error": "database unreachable"})

        result = await study_agent.run("Something")

        # Degrades to an answer rather than raising.
        assert result["success"] is True
        assert result["answer"] == "Final answer."

    async def test_llm_failure_is_reported(self, monkeypatch):
        async def boom(system_prompt, user_prompt, **kwargs):
            raise RuntimeError("402 insufficient credits")

        monkeypatch.setattr(study_agent.llm_client, "call_llm", boom)

        result = await study_agent.run("Anything")

        assert result["success"] is False
        assert "credits" in (result["error"] or "")

    async def test_trace_records_every_node(self, monkeypatch):
        _stub_llm(
            monkeypatch,
            [
                {
                    "reasoning": "search",
                    "tool_calls": [
                        {"name": "search_materials", "arguments": {"query": "x"}}
                    ],
                },
                {"reasoning": "done", "tool_calls": []},
            ],
        )
        _stub_tools(monkeypatch)

        result = await study_agent.run("Question")

        nodes = [entry["node"] for entry in result["trace"]]
        assert "reason" in nodes
        assert "act" in nodes
        assert "synthesize" in nodes
        # Timings are what make the trace useful for debugging cost/latency.
        assert any("ms" in entry for entry in result["trace"])
