#!/usr/bin/env python
"""
Check which parts of the platform are actually working.

    cd backend-fastapi && venv/Scripts/python ../scripts/healthcheck.py

Probes each subsystem independently and reports PASS / FAIL / SKIP with the
reason, so a failure points at the specific thing to fix rather than at "the
app is broken". Exits non-zero if anything required is broken.
"""

import asyncio
import sys
from pathlib import Path

# Run from anywhere - the backend package is the import root.
BACKEND = Path(__file__).resolve().parent.parent / "backend-fastapi"
sys.path.insert(0, str(BACKEND))

try:
    from dotenv import load_dotenv

    load_dotenv(BACKEND / ".env")
except ImportError:
    pass

GREEN, RED, YELLOW, DIM, RESET = "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[0m"

results = []


def record(name: str, status: str, detail: str = ""):
    results.append((name, status, detail))
    colour = {"PASS": GREEN, "FAIL": RED, "SKIP": YELLOW}[status]
    print(f"  {colour}{status:<5}{RESET} {name}" + (f"  {DIM}{detail}{RESET}" if detail else ""))


async def check_config():
    print("\nConfiguration")
    from app.core.config import settings

    if settings.supabase_url and settings.supabase_service_key:
        record("Supabase credentials", "PASS", settings.supabase_url)
    else:
        record("Supabase credentials", "FAIL", "SUPABASE_URL / SUPABASE_SERVICE_KEY unset")

    from app.services import llm_client

    provider = llm_client.get_provider()
    if provider:
        record("LLM provider", "PASS", f"{provider} / {llm_client.active_model()}")
    else:
        record("LLM provider", "FAIL", "set OPENROUTER_API_KEY or ANTHROPIC_API_KEY")

    if settings.huggingface_token:
        record("HuggingFace token", "PASS", "real embeddings available")
    else:
        record(
            "HuggingFace token",
            "SKIP",
            "unset - embeddings may fall back to hashes (search unreliable)",
        )


async def check_database():
    print("\nDatabase")
    from app.core.supabase import get_supabase_admin

    tables = [
        "users", "content", "content_chunks",
        "conversations", "messages",
        "forum_posts", "forum_comments", "forum_votes",
    ]
    try:
        sb = get_supabase_admin()
    except Exception as e:
        record("Connection", "FAIL", str(e)[:70])
        return

    missing = []
    for table in tables:
        try:
            sb.table(table).select("*", count="exact").limit(1).execute()
        except Exception:
            missing.append(table)

    if missing:
        record("Schema", "FAIL", f"missing tables: {', '.join(missing)}")
    else:
        record("Schema", "PASS", f"all {len(tables)} tables present")

    try:
        users = sb.table("users").select("email").execute().data
        record("Demo accounts", "PASS" if users else "FAIL", f"{len(users)} user(s)")
    except Exception as e:
        record("Demo accounts", "FAIL", str(e)[:70])

    try:
        buckets = [b.name for b in sb.storage.list_buckets()]
        if "materials" in buckets:
            record("Storage bucket", "PASS", "materials")
        else:
            record("Storage bucket", "FAIL", f"'materials' missing (found: {buckets})")
    except Exception as e:
        record("Storage bucket", "FAIL", str(e)[:70])


async def check_embeddings():
    print("\nEmbeddings")
    from app.services.embedding_service import get_embedding_service

    svc = get_embedding_service()
    svc.used_fallback_embedding = False
    try:
        vector = await svc.embed_document("binary search on a sorted array")
    except Exception as e:
        record("Embedding call", "FAIL", str(e)[:70])
        return

    if not vector:
        record("Embedding call", "FAIL", "returned no vector")
    elif svc.used_fallback_embedding:
        record(
            "Embedding call",
            "FAIL",
            "HASH FALLBACK - vectors carry no meaning, semantic search is unreliable",
        )
    else:
        record("Embedding call", "PASS", f"{len(vector)} dims, semantic")


async def check_llm():
    print("\nLLM")
    from app.services import llm_client

    if not llm_client.is_configured():
        record("Completion", "SKIP", "no provider configured")
        return

    try:
        response = await llm_client.call_llm(
            "Answer with one word.", "Say OK", max_tokens=20
        )
        record("Completion", "PASS", repr(response["content"][:40]))
    except Exception as e:
        record("Completion", "FAIL", str(e)[:90])


async def check_agent():
    print("\nAgent")
    try:
        from app.agent.study_agent import MAX_STEPS, build_graph
        from app.agent.tools import TOOL_REGISTRY

        graph = build_graph()
        nodes = [n for n in graph.get_graph().nodes if not n.startswith("__")]
        record("Graph", "PASS", f"nodes={sorted(nodes)}, max_steps={MAX_STEPS}")
        record("Tools", "PASS", ", ".join(sorted(TOOL_REGISTRY)))
    except Exception as e:
        record("Graph", "FAIL", str(e)[:70])
        return

    from app.services import llm_client

    if not llm_client.is_configured():
        record("End-to-end run", "SKIP", "needs a working LLM provider")
        return

    try:
        from app.agent.study_agent import run

        result = await run("What is binary search?")
        if result["success"]:
            record(
                "End-to-end run",
                "PASS",
                f"{result['steps']} steps, tools={result['tools_used']}, {result['elapsed_ms']}ms",
            )
        else:
            record("End-to-end run", "FAIL", str(result.get("error"))[:90])
    except Exception as e:
        record("End-to-end run", "FAIL", str(e)[:90])


async def main():
    print("=" * 72)
    print("AI-Powered 360 Learning - health check")
    print("=" * 72)

    for check in (check_config, check_database, check_embeddings, check_llm, check_agent):
        try:
            await check()
        except Exception as e:  # a broken check must not hide the others
            record(check.__name__, "FAIL", f"check itself errored: {e}")

    passed = sum(1 for _, s, _ in results if s == "PASS")
    failed = sum(1 for _, s, _ in results if s == "FAIL")
    skipped = sum(1 for _, s, _ in results if s == "SKIP")

    print("\n" + "=" * 72)
    print(f"{GREEN}{passed} passed{RESET}  {RED}{failed} failed{RESET}  {YELLOW}{skipped} skipped{RESET}")

    if failed:
        print("\nFailing checks:")
        for name, status, detail in results:
            if status == "FAIL":
                print(f"  - {name}: {detail}")

    print("=" * 72)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
