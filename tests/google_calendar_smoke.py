from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from supwork_backend.config import Settings
from supwork_backend.google_clients import GoogleClients, GoogleProviderNotConfigured


def parse_start(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc) + timedelta(days=1)
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def build_payload(args: argparse.Namespace) -> dict[str, Any]:
    attendee = args.attendee or "calendar-smoke@example.com"
    return {
        "workflowId": "wf_calendar_smoke",
        "approvalId": "appr_calendar_smoke",
        "candidate": {
            "name": "Calendar Smoke Candidate",
            "email": attendee,
        },
        "role": {
            "title": "sup'work Calendar Smoke Test",
            "company": "sup'work demo",
        },
        "startTime": parse_start(args.start_time),
        "durationMinutes": args.duration_minutes,
        "timezone": args.timezone,
        "attendees": [] if args.attendee is None else [args.attendee],
        "meetingProvider": "google_meet",
        "humanApproved": True,
        "approvedBy": "calendar-smoke@local",
        "description": "Candidate-safe Google Calendar smoke test for sup'work.",
    }


def require_live_config(settings: Settings, attendee: str | None) -> None:
    missing = []
    client_id, client_secret = settings.google_oauth_client()
    if not client_id:
        missing.append("GOOGLE_CLIENT_ID or secrets/client_secret*.json")
    if not client_secret:
        missing.append("GOOGLE_CLIENT_SECRET or secrets/client_secret*.json")
    if not settings.google_refresh_token:
        missing.append("GOOGLE_REFRESH_TOKEN")
    if not attendee:
        missing.append("--attendee")
    if missing:
        raise RuntimeError("Live calendar smoke is missing: " + ", ".join(missing))


def main() -> int:
    parser = argparse.ArgumentParser(description="Manual Google Calendar / Meet smoke test.")
    parser.add_argument("--live", action="store_true", help="Create a real Google Calendar event.")
    parser.add_argument("--attendee", help="Email address to invite in live mode.")
    parser.add_argument("--start-time", help="ISO datetime. Defaults to tomorrow in UTC.")
    parser.add_argument("--duration-minutes", type=int, default=15)
    parser.add_argument("--timezone", default="Asia/Singapore")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    os.chdir(ROOT)

    settings = Settings()
    if args.live:
        require_live_config(settings, args.attendee)

    client = GoogleClients(settings)
    payload = build_payload(args)

    try:
        result = client.create_calendar_event(payload, live=args.live)
    except GoogleProviderNotConfigured as exc:
        print(f"Google Calendar smoke failed: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Google Calendar smoke failed: {exc.__class__.__name__}: {exc}", file=sys.stderr)
        return 1

    print("Google Calendar smoke test passed")
    print(f"Mode: {result.get('providerMode')}")
    print(f"Status: {result.get('status')}")
    print(f"Calendar event ID: {result.get('eventId')}")
    print(f"Meet link: {result.get('meetLink')}")
    print(f"Calendar link: {result.get('htmlLink')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
