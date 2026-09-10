"""
CloakSight — Server Configuration

Loaded from environment variables only.
Never hardcode API keys here.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import list


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ---- General ----
    env: str = "development"
    log_level: str = "info"

    # ---- CORS ----
    cors_origins: list[str] = ["chrome-extension://*"]

    # ---- Agent Provider (Phase 7) ----
    agent_provider: str = ""
    agent_model: str = ""
    agent_api_key: str = ""  # Loaded from env, never logged

    # ---- Privacy ----
    pii_confidence_threshold: float = 0.85
    leak_guard_block_on_detection: bool = True


settings = Settings()
