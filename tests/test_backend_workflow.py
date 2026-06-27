from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from supwork_backend.config import Settings
from supwork_backend.main import create_app


class BackendWorkflowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.sqlite_path = Path(".local-data") / f"test-backend-{uuid4().hex}.sqlite"
        settings = Settings(_env_file=None, supwork_provider="mock", sqlite_database_path=self.sqlite_path)
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
        approval_id, response = self._schedule_round()
        provider = response.json()["providerResult"]
        self.assertEqual(provider["providerMode"], "fixture")
        self.assertEqual(provider["status"], "scheduled")
        self.assertIn("meet.google.com", provider["meetLink"])

        recruiter_view = self.client.get("/api/recruiter/workflows/wf_demo", headers=self._headers(self.hr_token))
        self.assertEqual(recruiter_view.status_code, 200, recruiter_view.text)
        self.assertEqual(recruiter_view.json()["stage"], "interview_scheduled")

        candidate_schedule = self.client.get(
            "/api/candidate/workflows/wf_demo/schedule",
            headers=self._headers(self.candidate_token),
        )
        self.assertEqual(candidate_schedule.status_code, 200, candidate_schedule.text)
        self.assertEqual(candidate_schedule.json()["schedule"]["approvalId"], approval_id)

    def test_addendum_requires_completed_round(self) -> None:
        _, schedule = self._schedule_round()
        round_id = schedule.json()["schedule"]["id"]

        response = self.client.post(
            f"/api/candidate/workflows/wf_demo/rounds/{round_id}/addendum",
            headers=self._headers(self.candidate_token),
            json={
                "addendumType": "clarification",
                "body": "I can share rollout evidence after the interview.",
                "sensitiveFlag": False,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("requires the interview round to be complete", response.text)

    def test_addendum_metadata_and_hr_review_notes_persist_safely(self) -> None:
        _, schedule = self._schedule_round()
        round_id = schedule.json()["schedule"]["id"]
        completed = self.client.post(
            f"/api/recruiter/workflows/wf_demo/rounds/{round_id}/complete",
            headers=self._headers(self.hr_token),
            json={"notes": "Strong deployment example.", "visibility": "interviewer_internal"},
        )
        self.assertEqual(completed.status_code, 200, completed.text)

        addendum = self.client.post(
            f"/api/candidate/workflows/wf_demo/rounds/{round_id}/addendum",
            headers=self._headers(self.candidate_token),
            json={
                "addendumType": "additional_document",
                "body": "Adding a public case study link and metadata for a portfolio PDF.",
                "sensitiveFlag": False,
                "attachments": [
                    {
                        "name": "rollout-portfolio.pdf",
                        "filename": "rollout-portfolio.pdf",
                        "contentType": "application/pdf",
                        "sizeBytes": 2048,
                        "content": "fixture bytes should not be stored",
                    }
                ],
                "links": [{"label": "Case study", "url": "https://example.com/case-study", "linkType": "portfolio"}],
            },
        )
        self.assertEqual(addendum.status_code, 200, addendum.text)
        addendum_body = addendum.json()
        self.assertEqual(addendum_body["attachments"][0]["storageStatus"], "metadata_only")
        self.assertNotIn("content", addendum_body["attachments"][0])
        self.assertEqual(addendum_body["links"][0]["url"], "https://example.com/case-study")

        acknowledge = self.client.post(
            f"/api/recruiter/workflows/wf_demo/addenda/{addendum_body['id']}/acknowledge",
            headers=self._headers(self.hr_token),
            json={"reviewNote": "Reviewed link; use only as candidate-supplied context.", "reviewStatus": "acknowledged"},
        )
        self.assertEqual(acknowledge.status_code, 200, acknowledge.text)
        self.assertEqual(acknowledge.json()["reviewNotes"], "Reviewed link; use only as candidate-supplied context.")

        recruiter_view = self.client.get("/api/recruiter/workflows/wf_demo", headers=self._headers(self.hr_token))
        reviewed = recruiter_view.json()["candidateAddenda"][0]
        self.assertEqual(reviewed["reviewNotes"], "Reviewed link; use only as candidate-supplied context.")

        candidate_view = self.client.get("/api/candidate/workflows/wf_demo", headers=self._headers(self.candidate_token))
        candidate_addendum = candidate_view.json()["submittedAddenda"][0]
        self.assertNotIn("reviewNotes", candidate_addendum)
        self.assertEqual(candidate_addendum["attachments"][0]["name"], "rollout-portfolio.pdf")
        self.assertTrue(any(receipt["receiptType"] == "addendum_acknowledged" for receipt in candidate_view.json()["receipts"]))

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

    def test_analyze_evidence_populates_agent_filled_fields_and_trace(self) -> None:
        response = self.client.post(
            "/api/recruiter/workflows/wf_demo/analyze-evidence",
            headers=self._headers(self.hr_token),
        )
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["dataSource"], "backend_generated")
        self.assertEqual(body["providerMode"], "mock")
        self.assertTrue(body["roleBrief"]["rubricTags"])
        self.assertTrue(body["traceId"].startswith("trc_"))

        recruiter_view = self.client.get("/api/recruiter/workflows/wf_demo", headers=self._headers(self.hr_token))
        self.assertEqual(recruiter_view.status_code, 200, recruiter_view.text)
        self.assertEqual(recruiter_view.json()["agentFilledFields"]["traceId"], body["traceId"])

        trace = self.client.get("/api/workflows/wf_demo/agent-trace", headers=self._headers(self.hr_token))
        self.assertEqual(trace.status_code, 200, trace.text)
        self.assertTrue(any(run["agentName"] == "supwork-evidence-agent" for run in trace.json()["agentRuns"]))

    def test_calendar_availability_compat_endpoint_returns_fixture_slots(self) -> None:
        response = self.client.get(
            "/api/interviews/calendar-availability",
            params={
                "startDateTime": "2026-06-01T00:00:00",
                "endDateTime": "2026-07-01T00:00:00",
                "timeZone": "Singapore Standard Time",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["providerMode"], "fixture")
        self.assertEqual(body["timeZone"], "Asia/Singapore")
        self.assertTrue(body["availableSlots"])
        self.assertEqual(body["availableSlots"], body["availability"])

    def test_sqlite_store_persists_tokens_across_app_instances(self) -> None:
        settings = Settings(_env_file=None, supwork_provider="mock", sqlite_database_path=self.sqlite_path)
        restarted_client = TestClient(create_app(settings=settings))
        response = restarted_client.get("/api/auth/me", headers=self._headers(self.hr_token))
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["user"]["email"], "hr@demo.supwork.local")

    def test_pdf_upload_analysis_parses_cv_and_updates_stage(self) -> None:
        response = self.client.post(
            "/api/recruiter/workflows/wf_demo/cv/upload-analysis",
            headers=self._headers(self.hr_token),
            data={"jobScopeText": "Python API integration, customer AI deployment, post-launch ownership"},
            files={"file": ("maya_cv.pdf", tiny_pdf_bytes(), "application/pdf")},
        )
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["artifact"]["filename"], "maya_cv.pdf")
        self.assertEqual(body["artifact"]["parser"], "pypdf")
        self.assertIn("Python API integration", body["artifact"]["text"])
        self.assertEqual(body["analysis"]["dataSource"], "uploaded_cv_pdf")

        recruiter_view = self.client.get("/api/recruiter/workflows/wf_demo", headers=self._headers(self.hr_token))
        self.assertEqual(recruiter_view.status_code, 200, recruiter_view.text)
        view = recruiter_view.json()
        self.assertEqual(view["stage"], "evidence_mapped")
        self.assertEqual(view["providerMode"], "mock")
        self.assertEqual(view["sourceArtifacts"][0]["filename"], "maya_cv.pdf")
        self.assertTrue(view["evidenceMappings"])
        self.assertTrue(all(item["sourceArtifactId"] == body["artifact"]["id"] for item in view["evidenceMappings"] if item["visibility"] == "candidate_visible"))

        questions = self.client.post("/api/recruiter/workflows/wf_demo/questions", headers=self._headers(self.hr_token))
        self.assertEqual(questions.status_code, 200, questions.text)
        self.assertTrue(questions.json()["questions"])

    def test_multi_round_projection_and_transcript_storage(self) -> None:
        recruiter_rounds = self.client.get(
            "/api/recruiter/workflows/wf_demo/rounds",
            headers=self._headers(self.hr_token),
        )
        self.assertEqual(recruiter_rounds.status_code, 200, recruiter_rounds.text)
        rounds = recruiter_rounds.json()["rounds"]
        self.assertEqual([round_item["roundNumber"] for round_item in rounds], [1, 2, 3])
        self.assertEqual(rounds[0]["id"], "round_1")
        self.assertTrue(rounds[0]["questions"])
        self.assertTrue(rounds[0]["transcriptEvidence"])
        self.assertEqual(rounds[1]["roundStatus"], "locked")

        candidate_rounds = self.client.get(
            "/api/candidate/workflows/wf_demo/rounds",
            headers=self._headers(self.candidate_token),
        )
        self.assertEqual(candidate_rounds.status_code, 200, candidate_rounds.text)
        candidate_first = candidate_rounds.json()["rounds"][0]
        self.assertNotIn("hrBriefing", candidate_first)
        self.assertEqual(candidate_first["questions"], [])
        self.assertEqual(candidate_first["transcriptEvidence"], [])

        generated = self.client.post(
            "/api/recruiter/workflows/wf_demo/rounds/round_1/questions",
            headers=self._headers(self.hr_token),
        )
        self.assertEqual(generated.status_code, 200, generated.text)
        self.assertEqual(generated.json()["round"]["id"], "round_1")
        self.assertTrue(generated.json()["questions"])

        transcript = self.client.post(
            "/api/recruiter/workflows/wf_demo/rounds/round_1/transcript",
            headers=self._headers(self.hr_token),
            json={
                "sourceType": "live",
                "provider": "manual_demo",
                "transcriptText": "Interviewer: Explain the agent loop.\nCandidate: I validate tool calls before execution.",
            },
        )
        self.assertEqual(transcript.status_code, 200, transcript.text)
        self.assertEqual(transcript.json()["artifact"]["sourceType"], "live")
        self.assertTrue(transcript.json()["round"]["transcriptEvidence"])

    def test_schedule_completion_unlocks_next_round(self) -> None:
        _, schedule = self._schedule_round()
        scheduled_round = schedule.json()["schedule"]
        self.assertEqual(scheduled_round["id"], "round_1")
        self.assertEqual(scheduled_round["roundStatus"], "scheduled")

        completed = self.client.post(
            "/api/recruiter/workflows/wf_demo/rounds/round_1/complete",
            headers=self._headers(self.hr_token),
            json={"notes": "Candidate described validation and rollout tradeoffs.", "visibility": "interviewer_internal"},
        )
        self.assertEqual(completed.status_code, 200, completed.text)
        self.assertEqual(completed.json()["round"]["roundStatus"], "complete")
        self.assertEqual(completed.json()["nextRound"]["id"], "round_2")

        recruiter_rounds = self.client.get(
            "/api/recruiter/workflows/wf_demo/rounds",
            headers=self._headers(self.hr_token),
        )
        second_round = recruiter_rounds.json()["rounds"][1]
        self.assertEqual(second_round["roundStatus"], "ready")

    def test_feedback_release_approval_binds_exact_edited_body(self) -> None:
        feedback = self.client.post(
            "/api/recruiter/workflows/wf_demo/feedback-draft",
            headers=self._headers(self.hr_token),
            json={"includeAddenda": True, "nextStep": "Recruiter will review the added rollout context."},
        )
        self.assertEqual(feedback.status_code, 200, feedback.text)
        generated_body = feedback.json()["body"]
        edited_body = (
            "Thanks for speaking with us. Evidence suggests your deployment examples are relevant, "
            "and HR will review the added rollout context before next steps."
        )

        release = self.client.post(
            "/api/recruiter/workflows/wf_demo/feedback-release-approval",
            headers=self._headers(self.hr_token),
            json={
                "actionType": "create_gmail_draft",
                "channel": "gmail",
                "editedBody": edited_body,
                "sourceMaterialSummary": "Interview notes and candidate addendum were reviewed.",
            },
        )
        self.assertEqual(release.status_code, 200, release.text)
        approval = release.json()["approval"]
        self.assertEqual(approval["proposedPayload"]["approvedBody"], edited_body)
        self.assertEqual(release.json()["draft"]["approvedBody"], edited_body)

        approved = self.client.post(f"/api/approvals/{approval['id']}/approve", headers=self._headers(self.hr_token))
        self.assertEqual(approved.status_code, 200, approved.text)

        mismatch = self.client.post(
            "/api/integrations/gmail/draft-approved",
            headers=self._headers(self.hr_token),
            json={
                "workflowId": "wf_demo",
                "approvalId": approval["id"],
                "to": "maya@example.com",
                "subject": feedback.json()["subject"],
                "body": generated_body,
                "humanApproved": True,
                "approvedBy": "hr@demo.supwork.local",
            },
        )
        self.assertEqual(mismatch.status_code, 400)
        self.assertIn("must match the approved feedback body", mismatch.text)

        gmail = self.client.post(
            "/api/integrations/gmail/draft-approved",
            headers=self._headers(self.hr_token),
            json={
                "workflowId": "wf_demo",
                "approvalId": approval["id"],
                "to": "maya@example.com",
                "subject": feedback.json()["subject"],
                "body": edited_body,
                "humanApproved": True,
                "approvedBy": "hr@demo.supwork.local",
            },
        )
        self.assertEqual(gmail.status_code, 200, gmail.text)

        candidate_view = self.client.get("/api/candidate/workflows/wf_demo", headers=self._headers(self.candidate_token))
        self.assertEqual(candidate_view.status_code, 200, candidate_view.text)
        self.assertEqual(candidate_view.json()["feedback"]["body"], edited_body)

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

    def _schedule_round(self) -> tuple[str, object]:
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
        return approval_id, response


def tiny_pdf_bytes() -> bytes:
    return b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 132 >>
stream
BT
/F1 12 Tf
72 720 Td
(Python API integration and customer AI deployment ownership after launch.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
493
%%EOF
"""


if __name__ == "__main__":
    unittest.main()
