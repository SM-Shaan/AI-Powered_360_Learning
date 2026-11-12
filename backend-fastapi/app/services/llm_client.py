"""
LLM Client - shared provider layer

Routes chat-completion calls to whichever LLM provider is configured:
OpenRouter (OpenAI-compatible) or Anthropic direct.

Services call `call_llm(...)` and get back the same dict shape regardless of
which provider actually served the request, so provider choice is a
configuration concern rather than a per-service one.
"""

import httpx
from typing import Dict, List, Optional
from app.core.config import settings

# OpenRouter model slugs are prefixed; the Anthropic API takes the bare model ID.
# Both are overridable from .env so you can trade cost against quality without
# touching code - see OPENROUTER_MODEL / ANTHROPIC_MODEL.
DEFAULT_OPENROUTER_MODEL = "anthropic/claude-sonnet-4"
DEFAULT_ANTHROPIC_MODEL = "claude-opus-5"

# ':free' OpenRouter models cost nothing and do not draw on a credit balance.
# Benchmarked against this project's own agent prompts (plan-JSON validity,
# prose cleanliness, latency over 3 runs):
#
#   model                                    plans   avg     notes
#   nvidia/nemotron-3-nano-30b-a3b:free      3/3     2.1s    default - 3.6x faster
#   dots-studio/dots-3-note-preview:free     2/3     4.3s    intermittent
#   google/gemma-4-26b-a4b-it:free           3/3     5.9s
#   cohere/north-mini-code:free              3/3     7.3s    most verbose
#   nvidia/nemotron-3-super-120b-a12b:free   3/3     7.6s    larger, no better here
#   nvidia/nemotron-3-ultra-550b-a55b:free   3/3     9.5s    slowest
#
# Latency matters more than raw capability here because the agent makes 2-8
# sequential calls per question, so per-call cost compounds. All of the above
# produced valid tool plans and clean prose; the nano model wins on speed
# without losing either.
#
# Free tiers are rate-limited and return 429 under load (z-ai/glm-5.2 and
# google/gemma-4-31b did during benchmarking), so treat these as a development
# convenience rather than a production path.
FREE_OPENROUTER_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free"

# Tried in order when the primary free model returns 429. Each free model has
# its own quota, so one being exhausted does not mean the rest are. Ordered by
# measured latency.
FREE_MODEL_FALLBACKS = [
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "cohere/north-mini-code:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
]

ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1"
ANTHROPIC_VERSION = "2023-06-01"

_PLACEHOLDERS = {
    "",
    "your-openrouter-api-key",
    "sk-or-v1-your-openrouter-key",
    "your-anthropic-api-key",
    "sk-ant-your-anthropic-key",
}


def _is_configured(key: Optional[str]) -> bool:
    return bool(key) and key.strip() not in _PLACEHOLDERS


def openrouter_model() -> str:
    """
    OpenRouter model slug.

    Resolution order: explicit OPENROUTER_MODEL, then the free model when
    USE_FREE_MODELS is on, then the paid default.
    """
    configured = (getattr(settings, "openrouter_model", "") or "").strip()
    if configured:
        return configured
    if getattr(settings, "use_free_models", False):
        return FREE_OPENROUTER_MODEL
    return DEFAULT_OPENROUTER_MODEL


def anthropic_model() -> str:
    """Anthropic model ID, overridable via ANTHROPIC_MODEL."""
    configured = (getattr(settings, "anthropic_model", "") or "").strip()
    return configured or DEFAULT_ANTHROPIC_MODEL


def _raise_for_status(response: httpx.Response, provider: str):
    """
    Raise with the provider's own error message rather than a bare status line.

    httpx's default only reports the status code, which hides actionable
    messages like expired keys or exhausted credit balances.
    """
    if response.is_success:
        return
    detail = response.text
    try:
        body = response.json()
        if isinstance(body, dict):
            err = body.get("error")
            if isinstance(err, dict) and err.get("message"):
                detail = err["message"]
            elif isinstance(err, str):
                detail = err
    except Exception:
        pass
    raise RuntimeError(f"{provider} API error ({response.status_code}): {detail}")


def get_provider() -> Optional[str]:
    """
    Return the active provider name, or None if no key is configured.

    Anthropic wins when both are set: it is the direct provider, so there is
    one less account and one less billing balance in the path. Force the other
    way with LLM_PROVIDER=openrouter.
    """
    preferred = (getattr(settings, "llm_provider", "") or "").strip().lower()

    if preferred == "openrouter" and _is_configured(settings.openrouter_api_key):
        return "openrouter"
    if preferred == "anthropic" and _is_configured(settings.anthropic_api_key):
        return "anthropic"

    if _is_configured(settings.anthropic_api_key):
        return "anthropic"
    if _is_configured(settings.openrouter_api_key):
        return "openrouter"
    return None


def is_configured() -> bool:
    """True when at least one LLM provider key is usable."""
    return get_provider() is not None


def active_model() -> Optional[str]:
    provider = get_provider()
    if provider == "openrouter":
        return openrouter_model()
    if provider == "anthropic":
        return anthropic_model()
    return None


def ensure_configured():
    """Raise if no provider is available, naming both ways to fix it."""
    if not is_configured():
        raise ValueError(
            "No LLM API key configured. Set OPENROUTER_API_KEY or "
            "ANTHROPIC_API_KEY in backend-fastapi/.env"
        )


async def call_llm(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 2000,
    temperature: float = 0.3,
    title: str = "AI Learning Platform",
) -> Dict:
    """
    Send a single-turn chat completion to the configured provider.

    Returns:
        {"content": str, "usage": dict, "model": str}
    """
    ensure_configured()
    provider = get_provider()

    if provider == "openrouter":
        return await _call_openrouter(
            system_prompt, user_prompt, max_tokens, temperature, title
        )
    return await _call_anthropic(system_prompt, user_prompt, max_tokens, temperature)


def _model_candidates() -> List[str]:
    """
    Models to try in order for one OpenRouter request.

    Free models each carry their own rate limit, so a 429 on one does not mean
    the others are exhausted. Trying alternates turns a hard failure into a
    slower success. Only applies when running on free models - a configured
    paid model is used as given, with no silent substitution.
    """
    primary = openrouter_model()
    if not primary.endswith(":free"):
        return [primary]

    fallbacks = [m for m in FREE_MODEL_FALLBACKS if m != primary]
    return [primary, *fallbacks]


async def _call_openrouter(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int,
    temperature: float,
    title: str,
) -> Dict:
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": title,
    }

    last_error: Optional[Exception] = None

    async with httpx.AsyncClient(timeout=120.0) as client:
        for model in _model_candidates():
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
            )

            # 429 means this model is rate-limited; another may not be.
            if response.status_code == 429:
                last_error = RuntimeError(
                    f"OpenRouter API error (429) on {model}: {response.text[:200]}"
                )
                continue

            _raise_for_status(response, "OpenRouter")
            data = response.json()
            return {
                "content": data["choices"][0]["message"]["content"],
                "usage": data.get("usage", {}),
                "model": data.get("model", model),
            }

    raise last_error or RuntimeError("OpenRouter: all candidate models failed")


async def _call_anthropic(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int,
    temperature: float,
) -> Dict:
    """
    Anthropic Messages API.

    Note the shape differences from the OpenAI-compatible format: the system
    prompt is a top-level field rather than a message, and the response text
    lives in content blocks. `temperature` is not sent - current Claude models
    reject sampling parameters, and prompts already carry the tone guidance.
    """
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
    }

    payload = {
        "model": anthropic_model(),
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{ANTHROPIC_BASE_URL}/messages",
            headers=headers,
            json=payload,
        )
        _raise_for_status(response, "Anthropic")
        data = response.json()

    text = "".join(
        block.get("text", "")
        for block in data.get("content", [])
        if block.get("type") == "text"
    )

    usage = data.get("usage", {})
    return {
        "content": text,
        "usage": {
            "prompt_tokens": usage.get("input_tokens", 0),
            "completion_tokens": usage.get("output_tokens", 0),
            "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
        },
        "model": data.get("model", anthropic_model()),
    }


async def call_llm_vision(
    prompt: str,
    base64_image: str,
    media_type: str = "image/png",
    max_tokens: int = 4096,
    title: str = "AI Learning Platform OCR",
) -> Dict:
    """
    Send an image plus a text prompt to the configured provider.

    Used by the OCR path for handwritten-notes extraction. The two providers
    take images in different shapes: OpenRouter uses an `image_url` block with
    a data URI, Anthropic uses an `image` block with base64 source fields.
    """
    ensure_configured()
    provider = get_provider()

    if provider == "openrouter":
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": title,
        }
        payload = {
            "model": openrouter_model(),
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{base64_image}"
                            },
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            _raise_for_status(response, "OpenRouter")
            data = response.json()

        return {
            "content": data["choices"][0]["message"]["content"],
            "usage": data.get("usage", {}),
            "model": data.get("model", openrouter_model()),
        }

    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
    }
    payload = {
        "model": anthropic_model(),
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": base64_image,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{ANTHROPIC_BASE_URL}/messages",
            headers=headers,
            json=payload,
        )
        _raise_for_status(response, "Anthropic")
        data = response.json()

    text = "".join(
        block.get("text", "")
        for block in data.get("content", [])
        if block.get("type") == "text"
    )
    usage = data.get("usage", {})
    return {
        "content": text,
        "usage": {
            "prompt_tokens": usage.get("input_tokens", 0),
            "completion_tokens": usage.get("output_tokens", 0),
            "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
        },
        "model": data.get("model", anthropic_model()),
    }


async def call_llm_messages(
    system_prompt: str,
    messages: List[Dict],
    max_tokens: int = 2000,
    temperature: float = 0.7,
    title: str = "AI Learning Platform",
) -> Dict:
    """
    Multi-turn variant of `call_llm` for conversational history.

    `messages` is a list of {"role": "user"|"assistant", "content": str}.
    """
    ensure_configured()
    provider = get_provider()

    if provider == "openrouter":
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": title,
        }
        payload = {
            "model": openrouter_model(),
            "messages": [{"role": "system", "content": system_prompt}] + messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            _raise_for_status(response, "OpenRouter")
            data = response.json()

        return {
            "content": data["choices"][0]["message"]["content"],
            "usage": data.get("usage", {}),
            "model": data.get("model", openrouter_model()),
        }

    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
    }
    payload = {
        "model": anthropic_model(),
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": messages,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{ANTHROPIC_BASE_URL}/messages",
            headers=headers,
            json=payload,
        )
        _raise_for_status(response, "Anthropic")
        data = response.json()

    text = "".join(
        block.get("text", "")
        for block in data.get("content", [])
        if block.get("type") == "text"
    )
    usage = data.get("usage", {})
    return {
        "content": text,
        "usage": {
            "prompt_tokens": usage.get("input_tokens", 0),
            "completion_tokens": usage.get("output_tokens", 0),
            "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
        },
        "model": data.get("model", anthropic_model()),
    }
