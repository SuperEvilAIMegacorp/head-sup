from __future__ import annotations

import base64
from datetime import timedelta
from email.message import EmailMessage
from typing import Any
from uuid import uuid4

from supwork_backend.config import Settings


class GoogleProviderNotConfigured(RuntimeError):
    pass


class GoogleClients:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def status(self) -> dict[str, Any]:
        configured = self.settings.google_configured
        return {
            "configured": configured,
            "calendar": "ready" if configured else "mock",
            "gmail": "ready" if configured and self.settings.gmail_sender_email else "mock",
        }

    def create_calendar_event(self, payload: dict[str, Any], live: bool) -> dict[str, Any]:
        trace_id = f"trc_{uuid4().hex[:10]}"
        start = payload["startTime"]
        end = start + timedelta(minutes=payload["durationMinutes"])
        if not live:
            return {
                "status": "scheduled",
                "meetingId": f"meeting_{uuid4().hex[:10]}",
                "eventId": f"fixture_google_event_{uuid4().hex[:8]}",
                "meetLink": "https://meet.google.com/fixture-demo-link",
                "htmlLink": "https://calendar.google.com/calendar/event?fixture=1",
                "startDateTime": start.isoformat(),
                "endDateTime": end.isoformat(),
                "timeZone": payload["timezone"],
                "humanApprovalId": payload["approvalId"],
                "traceId": trace_id,
                "providerMode": "fixture",
            }

        service = self._service("calendar", "v3", ["https://www.googleapis.com/auth/calendar.events"])
        body = {
            "summary": f"sup'work interview - {payload['role']['title']}",
            "description": payload.get("description") or "Candidate-safe interview conversation.",
            "start": {"dateTime": start.isoformat(), "timeZone": payload["timezone"]},
            "end": {"dateTime": end.isoformat(), "timeZone": payload["timezone"]},
            "attendees": [{"email": payload["candidate"]["email"]}] + [{"email": email} for email in payload["attendees"]],
            "conferenceData": {
                "createRequest": {
                    "requestId": trace_id,
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        }
        event = (
            service.events()
            .insert(calendarId=self.settings.google_calendar_id, body=body, conferenceDataVersion=1, sendUpdates="all")
            .execute()
        )
        meet_link = event.get("hangoutLink")
        for entry in event.get("conferenceData", {}).get("entryPoints", []):
            if entry.get("entryPointType") == "video":
                meet_link = entry.get("uri")
        return {
            "status": "scheduled" if meet_link else "conference_pending",
            "meetingId": f"meeting_{uuid4().hex[:10]}",
            "eventId": event.get("id"),
            "meetLink": meet_link,
            "htmlLink": event.get("htmlLink"),
            "startDateTime": start.isoformat(),
            "endDateTime": end.isoformat(),
            "timeZone": payload["timezone"],
            "humanApprovalId": payload["approvalId"],
            "traceId": trace_id,
            "providerMode": "live",
        }

    def create_gmail_draft(self, payload: dict[str, Any], live: bool, send: bool = False) -> dict[str, Any]:
        trace_id = f"trc_{uuid4().hex[:10]}"
        if not live:
            return {
                "status": "sent" if send else "draft_created",
                "operation": "send" if send else "draft",
                "draftId": None if send else f"fixture_gmail_draft_{uuid4().hex[:8]}",
                "messageId": f"fixture_gmail_msg_{uuid4().hex[:8]}" if send else None,
                "threadId": f"fixture_thread_{uuid4().hex[:8]}",
                "subject": payload["subject"],
                "bodySummary": "Candidate-safe body withheld from provider summary.",
                "traceId": trace_id,
                "providerMode": "fixture",
            }

        service = self._service("gmail", "v1", ["https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/gmail.send"])
        message = EmailMessage()
        message["To"] = payload["to"]
        message["From"] = self.settings.gmail_sender_email
        message["Subject"] = payload["subject"]
        message.set_content(payload["body"])
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
        if send:
            result = service.users().messages().send(userId="me", body={"raw": raw}).execute()
            return {
                "status": "sent",
                "operation": "send",
                "messageId": result.get("id"),
                "threadId": result.get("threadId"),
                "subject": payload["subject"],
                "bodySummary": "Candidate-safe body withheld from provider summary.",
                "traceId": trace_id,
                "providerMode": "live",
            }
        result = service.users().drafts().create(userId="me", body={"message": {"raw": raw}}).execute()
        return {
            "status": "draft_created",
            "operation": "draft",
            "draftId": result.get("id"),
            "messageId": result.get("message", {}).get("id"),
            "threadId": result.get("message", {}).get("threadId"),
            "subject": payload["subject"],
            "bodySummary": "Candidate-safe body withheld from provider summary.",
            "traceId": trace_id,
            "providerMode": "live",
        }

    def _service(self, service_name: str, version: str, scopes: list[str]):
        if not self.settings.google_configured:
            raise GoogleProviderNotConfigured("Google OAuth client and refresh token are not configured")
        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
        except ImportError as exc:
            raise GoogleProviderNotConfigured("Google API packages are not installed") from exc

        client_id, client_secret = self.settings.google_oauth_client()
        credentials = Credentials(
            token=None,
            refresh_token=self.settings.google_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=scopes,
        )
        return build(service_name, version, credentials=credentials, cache_discovery=False)
