from __future__ import annotations

from typing import Any

from supwork_backend.config import Settings
from supwork_backend.exa_client import ExaClient
from supwork_backend.google_clients import GoogleClients
from supwork_backend.model_provider import ModelProvider


def provider_status(settings: Settings, model: ModelProvider, exa: ExaClient, google: GoogleClients) -> dict[str, Any]:
    supabase_ready = settings.supabase_configured
    sqlite_mode = settings.supwork_storage_mode == "sqlite"
    return {
        "mode": "live" if settings.supwork_provider == "live" else "mock",
        "database": {
            "provider": "sqlite" if sqlite_mode else "supabase_postgres" if settings.database_url or settings.supabase_url else "fixture",
            "configured": bool(sqlite_mode or settings.database_url or settings.supabase_url),
            "status": "prototype" if sqlite_mode else "ready" if supabase_ready or settings.database_url else "fixture",
            "path": str(settings.sqlite_database_path) if sqlite_mode else None,
        },
        "auth": {
            "provider": "supabase_auth" if settings.supabase_url else "demo_sessions",
            "configured": bool(settings.supabase_url and settings.supabase_jwt_secret),
            "status": "ready" if settings.supabase_url and settings.supabase_jwt_secret else "demo",
        },
        "storage": {
            "provider": "supabase_storage" if settings.supabase_url else "local_fixture",
            "configured": supabase_ready,
            "status": "ready" if supabase_ready else "fixture",
            "bucket": settings.supabase_storage_bucket if settings.supabase_url else None,
        },
        "exa": exa.status(),
        "googleCalendar": {"configured": google.status()["configured"], "status": google.status()["calendar"]},
        "gmail": {"configured": google.status()["configured"] and bool(settings.gmail_sender_email), "status": google.status()["gmail"]},
        "workato": {"configured": False, "status": "disabled_direct_google_path"},
        "model": model.status(),
    }
