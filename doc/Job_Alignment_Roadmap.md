# Job Alignment Roadmap

Mapping this project against 22 AI Engineer job descriptions collected Apr–Jul 2026
(`F:\Resume_Templates\_Job-Criteria\AI_Engineer`). The goal is to identify what to build
next so the project functions as portfolio evidence for the roles realistically in reach.

Two of those postings — Flyte Solutions and ayanadevstudio — list a portfolio or GitHub
repo as a **mandatory** application material. This project is that artifact.

---

## 1. Where the project stands today

### Already implemented (real, verifiable evidence)

| Capability | Where | Appears in JDs as |
|---|---|---|
| FastAPI REST API | `app/routes/` | Near-universal requirement |
| RAG pipeline | `app/services/rag_service.py` | Named in ~18 of 22 postings |
| Embeddings (BGE, 768-dim) | `app/services/embedding_service.py` | Near-universal |
| Vector DB (pgvector) | `content_chunks` table | PRIME_Now names pgvector explicitly |
| **Hybrid search** (semantic + keyword) | `retrieval_service.py:177` | PRIME_Now: "hybrid retrieval" |
| Chunking strategy | `chunking_service.py` | Implied by all RAG roles |
| OCR / document intelligence | `ocr_service.py` | Flyte (preferred), Innospace (bonus) |
| Prompt engineering | `validation_service.py`, `generation_service.py` | Near-universal |
| React frontend | `frontend/src/` | ayanadevstudio, TygrLabs, airtable |
| Auth + RBAC | `app/core/security.py` | PRIME_Now: "access control" |
| Postgres data modelling | `supabase_setup.sql` | PRIME_Now: "strong PostgreSQL" |

This is already a strong base. Hybrid retrieval in particular is a differentiator — most
junior portfolios stop at naive cosine similarity.

### Blocking issues — fix before any demo

These make the project fail a live demo today. They outrank every new feature below.

1. **All AI features are non-functional.** Every service reads `settings.openrouter_api_key`
   (`rag_service.py:23`, `chat_service.py:32`, `generation_service.py:21`,
   `validation_service.py:30`, `ocr_service.py:25`), but only `ANTHROPIC_API_KEY` is set
   in `.env`. Either set `OPENROUTER_API_KEY`, or add an Anthropic fallback path in the
   services. **Nothing else on this list matters until this works.**
2. **Embeddings silently fail.** `HUGGINGFACE_TOKEN` is blank, so `embed_document()`
   returns nothing and indexing degrades to keyword-only. Semantic search is effectively
   off. Note the failure is swallowed — see item 3.
3. **Silent failure handling.** `content_processing_service.py:387` sets `embedding = None`
   on exception and continues. Content appears indexed but is not semantically searchable.
   Prefer failing loudly, or persist a per-chunk indexing status.
4. **Root `npm run dev` is broken.** `package.json` points at a non-existent `backend/`
   directory. First impression for anyone cloning the repo.
5. **README is UTF-16.** Renders as spaced-out garbage on GitHub — the first thing a
   reviewer sees. Re-save as UTF-8.

---

## 2. Gap analysis against target roles

Ordered by how often the requirement appears across the 22 postings.

| Gap | Frequency | Effort | Named by |
|---|---|---|---|
| **Docker** | ~20/22 | Low | Flyte, PRIME_Now, CodeTact, Brain Station, ayanadevstudio, TDI, NEXT, Trovex |
| **Agentic / multi-agent systems** | ~16/22 | Medium-High | Brain Station, Empowrd, ayanadevstudio, PRIME_Now, Dataiku, Wilmac, TDI, Trovex |
| **LangChain / LangGraph** | ~16/22 | Medium | Flyte, PRIME_Now, CodeTact, Brain Station, Empowrd, NEXT, Trovex, Dataiku |
| **Evaluation & observability** | ~12/22 | Medium | PRIME_Now, Kow, ayanadevstudio, Brain Station, Dataiku, Wilmac, TDI, Trovex |
| **Structured outputs + tool calling** | ~10/22 | Low | Brain Station (Pydantic explicit), Dataiku, Wilmac, Trovex |
| **CI/CD** | ~9/22 | Low | PRIME_Now, CodeTact, ayanadevstudio, Empowrd |
| **Cloud (AWS/GCP/Azure)** | ~10/22 | High | Brain Station (AWS), Kow (GCP/Vertex), WorkToUSA (GCP) |
| **MCP (Model Context Protocol)** | **5/22** | Low-Medium | Trovex (required), Dataiku, ayanadevstudio, NEXT, Wilmac |
| **Tests** | ~5/22 | Low | Implied broadly; ReliSource is testing-focused |
| **Bangla NLP** | 3/22 | Medium | Flyte (preferred), Innospace (bonus) |
| **Knowledge graphs** | 3/22 | High | PRIME_Now, Flyte |
| **Workflow automation (n8n/Zapier)** | 4/22 | Low | Empowrd, PRIME_Now, Wilmac, ReliSource |
| **AI-assisted dev tooling (Claude Code/Cursor)** | 4/22 | None | Trovex, NEXT, Dataiku, ayanadevstudio |

### Findings from the full 22-posting read

Reading every posting (not just the index summary) surfaced four things that change priorities:

**1. MCP appears in 5 postings — and is a hard requirement in one.**
Trovex lists "Implement and manage Model Context Protocol (MCP) integrations" as a
responsibility *and* requirement. Dataiku wants "build, publish, and consume MCP servers."
ayanadevstudio, NEXT Ventures, and Wilmac list it too. MCP is new enough that almost no
junior applicant has it, and an MCP server exposing course materials as tools is roughly
a day of work. **This is the single highest signal-to-effort item in the entire analysis.**

**2. Trovex is a strong target that the index undersold.**
It is an *internship* (no experience bar), explicitly wants RAG + LangGraph + MCP + prompt
engineering + HuggingFace + React, and has a PPO path. It also names Claude Code and
Cursor as tools they want familiarity with — which you are already using. The only
mismatch is Django instead of FastAPI, which is a days-long adjustment, not a blocker.

**3. "Agentic" outranks "LangChain" in frequency.**
More postings want demonstrated agent-building than any specific framework. Dataiku states
it directly: "familiarity with LangChain is still relevant but not sufficient on its own."
Build the agent; treat the framework as an implementation detail.

**4. Evaluation is far more common than the first pass suggested (~12/22).**
Wilmac names LangSmith/Braintrust; Dataiku wants "evaluation frameworks (evals) measuring
accuracy, latency, cost"; TDI wants "model evaluation methodologies"; Kow wants eval
ownership. This reinforces Phase 2 as a top-three priority.

**Also worth noting:** four postings name Claude Code / Cursor / AI-assisted development as
a desired skill. You are already using these tools daily to build this project — that is a
legitimate, currently-rare resume line requiring zero additional work.

### Roles reclassified after full read

| Role | Index said | Actual assessment |
|---|---|---|
| **Trovex.ai** | "SDE Intern, NLP + Django" | **Upgraded — top-3 target.** No experience bar, PPO path, matches RAG/agent/MCP roadmap almost exactly |
| **Wilmac** | "Compliance/SaaS domain" | Upgraded slightly — explicitly stack-agnostic ("we don't require a specific tech stack"), 4–7y but "open to strong candidates at both ends" |
| **The Data Island** | "Junior tier open" | Confirmed — but it is a *pure CV role* (PyTorch, OpenCV, ONNX, TensorRT). This project is weak evidence; needs separate CV work |
| **The Kow Company** | "Image-editing fine-tuning" | Downgraded — LoRA/diffusion/Vertex AI. Almost no overlap with this project |
| **Foodi Express** | "Lead-level" | Confirmed out of range — 6–10+ years |
| **NEXT Ventures** | "Forward-deployed" | Out of range on paper (5+ yrs) but names Claude API, Claude Code, and MCP — worth watching |

---

## 3. Recommended implementation plan

Sequenced by (impact × reach) ÷ effort. Phases 0–3 are the high-value core.

### Phase 0 — Make it actually work `~1 day`

Fix the five blocking issues above. Non-negotiable: a portfolio project that fails on
launch is worse than no portfolio project, because it gets checked.

**Deliverable:** clone → configure → `docker compose up` → working demo.

---

### Phase 1 — Docker + CI `~1–2 days` · highest reach

Appears in nearly every posting and solves your own setup friction.

- `Dockerfile` for backend (multi-stage, non-root user)
- `Dockerfile` for frontend
- `docker-compose.yml` wiring both + env config
- `.dockerignore`, documented `.env.example`
- GitHub Actions: lint + tests on push

**Signals:** Docker, CI/CD, MLOps basics, deployment awareness.
**Resume line:** "Containerized a multi-service AI application with CI pipeline."

---

### Phase 2 — RAG evaluation harness `~2–3 days` · strongest differentiator

Rare in junior portfolios and explicitly demanded: PRIME_Now wants "measure retrieval
accuracy, response relevance, latency"; Kow Company wants eval ownership; ayanadevstudio
lists "agent evaluation, monitoring, or observability" under Nice to Have.

- Golden dataset: 30–50 Q&A pairs from real course material
- Retrieval metrics: precision@k, recall@k, MRR
- Answer metrics: faithfulness / groundedness (LLM-as-judge), citation accuracy
- Latency + token-cost tracking per query
- Compare configs: semantic vs. hybrid vs. different chunk sizes — **record the numbers**
- Optional: RAGAs library, or hand-rolled (hand-rolled demonstrates more understanding)

**Signals:** evaluation, measurement, scientific rigor, cost/latency awareness.
**Resume line:** "Built a RAG eval harness; hybrid retrieval improved precision@5 from
X to Y over pure semantic search." — a concrete number beats any adjective.

This phase also directly leverages your research background, which most junior applicants lack.

---

### Phase 3 — Agentic layer with LangGraph `~3–4 days` · unlocks the largest role cluster

The `01_LLM-Agents-RAG` folder is 8 of 22 postings, and agentic experience is the
recurring hard requirement. Your current RAG is a single-shot retrieve-then-generate.

Build **one** genuinely useful agent — a "Study Assistant" that plans multi-step work:

- **Orchestration:** LangGraph state machine (plan → retrieve → reason → tool → synthesize)
- **Tools:** vector search, Wikipedia (`wikipedia_service.py` already exists), quiz
  generator, content validator
- **Memory:** conversation state across turns (`conversations` table already exists)
- **Structured output:** Pydantic models for tool args and final answers — Brain Station
  names Pydantic explicitly
- **Tracing:** log every LLM call — Brain Station: "debugging traces of LLM calls to
  identify errors/optimizations"
- **Fallback:** graceful degradation when a tool fails

Keep the hand-rolled RAG alongside it. "Built from scratch, then added LangGraph for
orchestration" is a stronger story than "used the framework" — it proves you understand
the layer underneath.

**Signals:** agentic AI, LangGraph, tool use, orchestration, memory, structured output, tracing.

---

### Phase 3.5 — MCP server `~1 day` · best signal-to-effort ratio in this document

Appears in 5 postings and is a stated requirement at Trovex. Because MCP is recent, very
few applicants at any level have shipped one — this is disproportionate signal for the effort.

Expose the course-material layer as MCP tools so any MCP client (Claude Desktop, Claude
Code, Cursor) can query the platform:

- `search_materials(query, category)` → hybrid retrieval results
- `get_material(id)` → full content + metadata
- `generate_quiz(topic, difficulty)` → structured quiz output
- `validate_answer(question, answer)` → validation service passthrough

Use the official Python MCP SDK. Ship a short demo video or GIF of Claude Desktop querying
your platform — that artifact is more persuasive in an application than any bullet point.

**Signals:** MCP, tool design, interoperability, current with the ecosystem.
**Targets:** Trovex (requirement), Dataiku, ayanadevstudio, NEXT Ventures, Wilmac.

---

### Phase 4 — Bangla NLP + document intelligence `~2–3 days` · your moat

Only 3 of 22 postings name Bangla NLP — but they are the ones where you are
*differentiated* rather than competing on years of experience, which is where the 0–2y
bracket normally loses.

Innospace is a near-exact description of this project's problem domain:
> "handle messy real-world inputs: photos of textbooks, mixed Bangla-English text, bad OCR"

Plus EdTech, which is literally what this platform is.

- Tesseract `ben` traineddata for Bangla OCR (`ocr_service.py`)
- Mixed Bangla-English script detection and routing
- Multilingual embeddings (e.g. `BAAI/bge-m3`) so Bangla content is semantically searchable
- OCR confidence scoring + a correction path for low-confidence output
- Evaluate BanglaBERT for classification — named directly in the Flyte JD

**Signals:** Bangla NLP, OCR, document intelligence, multilingual RAG, messy-input handling.
**Targets:** Flyte Solutions, Innospace Infotech.

---

### Phase 5 — Production hardening `~2–3 days`

- `pytest` suite: RAG pipeline, auth, retrieval scoring
- Structured logging (JSON), request tracing
- Rate limiting, retry with backoff on LLM calls
- Response caching for repeated queries (cost reduction — an explicit Flyte responsibility)
- Health/readiness probes, basic metrics endpoint
- **Fix the RLS architecture properly:** service-role currently bypasses RLS for all
  writes. Real per-user storage policies would be the correct design, and demonstrates
  security awareness — PRIME_Now names "access control" and "AI governance."

---

### Phase 6 — Optional, role-specific

Pursue only if targeting a specific employer:

- **Knowledge graph** (PRIME_Now, Flyte) — entity/relation extraction from course
  material, graph-augmented retrieval. High effort, high signal.
- **AWS deployment** (Brain Station 23) — Lambda/Bedrock. Note: 5y minimum, likely out
  of range for now.
- **MCP server** (ayanadevstudio Nice to Have) — expose course materials as MCP tools.
  Low effort, currently rare, notably modern.
- **n8n workflow** (Empowrd, PRIME_Now) — automate an ingestion pipeline.
- **Model routing** (ayanadevstudio) — you already use OpenRouter; add explicit
  cost/latency-based routing and document the tradeoffs.

---

## 4. Suggested order

```
Phase 0    Fix blockers          1 day     ← do this first, always
Phase 1    Docker + CI           1–2 days  ← widest reach (20/22 postings)
Phase 2    RAG evaluation        2–3 days  ← strongest differentiator (12/22)
Phase 3    LangGraph agent       3–4 days  ← biggest role cluster (16/22)
Phase 3.5  MCP server            1 day     ← best signal-to-effort (5/22, rare)
Phase 4    Bangla NLP            2–3 days  ← your unique moat (3/22, defensible)
Phase 5    Production hardening  2–3 days
```

Roughly two focused weeks to move from "student project" to "portfolio piece that
survives technical scrutiny."

If time is short, **Phases 0–2 plus 3.5** deliver most of the credibility gain: a project
that runs cleanly, containerized, with measured results, plus one genuinely rare skill.
Phase 3.5 can be done immediately after Phase 1 if you want the MCP line on your CV sooner
— it does not depend on the agent work.

---

## 5. Role fit after completing Phases 0–4

| Role | Exp. required | Fit after roadmap |
|---|---|---|
| **Trovex.ai (SDE Intern)** | Intern / final year | **Strongest** — no experience bar, PPO path; RAG + LangGraph + MCP + prompt engineering all map directly. Only gap is Django vs FastAPI |
| Empowrd.AI (Junior AI Eng) | 1–2y / portfolio | **Strong** — explicitly accepts portfolio over experience |
| Innospace (AI Eng, EdTech) | — | **Strong** — Bangla + OCR + EdTech is an exact domain match |
| ReliSource (Jr Automation) | 0–2y | **Strong** — already in range; Docker + tests seal it |
| Flyte Solutions | 3–4y | Moderate — below the experience bar, but Bangla NLP + RAG + OCR is unusually aligned; portfolio is mandatory and yours would be strong |
| PRIME_Now | 2+y | Moderate — Phases 2, 3, 5 map almost item-for-item to the JD |
| ayanadevstudio | — | Moderate — Phase 3 + MCP are the deciding factors |
| Wilmac | 4–7y | Moderate — stack-agnostic and "open to both ends" of the range |
| The Data Island (CV) | 0–2y | Weak *for this project* — pure CV role (OpenCV/ONNX/TensorRT); needs separate CV portfolio work |
| The Kow Company | 2+y | Weak — LoRA/diffusion/Vertex AI; little overlap |
| Brain Station 23 / Foodi / NEXT | 5–10y | Out of range for now |

---

## 6. Framing notes for applications

- **Lead with measured results, not feature lists.** "Improved retrieval precision@5 by
  34% via hybrid search" outperforms "built a RAG system" — most applicants can only say
  the latter.
- **The from-scratch angle is an asset.** You built RAG without LangChain. That's more
  impressive than framework usage, provided you can articulate *why* each piece exists.
- **Know your own failure modes.** Interviewers probe for depth. The silent-embedding-
  failure bug (item 3) is a genuinely good story about observability — being able to say
  "here's what broke, here's how I caught it, here's what I changed" reads as engineering
  maturity.
- **Bangla NLP + EdTech + OCR is a narrow, defensible niche.** Rather than competing as
  a generic junior AI engineer, target Innospace and Flyte where that combination is
  scarce and explicitly requested.
- **Several deadlines listed in INDEX.md have likely passed** (ReliSource 31 May, Brain
  Station 15 Jun, Kow 24 Jul 2026). Re-verify before investing effort in any single
  application.
