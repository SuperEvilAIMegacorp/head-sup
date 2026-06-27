from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from supwork_backend.config import Settings
from supwork_backend.main import create_app


class BackendWorkflowTests(unittest.TestCase):
    def setUp(self) -> None:
        settings = Settings(_env_file=None, supwork_provider="mock")
        self.client = TestClient(create_app(settings=settings))
        self.hr_token = self._login("hr@demo.supwork.local")
        self.candidate_token = self._login("interviewee@demo.supwork.local")

    def _login(self, email: str) -> str:
        response = self.client.post("/api/auth/login", json={"email": email, "password": "demo"})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["accessToken"]

    def _headers(self, token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

    def test_candidate_view_hides_internal_recruiter_fields(self) -> None:
        response = self.client.get("/api/candidate/workflows/wf_demo", headers=self._headers(self.candidate_token))
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertIn("evidenceSummary", body)
        self.assertNotIn("approvals", body)
        self.assertNotIn("auditEvents", body)
        self.assertTrue(all(item["visibility"] == "candidate_visible" for item in body["evidenceSummary"]))

    def test_schedule_requires_approved_human_approval(self) -> None:
        payload = self._schedule_payload("appr_missing")
        response = self.client.post(
            "/api/integrations/google-calendar/create-approved",
            headers=self._headers(self.hr_token),
            json=payload,
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("appr_missing", response.text)

    def test_approved_schedule_creates_fixture_google_event_and_candidate_schedule(self) -> None:
        approval = self.client.post(
            "/api/approvals",
            headers=self._headers(self.hr_token),
            json={
                "workflowId": "wf_demo",
                "actionType": "schedule_interview",
                "provider": "google_calendar",
                "proposedPayload": {"meetingProvider": "google_meet"},
            },
        )
        self.assertEqual(approval.status_code, 200, approval.text)
        approval_id = approval.json()["id"]
        approved = self.client.post(f"/api/approvals/{approval_id}/approve", headers=self._headers(self.hr_token))
        self.assertEqual(approved.status_code, 200, approved.text)

        response = self.client.post(
            "/api/integrations/google-calendar/create-approved",
            headers=self._headers(self.hr_token),
            json=self._schedule_payload(approval_id),
        )
        self.assertEqual(response.status_code, 200, response.text)
        provider = response.json()["providerResult"]
        self.assertEqual(provider["providerMode"], "fixture")
        self.assertEqual(provider["status"], "scheduled")
        self.assertIn("meet.google.com", provider["meetLink"])

        candidate_schedule = self.client.get(
            "/api/candidate/workflows/wf_demo/schedule",
            headers=self._headers(self.candidate_token),
        )
        self.assertEqual(candidate_schedule.status_code, 200, candidate_schedule.text)
        self.assertEqual(candidate_schedule.json()["schedule"]["approvalId"], approval_id)

    def test_gmail_blocks_internal_or_secret_language(self) -> None:
        approval = self.client.post(
            "/api/approvals",
            headers=self._headers(self.hr_token),
            json={
                "workflowId": "wf_demo",
                "actionType": "create_gmail_draft",
                "provider": "gmail",
                "proposedPayload": {"subject": "Follow-up"},
            },
        )
        approval_id = approval.json()["id"]
        self.client.post(f"/api/approvals/{approval_id}/approve", headers=self._headers(self.hr_token))

        response = self.client.post(
            "/api/integrations/gmail/draft-approved",
            headers=self._headers(self.hr_token),
            json={
                "workflowId": "wf_demo",
                "approvalId": approval_id,
                "to": "maya@example.com",
                "subject": "Internal note",
                "body": "This contains an internal note and api key wording.",
                "humanApproved": True,
                "approvedBy": "hr@demo.supwork.local",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("failed safety check", response.text)

    def _schedule_payload(self, approval_id: str) -> dict:
        start = datetime.now(timezone.utc) + timedelta(days=2)
        return {
            "workflowId": "wf_demo",
            "approvalId": approval_id,
            "candidate": {"name": "Maya Tan", "email": "maya@example.com"},
            "role": {"title": "AI Solutions Engineer", "company": "Example AI"},
            "startTime": start.isoformat(),
            "durationMinutes": 45,
            "timezone": "Asia/Singapore",
            "attendees": ["interviewer@example.com"],
            "meetingProvider": "google_meet",
            "humanApproved": True,
            "approvedBy": "hr@demo.supwork.local",
            "description": "Candidate-safe interview conversation for the role.",
        }


if __name__ == "__main__":
    unittest.main()
