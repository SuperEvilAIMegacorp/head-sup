from __future__ import annotations

import secrets
import threading
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from supwork_backend.seed import demo_state, utc_now_iso


class NotFoundError(KeyError):
    pass


class ForbiddenError(PermissionError):
    pass


class InMemoryStore:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._state = demo_state()

    def login(self, email: str, password: str, expected_password: str) -> dict[str, Any]:
        with self._lock:
            user = next((u for u in self._state["users"].values() if u["email"].lower() == email.lower()), None)
            if not user or password != expected_password:
                raise ForbiddenError("Invalid demo credentials")
            token = f"demo_{secrets.token_urlsafe(24)}"
            self._state["tokens"][token] = user["id"]
            return {"token": token, "user": deepcopy(user)}

    def actor_for_token(self, token: str) -> dict[str, Any]:
        with self._lock:
            user_id = self._state["tokens"].get(token)
            if not user_id:
                raise ForbiddenError("Invalid or expired token")
            return deepcopy(self._state["users"][user_id])

    def workflow_ids_for_actor(self, actor: dict[str, Any]) -> list[str]:
        with self._lock:
            if actor["role"] == "interviewee":
                return [w["id"] for w in self._state["workflows"].values() if w["candidateId"] == actor["id"]]
            return list(self._state["workflows"].keys())

    def workflow(self, workflow_id: str) -> dict[str, Any]:
        workflow = self._state["workflows"].get(workflow_id)
        if not workflow:
            raise NotFoundError(workflow_id)
        return workflow

    def candidate_view(self, workflow_id: str, actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            workflow = deepcopy(self.workflow(workflow_id))
            if actor["role"] == "interviewee" and workflow["candidateId"] != actor["id"]:
                raise ForbiddenError("Workflow is not visible to this candidate")
            role = deepcopy(self._state["roles"][workflow["roleId"]])
            candidate = deepcopy(self._state["users"][workflow["candidateId"]])
            return {
                "workflowId": workflow_id,
                "candidate": {"name": candidate["displayName"], "email": candidate["email"]},
                "role": role,
                "stage": workflow["stage"],
                "statusSummary": workflow["statusSummary"],
                "timeline": self.timeline(workflow_id, candidate_visible=True),
                "evidenceSummary": [
                    deepcopy(item)
                    for item in self._state["evidenceMappings"]
                    if item["workflowId"] == workflow_id and item["visibility"] == "candidate_visible"
                ],
                "roleBrief": self.candidate_research(workflow_id),
                "schedule": self.schedule(workflow_id, candidate_visible=True),
                "interviewPrep": deepcopy(self._state["interviewPlans"].get(workflow_id, {})).get("candidatePrepThemes", []),
                "submittedAddenda": self.addenda(workflow_id, actor_role="interviewee"),
                "feedback": self.approved_feedback(workflow_id),
                "receipts": [deepcopy(r) for r in self._state["candidateReceipts"] if r["workflowId"] == workflow_id],
            }

    def recruiter_view(self, workflow_id: str) -> dict[str, Any]:
        with self._lock:
            workflow = deepcopy(self.workflow(workflow_id))
            role = deepcopy(self._state["roles"][workflow["roleId"]])
            candidate = deepcopy(self._state["users"][workflow["candidateId"]])
            return {
                "workflowId": workflow_id,
                "candidate": {"name": candidate["displayName"], "email": candidate["email"]},
                "role": role,
                "stage": workflow["stage"],
                "statusSummary": workflow["statusSummary"],
                "evidenceMappings": [deepcopy(item) for item in self._state["evidenceMappings"] if item["workflowId"] == workflow_id],
                "researchArtifacts": self.research(workflow_id),
                "interviewPlan": deepcopy(self._state["interviewPlans"].get(workflow_id)),
                "candidateAddenda": self.addenda(workflow_id, actor_role="hr"),
                "approvals": [deepcopy(a) for a in self._state["approvalRequests"].values() if a["workflowId"] == workflow_id],
                "draftHistory": [deepcopy(d) for d in self._state["communicationDrafts"].values() if d["workflowId"] == workflow_id],
                "integrationEvents": [deepcopy(e) for e in self._state["integrationEvents"] if e["workflowId"] == workflow_id],
                "auditEvents": self.timeline(workflow_id, candidate_visible=False),
            }

    def research(self, workflow_id: str) -> list[dict[str, Any]]:
        return [deepcopy(r) for r in self._state["researchArtifacts"] if r["workflowId"] == workflow_id]

    def candidate_research(self, workflow_id: str) -> dict[str, Any]:
        artifacts = [
            deepcopy(r)
            for r in self._state["researchArtifacts"]
            if r["workflowId"] == workflow_id and r["visibility"] == "candidate_visible"
        ]
        return {"artifacts": artifacts}

    def add_research(self, artifact: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            artifact = deepcopy(artifact)
            artifact.setdefault("id", f"rs_{uuid4().hex[:10]}")
            self._state["researchArtifacts"].append(artifact)
            self.audit(artifact["workflowId"], "agent.research.completed", "system", "research", "Research artifact stored.", {"researchId": artifact["id"]}, "recruiter_internal")
            return deepcopy(artifact)

    def interview_plan(self, workflow_id: str) -> dict[str, Any]:
        plan = self._state["interviewPlans"].get(workflow_id)
        if not plan:
            raise NotFoundError("No interview plan")
        return deepcopy(plan)

    def save_interview_plan(self, workflow_id: str, plan: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            plan = deepcopy(plan)
            plan.setdefault("id", f"plan_{uuid4().hex[:10]}")
            plan["workflowId"] = workflow_id
            self._state["interviewPlans"][workflow_id] = plan
            self.set_stage(workflow_id, "interview_planning")
            self.audit(workflow_id, "agent.questions.generated", "system", "model", "Interview plan generated.", {"planId": plan["id"]}, "recruiter_internal")
            return deepcopy(plan)

    def create_approval(self, workflow_id: str, action_type: str, payload: dict[str, Any], risk_level: str, provider: str, actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.workflow(workflow_id)
            approval = {
                "id": f"appr_{uuid4().hex[:10]}",
                "workflowId": workflow_id,
                "actionType": action_type,
                "proposedPayload": deepcopy(payload),
                "riskLevel": risk_level,
                "provider": provider,
                "status": "pending",
                "approvedBy": None,
                "approvedAt": None,
                "rejectedBy": None,
                "rejectedAt": None,
                "createdAt": utc_now_iso(),
            }
            self._state["approvalRequests"][approval["id"]] = approval
            self.audit(workflow_id, "approval.created", "user", actor["id"], f"Approval created for {action_type}.", {"approvalId": approval["id"]}, "candidate_visible")
            return deepcopy(approval)

    def decide_approval(self, approval_id: str, status: str, actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            approval = self._state["approvalRequests"].get(approval_id)
            if not approval:
                raise NotFoundError(approval_id)
            if approval["status"] not in {"pending", "approved"} and status == "approved":
                raise ForbiddenError("Approval is no longer pending")
            if status == "approved":
                approval["status"] = "approved"
                approval["approvedBy"] = actor["email"]
                approval["approvedAt"] = utc_now_iso()
                event_type = "approval.approved"
            else:
                approval["status"] = "rejected"
                approval["rejectedBy"] = actor["email"]
                approval["rejectedAt"] = utc_now_iso()
                event_type = "approval.rejected"
            self.audit(approval["workflowId"], event_type, "user", actor["id"], f"Approval {approval['status']}.", {"approvalId": approval_id}, "candidate_visible")
            return deepcopy(approval)

    def require_approved(self, approval_id: str, workflow_id: str, action_types: set[str]) -> dict[str, Any]:
        approval = self._state["approvalRequests"].get(approval_id)
        if not approval:
            raise NotFoundError(approval_id)
        if approval["workflowId"] != workflow_id or approval["actionType"] not in action_types:
            raise ForbiddenError("Approval does not match this action")
        if approval["status"] != "approved":
            raise ForbiddenError("External action requires approved human approval")
        return approval

    def mark_approval_executed(self, approval_id: str) -> None:
        self._state["approvalRequests"][approval_id]["status"] = "executed"

    def save_schedule(self, workflow_id: str, approval_id: str, result: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            round_id = result.get("meetingId") or f"meeting_{uuid4().hex[:10]}"
            round_record = {
                "id": round_id,
                "workflowId": workflow_id,
                "roundNumber": len(self._state["interviewRounds"]) + 1,
                "scheduledStart": result.get("startDateTime"),
                "scheduledEnd": result.get("endDateTime"),
                "timezone": result.get("timeZone"),
                "meetingProvider": "google_meet",
                "calendarEventId": result.get("eventId"),
                "calendarHtmlLink": result.get("htmlLink"),
                "meetingJoinUrl": result.get("meetLink"),
                "notesStatus": "pending",
                "roundStatus": result.get("status", "scheduled"),
                "approvalId": approval_id,
                "traceId": result.get("traceId"),
                "createdAt": utc_now_iso(),
                "updatedAt": utc_now_iso(),
            }
            self._state["interviewRounds"][round_id] = round_record
            self.set_stage(workflow_id, "scheduled")
            self.mark_approval_executed(approval_id)
            self.integration_event(workflow_id, "google_calendar", "create_event", result.get("eventId"), {}, result, "succeeded", result.get("traceId"))
            self.audit(workflow_id, "google_calendar.event.created", "system", "google", "Google Meet interview scheduled.", {"approvalId": approval_id, "roundId": round_id}, "candidate_visible", result.get("traceId"))
            self._state["candidateReceipts"].append(
                {
                    "id": f"rcp_{uuid4().hex[:10]}",
                    "workflowId": workflow_id,
                    "receiptType": "interview_scheduled",
                    "summary": "Your interview was scheduled after HR approval.",
                    "sharedArtifacts": [],
                    "externalActions": [{"provider": "google_calendar", "eventId": result.get("eventId")}],
                    "createdAt": utc_now_iso(),
                }
            )
            return deepcopy(round_record)

    def schedule(self, workflow_id: str, candidate_visible: bool) -> dict[str, Any] | None:
        rounds = [deepcopy(r) for r in self._state["interviewRounds"].values() if r["workflowId"] == workflow_id]
        if not rounds:
            return None
        latest = sorted(rounds, key=lambda r: r["createdAt"])[-1]
        if candidate_visible:
            return {
                "roundId": latest["id"],
                "status": latest["roundStatus"],
                "startDateTime": latest["scheduledStart"],
                "endDateTime": latest["scheduledEnd"],
                "timeZone": latest["timezone"],
                "meetLink": latest["meetingJoinUrl"],
                "approvalId": latest["approvalId"],
            }
        return latest

    def add_notes(self, workflow_id: str, notes: str, visibility: str, actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            artifact = {
                "id": f"notes_{uuid4().hex[:10]}",
                "workflowId": workflow_id,
                "type": "interview_notes",
                "body": notes,
                "visibility": visibility,
                "createdBy": actor["id"],
                "createdAt": utc_now_iso(),
            }
            self._state.setdefault("notes", {})[artifact["id"]] = artifact
            self.set_stage(workflow_id, "notes_ready")
            self.audit(workflow_id, "artifact.uploaded.notes", "user", actor["id"], "Interview notes added.", {"artifactId": artifact["id"]}, "recruiter_internal")
            return deepcopy(artifact)

    def submit_addendum(self, workflow_id: str, round_id: str, body: str, addendum_type: str, sensitive: bool, actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            workflow = self.workflow(workflow_id)
            if actor["role"] == "interviewee" and workflow["candidateId"] != actor["id"]:
                raise ForbiddenError("Cannot submit addendum for another candidate")
            addendum = {
                "id": f"add_{uuid4().hex[:10]}",
                "workflowId": workflow_id,
                "roundId": round_id,
                "candidateId": actor["id"],
                "addendumType": addendum_type,
                "body": body,
                "sensitiveFlag": sensitive,
                "visibility": "recruiter_internal" if sensitive else "candidate_visible",
                "status": "submitted",
                "submittedAt": utc_now_iso(),
                "reviewedBy": None,
                "reviewedAt": None,
                "reviewNotes": None,
            }
            self._state["candidateAddenda"][addendum["id"]] = addendum
            self.set_stage(workflow_id, "addendum_window_open")
            self.audit(workflow_id, "candidate.addendum_submitted", "user", actor["id"], "Candidate submitted post-interview addendum.", {"addendumId": addendum["id"], "sensitive": sensitive}, "candidate_visible")
            self._state["candidateReceipts"].append(
                {
                    "id": f"rcp_{uuid4().hex[:10]}",
                    "workflowId": workflow_id,
                    "receiptType": "addendum_submitted",
                    "summary": "Your addendum was received and is awaiting HR review.",
                    "sharedArtifacts": [],
                    "externalActions": [],
                    "createdAt": utc_now_iso(),
                }
            )
            return deepcopy(addendum)

    def acknowledge_addendum(self, workflow_id: str, addendum_id: str, actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            addendum = self._state["candidateAddenda"].get(addendum_id)
            if not addendum or addendum["workflowId"] != workflow_id:
                raise NotFoundError(addendum_id)
            addendum["status"] = "acknowledged"
            addendum["reviewedBy"] = actor["email"]
            addendum["reviewedAt"] = utc_now_iso()
            self.audit(workflow_id, "candidate.addendum_acknowledged", "user", actor["id"], "HR acknowledged the candidate addendum.", {"addendumId": addendum_id}, "candidate_visible")
            return deepcopy(addendum)

    def addenda(self, workflow_id: str, actor_role: str) -> list[dict[str, Any]]:
        addenda = [deepcopy(a) for a in self._state["candidateAddenda"].values() if a["workflowId"] == workflow_id]
        if actor_role == "interviewee":
            return [
                {
                    "id": a["id"],
                    "roundId": a["roundId"],
                    "addendumType": a["addendumType"],
                    "body": a["body"],
                    "sensitiveFlag": a["sensitiveFlag"],
                    "status": a["status"],
                    "submittedAt": a["submittedAt"],
                    "reviewedAt": a["reviewedAt"],
                }
                for a in addenda
            ]
        return addenda

    def save_feedback_draft(self, workflow_id: str, subject: str, body: str, safety: dict[str, Any], actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            draft_id = f"draft_{uuid4().hex[:10]}"
            draft = {
                "id": draft_id,
                "workflowId": workflow_id,
                "channel": "gmail",
                "currentVersionId": f"{draft_id}_v1",
                "subject": subject,
                "body": body,
                "visibilityCheckStatus": "passed" if safety["passed"] else "blocked",
                "approvalId": None,
                "externalMessageId": None,
                "threadId": None,
                "status": "drafted",
                "versions": [
                    {
                        "id": f"{draft_id}_v1",
                        "versionNumber": 1,
                        "subject": subject,
                        "body": body,
                        "safetyCheck": safety,
                        "visibility": "candidate_visible",
                        "createdAt": utc_now_iso(),
                    }
                ],
                "createdAt": utc_now_iso(),
                "updatedAt": utc_now_iso(),
            }
            self._state["communicationDrafts"][draft_id] = draft
            self.set_stage(workflow_id, "follow_up_pending_approval")
            self.audit(workflow_id, "agent.feedback.generated", "user", actor["id"], "Candidate-safe feedback draft generated.", {"draftId": draft_id}, "recruiter_internal")
            return deepcopy(draft)

    def approved_feedback(self, workflow_id: str) -> dict[str, Any] | None:
        drafts = [d for d in self._state["communicationDrafts"].values() if d["workflowId"] == workflow_id and d["status"] in {"draft_created", "sent", "released"}]
        if not drafts:
            return None
        latest = sorted(drafts, key=lambda d: d["updatedAt"])[-1]
        return {"subject": latest["subject"], "body": latest["body"], "status": latest["status"]}

    def save_gmail_result(self, workflow_id: str, approval_id: str, result: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.mark_approval_executed(approval_id)
            draft = {
                "id": f"gmail_{uuid4().hex[:10]}",
                "workflowId": workflow_id,
                "channel": "gmail",
                "currentVersionId": None,
                "subject": result.get("subject"),
                "body": result.get("bodySummary", "Candidate-safe message approved."),
                "visibilityCheckStatus": "passed",
                "approvalId": approval_id,
                "externalMessageId": result.get("messageId") or result.get("draftId"),
                "threadId": result.get("threadId"),
                "status": "sent" if result.get("status") == "sent" else "draft_created",
                "versions": [],
                "createdAt": utc_now_iso(),
                "updatedAt": utc_now_iso(),
            }
            self._state["communicationDrafts"][draft["id"]] = draft
            self.integration_event(workflow_id, "gmail", result.get("operation", "draft"), result.get("messageId") or result.get("draftId"), {}, result, "succeeded", result.get("traceId"))
            self.audit(workflow_id, "gmail.message.sent" if result.get("status") == "sent" else "gmail.draft.created", "system", "gmail", "Approved candidate communication processed through Gmail.", {"approvalId": approval_id}, "candidate_visible", result.get("traceId"))
            return deepcopy(draft)

    def integration_event(self, workflow_id: str, provider: str, operation: str, external_id: str | None, request: dict[str, Any], response: dict[str, Any], status: str, trace_id: str | None) -> None:
        self._state["integrationEvents"].append(
            {
                "id": f"int_{uuid4().hex[:10]}",
                "workflowId": workflow_id,
                "provider": provider,
                "operation": operation,
                "externalId": external_id,
                "requestSummary": deepcopy(request),
                "responseSummary": deepcopy(response),
                "status": status,
                "traceId": trace_id,
                "createdAt": utc_now_iso(),
            }
        )

    def audit(self, workflow_id: str, event_type: str, actor_type: str, actor_id: str, summary: str, payload: dict[str, Any], visibility: str, trace_id: str | None = None) -> None:
        self._state["auditEvents"].append(
            {
                "id": f"aud_{uuid4().hex[:10]}",
                "workflowId": workflow_id,
                "eventType": event_type,
                "actorType": actor_type,
                "actorId": actor_id,
                "summary": summary,
                "payload": deepcopy(payload),
                "visibility": visibility,
                "traceId": trace_id or f"trc_{uuid4().hex[:10]}",
                "createdAt": utc_now_iso(),
            }
        )

    def timeline(self, workflow_id: str, candidate_visible: bool) -> list[dict[str, Any]]:
        events = [deepcopy(e) for e in self._state["auditEvents"] if e["workflowId"] == workflow_id]
        if candidate_visible:
            events = [e for e in events if e["visibility"] == "candidate_visible"]
            for event in events:
                event.pop("payload", None)
        return sorted(events, key=lambda e: e["createdAt"])

    def set_stage(self, workflow_id: str, stage: str) -> None:
        workflow = self.workflow(workflow_id)
        if workflow["stage"] != stage:
            workflow["stage"] = stage
            workflow["updatedAt"] = datetime.now(timezone.utc).isoformat()
