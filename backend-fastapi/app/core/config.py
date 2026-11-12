from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_key: str = ""

    # JWT
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # Claude API (Direct Anthropic)
    anthropic_api_key: Optional[str] = None

    # OpenRouter API (Alternative)
    openrouter_api_key: Optional[str] = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Force a provider when both keys are set: "anthropic" or "openrouter".
    # Leave unset to let the resolver choose (Anthropic first).
    llm_provider: Optional[str] = None

    # Model overrides. Leave unset to use the defaults in llm_client.
    openrouter_model: Optional[str] = None
    anthropic_model: Optional[str] = None

    # Route OpenRouter traffic to a ':free' model. Free models cost nothing and
    # need no credit balance, but are rate-limited - useful for development,
    # not for production.
    use_free_models: bool = False

    # HuggingFace (for embeddings)
    huggingface_token: Optional[str] = None

    # File uploads
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    upload_dir: str = "uploads"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
