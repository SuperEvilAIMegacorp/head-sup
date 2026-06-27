from __future__ import annotations

import glob
import json
from pathlib import Path
from typing import Any

from pydantic import AliasChoices
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "supwork-backend"
    port: int = 8787
    frontend_origin: str = ""
    supwork_provider: str = "mock"
    supwork_storage_mode: str = "sqlite"
    demo_password: str = "demo"

    database_url: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"),
    )
    supabase_jwt_secret: str = ""
    supabase_jwks_url: str = ""
    supabase_storage_bucket: str = "supwork-artifacts"
    sqlite_database_path: Path = Field(default=Path(".local-data/supwork.sqlite"))

    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = ""
    azure_openai_api_version: str = ""
    model_deployment_name: str = ""
    openai_api_key: str = ""

    exa_api_key: str = ""
    exa_base_url: str = "https://api.exa.ai"
    exa_cache_ttl_seconds: int = 86400

    google_auth_mode: str = "oauth_client"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_client_secret_file: str = ""
    google_refresh_token: str = ""
    google_calendar_id: str = "primary"
    google_calendar_time_zone: str = "Asia/Singapore"
    gmail_sender_email: str = ""

    local_data_dir: Path = Field(default=Path(".local-data"))

    @property
    def model_provider(self) -> str:
        if self.azure_openai_endpoint and self.azure_openai_api_key:
            return "azure-openai"
        if self.openai_api_key:
            return "openai-compatible"
        return "mock"

    @property
    def model_deployment(self) -> str:
        return self.azure_openai_deployment or self.model_deployment_name or "gpt-4.1-mini"

    @property
    def google_configured(self) -> bool:
        client_id, client_secret = self.google_oauth_client()
        return bool(client_id and client_secret and self.google_refresh_token)

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    def google_oauth_client(self) -> tuple[str, str]:
        if self.google_client_id and self.google_client_secret:
            return self.google_client_id, self.google_client_secret

        secret_file = self.google_client_secret_file or self._default_google_secret_file()
        if not secret_file:
            return "", ""

        try:
            raw: dict[str, Any] = json.loads(Path(secret_file).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return "", ""

        payload = raw.get("web") or raw.get("installed") or {}
        return str(payload.get("client_id") or ""), str(payload.get("client_secret") or "")

    @staticmethod
    def _default_google_secret_file() -> str:
        matches = sorted(glob.glob("secrets/client_secret*.json"))
        return matches[0] if matches else ""


def get_settings() -> Settings:
    return Settings()
