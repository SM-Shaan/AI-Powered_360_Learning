from pydantic_settings import BaseSettings
from typing import Optional
import os

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

    # File uploads
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    upload_dir: str = "uploads"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
