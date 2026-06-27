from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from supwork_backend.config import Settings
from supwork_backend.main import create_app


class FakeEndToEndWorkflowTests(unittest.TestCase):
    def setUp(self) -> None:
        settings = Settings(_env_file=None, supwork_provider="mock")
        self.client = TestClient(create_app(settings=settings))
        self.hr_token = self._login("hr@demo.supwork.local")
        self.candidate_token = self._login("interviewee@demo.supwork.local")
        self.hr_headers = {"Authorization": f"Bearer {self.hr_token}"}
        self.candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}

    def _login(self, email: str) -> str:
        response = self.client.post("/api/auth/login", json={"email": email, "password": "demo"})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["accessToken"]

    def test_fake_golden_path_end_to_end(self) -> None:
        candidate_home = self.client.get("/api/candidate/workflows/wf_demo", headers=self.candidate_headers)
        self.assertEqual(candidate_home.status_code, 200, candidate_home.text)
        self.assertEqual(candidate_home.json()["stage"], "interview_planning")
        self.assertGreaterEqual(len(candidate_home.json()["evidenceSummary"]), 1)

        recruiter_packet = self.client.get("/api/recruiter/workflows/wf_demo", headers=self.hr_headers)
        self.assertEqual(recruiter_packet.status_code, 200, recruiter_packet.text)
        self.assertIn("evidenceMappings", recruiter_packet.json())
        self.assertIn("approvals", recruiter_packet.json())

        research = self.client.post(
            "/api/research/company",
            headers=self.hr_headers,
            json={
                "workflowId": "wf_demo",
                "company": "Example AI",
                "roleTitle": "AI Solutions Engineer",
                "region": "Singapore/APAC",
            },
        )
        self.assertEqual(research.status_code, 200, research.text)
        self.assertEqual(research.json()["provider"], "fixture")
        self.assertGreaterEqual(len(research.json()["sources"]), 1)

        candidate_research = self.client.get("/api/workflows/wf_demo/research", headers=self.candidate_headers)
        self.assertEqual(candidate_research.status_code, 200, candidate_research.text)
        self.assertTrue(candidate_research.json()["artifacts"])

        questions = self.client.post("/api/recruiter/workflows/wf_demo/questions", headers=self.hr_headers)
        self.assertEqual(questions.status_code, 200, questions.text)
        self.assertTrue(questions.json()["questions"])
        self.assertTrue(questions.json()["candidatePrepThemes"])

        schedule_approval_id = self._create_and_approve(
            action_type="schedule_interview",
            provider="google_calendar",
            proposed_payload={"meetingProvider": "google_meet"},
        )
        schedule = self.client.post(
            "/api/integrations/google-calendar/create-approved",
            headers=self.hr_headers,
            json=self._schedule_payload(schedule_approval_id),
        )
        self.assertEqual(schedule.status_code, 200, schedule.text)
        schedule_body = schedule.json()
        self.assertEqual(schedule_body["providerResult"]["providerMode"], "fixture")
        self.assertIn("meet.google.com", schedule_body["providerResult"]["meetLink"])
        round_id = schedule_body["schedule"]["id"]

        candidate_schedule = self.client.get("/api/candidate/workflows/wf_demo/schedule", headers=self.candidate_headers)
        self.assertEqual(candidate_schedule.status_code, 200, candidate_schedule.text)
        self.assertEqual(candidate_schedule.json()["schedule"]["roundId"], round_id)

        notes = self.client.post(
            "/api/recruiter/workflows/wf_demo/notes",
            headers=self.hr_headers,
            json={
                "notes": "Candidate gave a clear deployment example; validate post-launch ownership.",
                "visibility": "interviewer_internal",
            },
        )
        self.assertEqual(notes.status_code, 200, notes.text)

        addendum = self.client.post(
            f"/api/candidate/workflows/wf_demo/rounds/{round_id}/addendum",
            headers=self.candidate_headers,
            json={
                "addendumType": "clarification",
                "body": "I want to clarify that I owned rollout monitoring for two customer deployments.",
                "sensitiveFlag": False,
            },
        )
        self.assertEqual(addendum.status_code, 200, addendum.text)
        addendum_id = addendum.json()["id"]

        acknowledge = self.client.post(
            f"/api/recruiter/workflows/wf_demo/addenda/{addendum_id}/acknowledge",
            headers=self.hr_headers,
        )
        self.assertEqual(acknowledge.status_code, 200, acknowledge.text)
        self.assertEqual(acknowledge.json()["status"], "acknowledged")

        feedback = self.client.post(
            "/api/recruiter/workflows/wf_demo/candidate-safe-summary",
            headers=self.hr_headers,
            json={"includeAddenda": True, "nextStep": "Recruiter will review the added rollout context."},
        )
        self.assertEqual(feedback.status_code, 200, feedback.text)
        self.assertEqual(feedback.json()["visibilityCheckStatus"], "passed")

        gmail_approval_id = self._create_and_approve(
            action_type="create_gmail_draft",
            provider="gmail",
            proposed_payload={"subject": feedback.json()["subject"]},
        )
        gmail = self.client.post(
            "/api/integrations/gmail/draft-approved",
            headers=self.hr_headers,
            json={
                "workflowId": "wf_demo",
                "approvalId": gmail_approval_id,
                "to": "maya@example.com",
                "subject": feedback.json()["subject"],
                "body": feedback.json()["body"],
                "humanApproved": True,
                "approvedBy": "hr@demo.supwork.local",
            },
        )
        self.assertEqual(gmail.status_code, 200, gmail.text)
        self.assertEqual(gmail.json()["providerResult"]["providerMode"], "fixture")
        self.assertEqual(gmail.json()["providerResult"]["status"], "draft_created")

        candidate_final = self.client.get("/api/candidate/workflows/wf_demo", headers=self.candidate_headers)
        self.assertEqual(candidate_final.status_code, 200, candidate_final.text)
        self.assertTrue(candidate_final.json()["submittedAddenda"])
        self.assertEqual(candidate_final.json()["submittedAddenda"][0]["status"], "acknowledged")
        self.assertNotIn("approvals", candidate_final.json())

        audit = self.client.get("/api/audit-log?workflowId=wf_demo", headers=self.hr_headers)
        self.assertEqual(audit.status_code, 200, audit.text)
        event_types = {event["eventType"] for event in audit.json()["events"]}
        self.assertIn("agent.research.completed", event_types)
        self.assertIn("approval.approved", event_types)
        self.assertIn("google_calendar.event.created", event_types)
        self.assertIn("candidate.addendum_acknowledged", event_types)
        self.assertIn("gmail.draft.created", event_types)

    def _create_and_approve(self, action_type: str, provider: str, proposed_payload: dict) -> str:
        approval = self.client.post(
            "/api/approvals",
            headers=self.hr_headers,
            json={
                "workflowId": "wf_demo",
                "actionType": action_type,
                "provider": provider,
                "proposedPayload": proposed_payload,
            },
        )
        self.assertEqual(approval.status_code, 200, approval.text)
        approval_id = approval.json()["id"]
        approved = self.client.post(f"/api/approvals/{approval_id}/approve", headers=self.hr_headers)
        self.assertEqual(approved.status_code, 200, approved.text)
        self.assertEqual(approved.json()["status"], "approved")
        return approval_id

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
