from __future__ import annotations

import json
import secrets
import sqlite3
import threading
from contextlib import closing
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from supwork_backend.round_templates import round_template_payload
from supwork_backend.seed import demo_state, utc_now_iso

STAGE_ALIASES = {
    "scheduled": "interview_scheduled",
    "interview_complete": "interview_completed",
}

ROUND_COMPLETE_STATUSES = {"complete", "completed", "interview_completed", "supplement_submitted", "reviewed"}
ROUND_OPEN_STATUSES = {"ready", "pre_interview", "questions_ready", "scheduled", "transcript_ready"}


class NotFoundError(KeyError):
    pass


class ForbiddenError(PermissionError):
    pass


class InMemoryStore:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._state = demo_state()

    def reset_demo(self, keep_tokens: bool = True) -> dict[str, Any]:
        with self._lock:
            tokens = deepcopy(self._state.get("tokens", {})) if keep_tokens else {}
            self._state = demo_state()
            self._state["tokens"] = tokens
            return {"status": "reset", "workflowIds": list(self._state["workflows"].keys())}

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
        workflow["stage"] = self.normalize_stage(workflow.get("stage", "created"))
        return workflow

    def normalize_stage(self, stage: str) -> str:
        return STAGE_ALIASES.get(stage, stage)

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
                "stage": self.normalize_stage(workflow["stage"]),
                "providerMode": workflow.get("providerMode", "mock"),
                "statusSummary": workflow["statusSummary"],
                "timeline": self.timeline(workflow_id, candidate_visible=True),
                "sourceArtifacts": self.source_artifacts(workflow_id, candidate_visible=True),
                "evidenceSummary": [
                    deepcopy(item)
                    for item in self._state["evidenceMappings"]
                    if item["workflowId"] == workflow_id and item["visibility"] == "candidate_visible"
                ],
                "roleBrief": self.candidate_research(workflow_id),
                "agentFilledFields": deepcopy(self._state.get("agentFilledFields", {}).get(workflow_id)),
                "schedule": self.schedule(workflow_id, candidate_visible=True),
                "rounds": self.rounds(workflow_id, actor_role="interviewee"),
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
                "stage": self.normalize_stage(workflow["stage"]),
                "providerMode": workflow.get("providerMode", "mock"),
                "statusSummary": workflow["statusSummary"],
                "sourceArtifacts": self.source_artifacts(workflow_id, candidate_visible=False),
                "evidenceMappings": [deepcopy(item) for item in self._state["evidenceMappings"] if item["workflowId"] == workflow_id],
                "researchArtifacts": self.research(workflow_id),
                "interviewPlan": deepcopy(self._state["interviewPlans"].get(workflow_id)),
                "agentFilledFields": deepcopy(self._state.get("agentFilledFields", {}).get(workflow_id)),
                "schedule": self.schedule(workflow_id, candidate_visible=False),
                "rounds": self.rounds(workflow_id, actor_role="hr"),
                "candidateAddenda": self.addenda(workflow_id, actor_role="hr"),
                "approvals": [deepcopy(a) for a in self._state["approvalRequests"].values() if a["workflowId"] == workflow_id],
                "draftHistory": [deepcopy(d) for d in self._state["communicationDrafts"].values() if d["workflowId"] == workflow_id],
                "integrationEvents": [deepcopy(e) for e in self._state["integrationEvents"] if e["workflowId"] == workflow_id],
                "auditEvents": self.timeline(workflow_id, candidate_visible=False),
            }

    def analyze_evidence(self, workflow_id: str, actor: dict[str, Any], provider_mode: str = "mock") -> dict[str, Any]:
        with self._lock:
            workflow = self.workflow(workflow_id)
            role = self._state["roles"][workflow["roleId"]]
            evidence = [deepcopy(item) for item in self._state["evidenceMappings"] if item["workflowId"] == workflow_id]
            gaps = [item for item in evidence if item.get("status") in {"partial", "gap", "unclear"}]
            trace_id = f"trc_{uuid4().hex[:10]}"
            job_scope = role.get("jobScopeText", "")
            rubric_tags = [part.strip() for part in job_scope.split(",") if part.strip()]
            agent_filled = {
                "workflowId": workflow_id,
                "traceId": trace_id,
                "providerMode": provider_mode,
                "dataSource": "backend_generated",
                "generatedAt": utc_now_iso(),
                "roleBrief": {
                    "jobPoints": [
                        "Customer-facing AI deployment with clear rollout ownership.",
                        "Hands-on Python/API implementation plus LLM evaluation habits.",
                        "Stakeholder communication across technical and business teams.",
                    ],
                    "rubricTags": rubric_tags,
                    "interviewFocus": [item["requirement"] for item in gaps[:4]],
                    "source": "role_scope_and_cv_evidence",
                },
                "evidenceMappings": evidence,
                "nextHumanAction": "review_evidence_and_generate_interview_plan" if gaps else "approve_schedule_interview",
                "requiresHumanApproval": True,
            }
            self._state.setdefault("agentFilledFields", {})[workflow_id] = agent_filled
            workflow["providerMode"] = provider_mode
            workflow["statusSummary"] = "Evidence mapped by the backend; recruiter can review source-backed gaps and generate the interview plan."
            self.set_stage(workflow_id, "evidence_mapped")
            self.record_agent_run(
                workflow_id=workflow_id,
                trace_id=trace_id,
                agent_name="supwork-evidence-agent",
                mode="analyze_evidence",
                provider=provider_mode,
                input_summary="Map CV evidence to role requirements.",
                output_summary={
                    "evidenceCount": len(evidence),
                    "gapCount": len(gaps),
                    "nextHumanAction": agent_filled["nextHumanAction"],
                },
                status="completed",
            )
            self.audit(
                workflow_id,
                "agent.evidence.completed",
                "system",
                "supwork-evidence-agent",
                "Evidence analysis refreshed and stored as agent-filled fields.",
                {"traceId": trace_id, "gapCount": len(gaps)},
                "candidate_visible",
                trace_id,
            )
            return deepcopy(agent_filled)

    def save_cv_analysis(
        self,
        workflow_id: str,
        actor: dict[str, Any],
        cv_artifact: dict[str, Any],
        analysis: dict[str, Any],
        provider_mode: str,
        job_scope_text: str | None = None,
    ) -> dict[str, Any]:
        with self._lock:
            workflow = self.workflow(workflow_id)
            role = self._state["roles"][workflow["roleId"]]
            if job_scope_text and job_scope_text.strip():
                role["jobScopeText"] = job_scope_text.strip()

            artifact = deepcopy(cv_artifact)
            artifact["workflowId"] = workflow_id
            artifact["uploadedBy"] = actor["id"]
            artifact["visibility"] = "candidate_visible"
            artifact["uploadedAt"] = utc_now_iso()
            self._state.setdefault("sourceArtifacts", {})[artifact["id"]] = artifact

            mappings = [
                self._evidence_mapping_from_model(workflow_id, artifact["id"], index, raw)
                for index, raw in enumerate(analysis.get("evidenceMappings", []), start=1)
                if isinstance(raw, dict)
            ]
            if not mappings:
                raise ValueError("Model did not return any evidence mappings")

            self._state["evidenceMappings"] = [
                item
                for item in self._state["evidenceMappings"]
                if item["workflowId"] != workflow_id or item.get("visibility") != "candidate_visible"
            ] + mappings

            trace_id = f"trc_{uuid4().hex[:10]}"
            agent_filled = {
                "workflowId": workflow_id,
                "traceId": trace_id,
                "providerMode": provider_mode,
                "dataSource": "uploaded_cv_pdf",
                "generatedAt": utc_now_iso(),
                "cvSource": {
                    "artifactId": artifact["id"],
                    "filename": artifact["filename"],
                    "pageCount": artifact["pageCount"],
                    "parser": artifact.get("parser", "pypdf"),
                },
                "roleBrief": analysis.get("roleBrief", {}),
                "evidenceMappings": deepcopy(mappings),
                "candidatePrepThemes": deepcopy(analysis.get("candidatePrepThemes", [])),
                "nextHumanAction": analysis.get("nextHumanAction", "review_evidence_and_generate_interview_plan"),
                "requiresHumanApproval": True,
            }
            self._state.setdefault("agentFilledFields", {})[workflow_id] = agent_filled
            workflow["providerMode"] = provider_mode
            workflow["statusSummary"] = "Uploaded CV parsed and mapped to role requirements; recruiter can review highlighted evidence and generate interview questions."
            self.set_stage(workflow_id, "evidence_mapped")
            self.record_agent_run(
                workflow_id=workflow_id,
                trace_id=trace_id,
                agent_name="supwork-cv-evidence-agent",
                mode="parse_pdf_and_map_evidence",
                provider=provider_mode,
                input_summary=f"Parsed {artifact['filename']} with {artifact['pageCount']} page(s) against role scope.",
                output_summary={
                    "artifactId": artifact["id"],
                    "evidenceCount": len(mappings),
                    "gapCount": len([item for item in mappings if item.get("status") in {"partial", "gap", "unclear"}]),
                },
                status="completed",
            )
            self.audit(
                workflow_id,
                "agent.cv_upload_evidence.completed",
                "user",
                actor["id"],
                "Uploaded CV parsed and mapped to role requirements.",
                {"artifactId": artifact["id"], "traceId": trace_id, "evidenceCount": len(mappings)},
                "candidate_visible",
                trace_id,
            )
            self._state["candidateReceipts"].append(
                {
                    "id": f"rcp_{uuid4().hex[:10]}",
                    "workflowId": workflow_id,
                    "receiptType": "cv_uploaded_and_mapped",
                    "summary": "Your CV was parsed and mapped to role requirements with source labels.",
                    "sharedArtifacts": [{"type": "cv", "artifactId": artifact["id"], "filename": artifact["filename"]}],
                    "externalActions": [],
                    "createdAt": utc_now_iso(),
                }
            )
            return {"artifact": deepcopy(artifact), "analysis": deepcopy(agent_filled)}

    def source_artifacts(self, workflow_id: str, candidate_visible: bool) -> list[dict[str, Any]]:
        artifacts = [
            deepcopy(item)
            for item in self._state.get("sourceArtifacts", {}).values()
            if item["workflowId"] == workflow_id
        ]
        artifacts = sorted(artifacts, key=lambda item: (item.get("uploadedAt") or "", bool(item.get("liveData"))), reverse=True)
        if not candidate_visible:
            return artifacts
        return [item for item in artifacts if item.get("visibility") == "candidate_visible"]

    def rounds(self, workflow_id: str, actor_role: str) -> list[dict[str, Any]]:
        records = [
            deepcopy(record)
            for record in self._state["interviewRounds"].values()
            if record["workflowId"] == workflow_id
        ]
        return [self._round_payload(record, actor_role) for record in sorted(records, key=self._round_sort_key)]

    def round(self, workflow_id: str, round_id: str, actor_role: str) -> dict[str, Any]:
        record = self._state["interviewRounds"].get(round_id)
        if not record or record["workflowId"] != workflow_id:
            raise NotFoundError(round_id)
        return self._round_payload(record, actor_role)

    def active_round(self, workflow_id: str) -> dict[str, Any]:
        records = self._round_records(workflow_id)
        for record in records:
            status = record.get("roundStatus", "locked")
            if status != "locked" and status not in ROUND_COMPLETE_STATUSES:
                return deepcopy(record)
        for record in records:
            if record.get("roundStatus") == "locked":
                return deepcopy(record)
        if records:
            return deepcopy(records[-1])
        raise NotFoundError("No interview rounds")

    def save_round_interview_plan(self, workflow_id: str, round_id: str, plan: dict[str, Any], actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            round_record = self._state["interviewRounds"].get(round_id)
            if not round_record or round_record["workflowId"] != workflow_id:
                raise NotFoundError(round_id)
            if round_record.get("roundStatus") == "locked":
                raise ForbiddenError("Generate or review the previous round before this round is unlocked")

            plan = deepcopy(plan)
            plan.setdefault("id", f"plan_{uuid4().hex[:10]}")
            plan["workflowId"] = workflow_id
            plan["roundId"] = round_id
            plan["roundNumber"] = round_record.get("roundNumber")
            plan["roundType"] = round_record.get("roundType")
            questions = self._normalize_round_questions(plan, round_record)
            round_record["questions"] = questions
            round_record["candidatePrep"] = [str(item) for item in plan.get("candidatePrepThemes", [])][:6]
            round_record["generatedPlanId"] = plan["id"]
            round_record["reviewStatus"] = "questions_ready"
            round_record["nextHumanAction"] = "schedule_round" if not round_record.get("scheduledStart") else "conduct_round"
            if round_record.get("roundStatus") in {"ready", "pre_interview", "not_started"}:
                round_record["roundStatus"] = "questions_ready"
            round_record["updatedAt"] = utc_now_iso()
            self._state["interviewPlans"][workflow_id] = plan
            self.set_stage(workflow_id, "interview_planning")
            trace_id = f"trc_{uuid4().hex[:10]}"
            self.record_agent_run(
                workflow_id=workflow_id,
                trace_id=trace_id,
                agent_name="supwork-question-agent",
                mode=f"generate_round_{round_record.get('roundNumber')}_questions",
                provider=plan.get("provider", "model-or-fixture"),
                input_summary=f"Generate questions for {round_record.get('title', round_id)}.",
                output_summary={"planId": plan["id"], "roundId": round_id, "questionCount": len(questions)},
                status="completed",
            )
            self.audit(
                workflow_id,
                "agent.round_questions.generated",
                "user",
                actor["id"],
                "Round-specific interview questions generated and stored.",
                {"planId": plan["id"], "roundId": round_id},
                "recruiter_internal",
                trace_id,
            )
            response = deepcopy(plan)
            response["questions"] = deepcopy(questions)
            response["plan"] = deepcopy(plan)
            response["round"] = self._round_payload(round_record, actor.get("role", "hr"))
            return response

    def save_round_transcript(
        self,
        workflow_id: str,
        round_id: str,
        transcript_text: str,
        source_type: str,
        provider: str,
        visibility: str,
        actor: dict[str, Any],
    ) -> dict[str, Any]:
        with self._lock:
            round_record = self._state["interviewRounds"].get(round_id)
            if not round_record or round_record["workflowId"] != workflow_id:
                raise NotFoundError(round_id)
            if not transcript_text.strip():
                raise ValueError("Transcript text is required")

            artifact_id = f"trn_{uuid4().hex[:10]}"
            artifact = {
                "id": artifact_id,
                "workflowId": workflow_id,
                "filename": f"{round_id}_{source_type}_transcript.md",
                "artifactType": "interview_transcript",
                "sourceType": source_type,
                "contentType": "text/markdown",
                "visibility": visibility,
                "provider": provider,
                "liveData": source_type == "live",
                "roundId": round_id,
                "pageCount": 1,
                "pages": [{"page": 1, "text": transcript_text, "charCount": len(transcript_text)}],
                "uploadedBy": actor["id"],
                "uploadedAt": utc_now_iso(),
            }
            self._state.setdefault("sourceArtifacts", {})[artifact_id] = artifact
            evidence = self._transcript_evidence_from_text(round_record, transcript_text, source_type)
            existing = [
                item
                for item in round_record.get("transcriptEvidence", [])
                if item.get("sourceType") != source_type
            ]
            round_record["transcriptEvidence"] = existing + evidence
            round_record["transcriptArtifactId"] = artifact_id
            round_record["notesStatus"] = "transcript_stored"
            if round_record.get("roundStatus") == "scheduled":
                round_record["roundStatus"] = "transcript_ready"
            round_record["nextHumanAction"] = "review_transcript_and_complete_round"
            round_record["updatedAt"] = utc_now_iso()
            self.audit(
                workflow_id,
                "interview.transcript.stored",
                "user",
                actor["id"],
                "Interview transcript artifact stored for round review.",
                {"roundId": round_id, "artifactId": artifact_id, "sourceType": source_type},
                "candidate_visible" if source_type == "live" else "recruiter_internal",
            )
            if source_type == "live":
                self._state["candidateReceipts"].append(
                    {
                        "id": f"rcp_{uuid4().hex[:10]}",
                        "workflowId": workflow_id,
                        "receiptType": "transcript_stored",
                        "summary": "A live interview transcript artifact was stored for HR review. Internal notes and interpretations are not automatically released.",
                        "sharedArtifacts": [{"type": "transcript", "roundId": round_id}],
                        "externalActions": [],
                        "createdAt": utc_now_iso(),
                    }
                )
            return {"artifact": deepcopy(artifact), "round": self._round_payload(round_record, actor.get("role", "hr"))}

    def review_round(self, workflow_id: str, round_id: str, summary: str, outcome: str, actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            round_record = self._state["interviewRounds"].get(round_id)
            if not round_record or round_record["workflowId"] != workflow_id:
                raise NotFoundError(round_id)
            if round_record.get("roundStatus") not in ROUND_COMPLETE_STATUSES:
                raise ForbiddenError("Round review requires a completed round")
            round_record["reviewStatus"] = outcome
            round_record["reviewSummary"] = summary
            round_record["reviewedBy"] = actor["email"]
            round_record["reviewedAt"] = utc_now_iso()
            round_record["roundStatus"] = "reviewed"
            round_record["nextHumanAction"] = "generate_next_round_questions"
            round_record["updatedAt"] = utc_now_iso()
            next_round = self._unlock_next_round(workflow_id, round_record)
            self.set_stage(workflow_id, "interview_planning" if next_round else "notes_ready")
            self.audit(
                workflow_id,
                "interview.round.reviewed",
                "user",
                actor["id"],
                "Round review stored and next round unlocked where applicable.",
                {"roundId": round_id, "outcome": outcome, "nextRoundId": next_round.get("id") if next_round else None},
                "recruiter_internal",
            )
            return {"round": self._round_payload(round_record, actor.get("role", "hr")), "nextRound": deepcopy(next_round)}

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
            trace_id = f"trc_{uuid4().hex[:10]}"
            self.record_agent_run(
                workflow_id=artifact["workflowId"],
                trace_id=trace_id,
                agent_name="supwork-research-agent",
                mode=f"research_{artifact.get('researchType', 'company')}",
                provider=str(artifact.get("provider", "fixture")),
                input_summary=str(artifact.get("query", "public role/company research")),
                output_summary={"researchId": artifact["id"], "sourceCount": len(artifact.get("sources", []))},
                status="completed",
            )
            self.audit(artifact["workflowId"], "agent.research.completed", "system", "research", "Research artifact stored.", {"researchId": artifact["id"]}, "recruiter_internal", trace_id)
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
            trace_id = f"trc_{uuid4().hex[:10]}"
            self.record_agent_run(
                workflow_id=workflow_id,
                trace_id=trace_id,
                agent_name="supwork-question-agent",
                mode="generate_interview_plan",
                provider=plan.get("provider", "model-or-fixture"),
                input_summary="Generate interview questions from evidence gaps.",
                output_summary={"planId": plan["id"], "questionCount": len(plan.get("questions", []))},
                status="completed",
            )
            self.audit(workflow_id, "agent.questions.generated", "system", "model", "Interview plan generated.", {"planId": plan["id"]}, "recruiter_internal", trace_id)
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
            approval = self._state["approvalRequests"].get(approval_id, {})
            requested_round_id = approval.get("proposedPayload", {}).get("roundId")
            round_record = self._round_for_schedule(workflow_id, requested_round_id)
            round_record["scheduledStart"] = result.get("startDateTime")
            round_record["scheduledEnd"] = result.get("endDateTime")
            round_record["timezone"] = result.get("timeZone")
            round_record["meetingProvider"] = "google_meet"
            round_record["calendarEventId"] = result.get("eventId")
            round_record["calendarHtmlLink"] = result.get("htmlLink")
            round_record["meetingJoinUrl"] = result.get("meetLink")
            round_record["notesStatus"] = "pending"
            round_record["roundStatus"] = "scheduled"
            round_record["approvalId"] = approval_id
            round_record["traceId"] = result.get("traceId")
            round_record["meetingId"] = result.get("meetingId")
            round_record["nextHumanAction"] = "conduct_round"
            round_record["updatedAt"] = utc_now_iso()
            self.set_stage(workflow_id, "interview_scheduled")
            self.mark_approval_executed(approval_id)
            self.integration_event(workflow_id, "google_calendar", "create_event", result.get("eventId"), {}, result, "succeeded", result.get("traceId"))
            self.audit(workflow_id, "google_calendar.event.created", "system", "google", "Google Meet interview scheduled.", {"approvalId": approval_id, "roundId": round_record["id"]}, "candidate_visible", result.get("traceId"))
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
            return self._round_payload(round_record, "hr")

    def schedule(self, workflow_id: str, candidate_visible: bool) -> dict[str, Any] | None:
        rounds = [
            deepcopy(r)
            for r in self._state["interviewRounds"].values()
            if r["workflowId"] == workflow_id and (r.get("scheduledStart") or r.get("meetingJoinUrl") or r.get("roundStatus") in {"scheduled", "transcript_ready", "interview_completed", "supplement_submitted", "reviewed"})
        ]
        if not rounds:
            return None
        latest = sorted(rounds, key=lambda r: (r.get("scheduledStart") or "", r.get("roundNumber", 0)))[-1]
        if candidate_visible:
            return {
                "roundId": latest["id"],
                "status": latest["roundStatus"],
                "startDateTime": latest.get("scheduledStart"),
                "endDateTime": latest.get("scheduledEnd"),
                "timeZone": latest.get("timezone"),
                "meetLink": latest.get("meetingJoinUrl"),
                "approvalId": latest.get("approvalId"),
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

    def complete_round(self, workflow_id: str, round_id: str, notes: str, visibility: str, actor: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            round_record = self._state["interviewRounds"].get(round_id)
            if not round_record or round_record["workflowId"] != workflow_id:
                raise NotFoundError(round_id)
            notes_artifact = self.add_notes(workflow_id, notes, visibility, actor) if notes.strip() else None
            round_record["roundStatus"] = "complete"
            round_record["notesStatus"] = "added" if notes_artifact else "pending"
            if notes_artifact:
                round_record.setdefault("transcriptEvidence", []).append(
                    {
                        "id": f"manual_{uuid4().hex[:10]}",
                        "title": "Manual interviewer note",
                        "body": notes[:800],
                        "kind": "manual",
                        "sourceType": "manual_note",
                        "sourceLabel": "Recruiter note",
                        "statusLabel": "Needs review",
                        "visibility": visibility,
                    }
                )
            round_record["nextHumanAction"] = "candidate_addendum_window"
            round_record["updatedAt"] = utc_now_iso()
            self.set_stage(workflow_id, "interview_completed")
            next_round = self._unlock_next_round(workflow_id, round_record)
            trace_id = f"trc_{uuid4().hex[:10]}"
            self.audit(
                workflow_id,
                "interview.round.completed",
                "user",
                actor["id"],
                "Interview round marked complete; candidate addendum window is open.",
                {
                    "roundId": round_id,
                    "notesArtifactId": notes_artifact["id"] if notes_artifact else None,
                    "nextRoundId": next_round.get("id") if next_round else None,
                },
                "candidate_visible",
                trace_id,
            )
            self._state["candidateReceipts"].append(
                {
                    "id": f"rcp_{uuid4().hex[:10]}",
                    "workflowId": workflow_id,
                    "receiptType": "addendum_window_open",
                    "summary": "The interview round is complete. You may add optional context before HR finalizes next steps.",
                    "sharedArtifacts": [],
                    "externalActions": [],
                    "createdAt": utc_now_iso(),
                }
            )
            return {"round": self._round_payload(round_record, actor.get("role", "hr")), "notes": deepcopy(notes_artifact), "nextRound": deepcopy(next_round)}

    def submit_addendum(
        self,
        workflow_id: str,
        round_id: str,
        body: str,
        addendum_type: str,
        sensitive: bool,
        actor: dict[str, Any],
        attachments: list[dict[str, Any]] | None = None,
        links: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        with self._lock:
            workflow = self.workflow(workflow_id)
            if actor["role"] != "interviewee":
                raise ForbiddenError("Candidate role required for addendum submission")
            if workflow["candidateId"] != actor["id"]:
                raise ForbiddenError("Cannot submit addendum for another candidate")
            round_record = self._state["interviewRounds"].get(round_id)
            if not round_record or round_record["workflowId"] != workflow_id:
                raise NotFoundError(round_id)
            if round_record.get("roundStatus") not in ROUND_COMPLETE_STATUSES:
                raise ForbiddenError("Post-interview addendum requires the interview round to be complete")
            stored_attachments = self._metadata_items(attachments or [], "att")
            stored_links = self._metadata_items(links or [], "link")
            addendum = {
                "id": f"add_{uuid4().hex[:10]}",
                "workflowId": workflow_id,
                "roundId": round_id,
                "candidateId": actor["id"],
                "addendumType": addendum_type,
                "body": body,
                "sensitiveFlag": sensitive,
                "attachments": stored_attachments,
                "links": stored_links,
                "visibility": "recruiter_internal" if sensitive else "candidate_visible",
                "status": "submitted",
                "submittedAt": utc_now_iso(),
                "reviewedBy": None,
                "reviewedAt": None,
                "reviewNotes": None,
                "candidateVisibleReceipt": "Your addendum was received and is awaiting HR review.",
            }
            self._state["candidateAddenda"][addendum["id"]] = addendum
            round_record["roundStatus"] = "supplement_submitted"
            round_record["nextHumanAction"] = "review_addendum"
            round_record["updatedAt"] = utc_now_iso()
            self.set_stage(workflow_id, "addendum_window_open")
            self.audit(
                workflow_id,
                "candidate.addendum_submitted",
                "user",
                actor["id"],
                "Candidate submitted post-interview addendum.",
                {
                    "addendumId": addendum["id"],
                    "sensitive": sensitive,
                    "attachmentCount": len(stored_attachments),
                    "linkCount": len(stored_links),
                },
                "candidate_visible",
            )
            self._state["candidateReceipts"].append(
                {
                    "id": f"rcp_{uuid4().hex[:10]}",
                    "workflowId": workflow_id,
                    "receiptType": "addendum_submitted",
                    "summary": "Your addendum was received and is awaiting HR review.",
                    "sharedArtifacts": [
                        {"type": "attachment", "name": item.get("name") or item.get("filename")}
                        for item in stored_attachments
                    ]
                    + [{"type": "link", "label": item.get("label"), "url": item.get("url")} for item in stored_links],
                    "externalActions": [],
                    "createdAt": utc_now_iso(),
                }
            )
            return deepcopy(addendum)

    def acknowledge_addendum(
        self,
        workflow_id: str,
        addendum_id: str,
        actor: dict[str, Any],
        review_note: str | None = None,
        review_status: str = "acknowledged",
    ) -> dict[str, Any]:
        with self._lock:
            addendum = self._state["candidateAddenda"].get(addendum_id)
            if not addendum or addendum["workflowId"] != workflow_id:
                raise NotFoundError(addendum_id)
            addendum["status"] = review_status
            addendum["reviewedBy"] = actor["email"]
            addendum["reviewedAt"] = utc_now_iso()
            addendum["reviewNotes"] = review_note
            addendum["candidateVisibleReceipt"] = "HR reviewed your addendum." if review_status != "acknowledged" else "HR acknowledged your addendum."
            round_record = self._state["interviewRounds"].get(addendum["roundId"])
            if round_record and round_record["workflowId"] == workflow_id:
                round_record["reviewStatus"] = f"addendum_{review_status}"
                if round_record.get("roundStatus") == "supplement_submitted":
                    round_record["roundStatus"] = "reviewed"
                round_record["nextHumanAction"] = "generate_next_round_questions"
                round_record["updatedAt"] = utc_now_iso()
                next_round = self._unlock_next_round(workflow_id, round_record)
                self.set_stage(workflow_id, "interview_planning" if next_round else "notes_ready")
            else:
                next_round = None
            self.audit(
                workflow_id,
                "candidate.addendum_acknowledged",
                "user",
                actor["id"],
                "HR acknowledged the candidate addendum.",
                {
                    "addendumId": addendum_id,
                    "reviewStatus": review_status,
                    "hasReviewNote": bool(review_note),
                    "nextRoundId": next_round.get("id") if next_round else None,
                },
                "candidate_visible",
            )
            self._state["candidateReceipts"].append(
                {
                    "id": f"rcp_{uuid4().hex[:10]}",
                    "workflowId": workflow_id,
                    "receiptType": "addendum_acknowledged",
                    "summary": addendum["candidateVisibleReceipt"],
                    "sharedArtifacts": [{"type": "addendum", "id": addendum_id, "status": review_status}],
                    "externalActions": [],
                    "createdAt": utc_now_iso(),
                }
            )
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
                    "attachments": deepcopy(a.get("attachments", [])),
                    "links": deepcopy(a.get("links", [])),
                    "status": a["status"],
                    "submittedAt": a["submittedAt"],
                    "reviewedAt": a["reviewedAt"],
                    "candidateVisibleReceipt": a.get("candidateVisibleReceipt"),
                }
                for a in addenda
            ]
        return addenda

    def _metadata_items(self, items: list[dict[str, Any]], prefix: str) -> list[dict[str, Any]]:
        stored: list[dict[str, Any]] = []
        for item in items:
            metadata = deepcopy(item)
            metadata.setdefault("id", f"{prefix}_{uuid4().hex[:10]}")
            metadata.setdefault("createdAt", utc_now_iso())
            metadata.setdefault("storageStatus", "metadata_only")
            metadata.pop("content", None)
            metadata.pop("bytes", None)
            stored.append(metadata)
        return stored

    def _round_records(self, workflow_id: str) -> list[dict[str, Any]]:
        records = [record for record in self._state["interviewRounds"].values() if record["workflowId"] == workflow_id]
        return sorted(records, key=self._round_sort_key)

    def _round_sort_key(self, record: dict[str, Any]) -> tuple[int, str]:
        return (int(record.get("roundNumber") or 999), str(record.get("id") or ""))

    def _round_payload(self, record: dict[str, Any], actor_role: str) -> dict[str, Any]:
        payload = round_template_payload(record)
        payload["status"] = payload.get("roundStatus", "locked")
        payload["candidatePrepThemes"] = payload.get("candidatePrep") or payload.get("candidatePrepThemes") or payload.get("template", {}).get("candidatePrepThemes", [])
        payload["questions"] = [self._round_question_payload(item) for item in payload.get("questions", [])]
        payload["transcriptEvidence"] = [deepcopy(item) for item in payload.get("transcriptEvidence", [])]
        if actor_role == "interviewee":
            payload.pop("hrBriefing", None)
            payload.pop("reviewSummary", None)
            payload.pop("reviewedBy", None)
            payload["questions"] = [item for item in payload["questions"] if item.get("visibility") == "candidate_visible"]
            payload["transcriptEvidence"] = [
                item for item in payload["transcriptEvidence"] if item.get("visibility") == "candidate_visible"
            ]
            payload["template"] = {
                "roundNumber": payload.get("roundNumber"),
                "roundType": payload.get("roundType"),
                "title": payload.get("title"),
                "candidateBriefing": payload.get("candidateBriefing"),
                "candidatePrepThemes": payload.get("candidatePrepThemes", []),
                "answerShape": payload.get("answerShape", []),
                "addendumPrompt": payload.get("addendumPrompt"),
                "nextAction": payload.get("nextAction"),
            }
        return deepcopy(payload)

    def _round_question_payload(self, raw: dict[str, Any]) -> dict[str, Any]:
        item = deepcopy(raw)
        item.setdefault("id", f"q_{uuid4().hex[:10]}")
        item.setdefault("prompt", item.get("question") or "Walk through one relevant example.")
        item.setdefault("question", item["prompt"])
        item.setdefault("visibility", "recruiter_internal")
        return item

    def _round_for_schedule(self, workflow_id: str, requested_round_id: str | None = None) -> dict[str, Any]:
        if requested_round_id:
            requested = self._state["interviewRounds"].get(str(requested_round_id))
            if requested and requested["workflowId"] == workflow_id and requested.get("roundStatus") != "locked":
                return requested
        for record in self._round_records(workflow_id):
            status = record.get("roundStatus", "locked")
            if status in ROUND_OPEN_STATUSES:
                return record
        for record in self._round_records(workflow_id):
            if record.get("roundStatus") == "locked":
                record["roundStatus"] = "ready"
                record["nextHumanAction"] = f"generate_r{record.get('roundNumber')}_questions"
                record["updatedAt"] = utc_now_iso()
                return record
        raise NotFoundError("No schedulable interview round")

    def _normalize_round_questions(self, plan: dict[str, Any], round_record: dict[str, Any]) -> list[dict[str, Any]]:
        raw_questions = plan.get("questions") if isinstance(plan.get("questions"), list) else []
        if not raw_questions:
            raw_questions = [{"question": item} for item in round_record.get("fallbackQuestions", [])]
        normalized: list[dict[str, Any]] = []
        for index, raw in enumerate(raw_questions[:8], start=1):
            item = raw if isinstance(raw, dict) else {"question": str(raw)}
            prompt = str(item.get("prompt") or item.get("question") or f"Round {round_record.get('roundNumber')} question {index}")
            normalized.append(
                {
                    "id": str(item.get("id") or f"q_{uuid4().hex[:10]}"),
                    "prompt": prompt,
                    "question": prompt,
                    "rationale": str(item.get("rationale") or "Generated from current evidence and round focus."),
                    "expectedSignal": str(item.get("expectedSignal") or item.get("strongSignal") or "Specific, role-related evidence."),
                    "evidenceTarget": str(item.get("evidenceTarget") or item.get("competency") or round_record.get("roundType") or "Role evidence"),
                    "followUp": str(item.get("followUp") or ""),
                    "visibility": str(item.get("visibility") or "recruiter_internal"),
                    "source": str(item.get("source") or plan.get("provider") or "model-or-fixture"),
                }
            )
        return normalized

    def _unlock_next_round(self, workflow_id: str, current_round: dict[str, Any]) -> dict[str, Any] | None:
        current_number = int(current_round.get("roundNumber") or 0)
        for record in self._round_records(workflow_id):
            if int(record.get("roundNumber") or 0) <= current_number:
                continue
            if record.get("roundStatus") == "locked":
                record["roundStatus"] = "ready"
                record["nextHumanAction"] = f"generate_r{record.get('roundNumber')}_questions"
                record["updatedAt"] = utc_now_iso()
            return deepcopy(record)
        return None

    def _transcript_evidence_from_text(self, round_record: dict[str, Any], transcript_text: str, source_type: str) -> list[dict[str, Any]]:
        candidate_lines = [
            line.split(":", 1)[1].strip()
            for line in transcript_text.splitlines()
            if line.strip().lower().startswith("candidate:") and ":" in line
        ]
        if not candidate_lines:
            candidate_lines = [transcript_text.strip()[:500]]
        evidence: list[dict[str, Any]] = []
        for index, body in enumerate(candidate_lines[:5], start=1):
            evidence.append(
                {
                    "id": f"tev_{uuid4().hex[:10]}",
                    "title": f"Candidate transcript excerpt {index}",
                    "body": body[:800],
                    "kind": "transcript",
                    "sourceType": source_type,
                    "sourceLabel": "Live transcript" if source_type == "live" else "TalentFlow placeholder",
                    "statusLabel": "Live" if source_type == "live" else "Placeholder",
                    "visibility": "interviewer_internal",
                    "roundNumber": round_record.get("roundNumber"),
                }
            )
        return evidence

    def _evidence_mapping_from_model(self, workflow_id: str, artifact_id: str, index: int, raw: dict[str, Any]) -> dict[str, Any]:
        status = str(raw.get("status") or "unclear").lower()
        if status not in {"covered", "partial", "gap", "unclear"}:
            status = "unclear"
        visibility = str(raw.get("visibility") or "candidate_visible")
        if visibility not in {"candidate_visible", "recruiter_internal", "interviewer_internal"}:
            visibility = "candidate_visible"
        source_location = raw.get("sourceLocation") if isinstance(raw.get("sourceLocation"), dict) else {}
        return {
            "id": f"ev_live_{uuid4().hex[:10]}",
            "workflowId": workflow_id,
            "requirement": str(raw.get("requirement") or f"Role requirement {index}"),
            "status": status,
            "candidateEvidence": str(raw.get("candidateEvidence") or raw.get("evidence") or ""),
            "sourceArtifactId": artifact_id,
            "sourceLocation": {
                "page": source_location.get("page") or index,
                "section": str(source_location.get("section") or "Uploaded CV"),
                "excerpt": str(source_location.get("excerpt") or raw.get("candidateEvidence") or "")[:600],
            },
            "whyItMatters": str(raw.get("whyItMatters") or "This requirement appears in the target role scope."),
            "candidateAction": str(raw.get("candidateAction") or raw.get("whatToAdd") or "Add concise proof if this is relevant to your experience."),
            "visibility": visibility,
        }

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
                "generatedBody": body,
                "editedBody": None,
                "approvedBody": None,
                "releaseStatus": "not_released",
                "releaseChannel": None,
                "releasedAt": None,
                "sourceMaterialSummary": None,
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
            trace_id = f"trc_{uuid4().hex[:10]}"
            self.record_agent_run(
                workflow_id=workflow_id,
                trace_id=trace_id,
                agent_name="supwork-feedback-agent",
                mode="generate_candidate_safe_feedback",
                provider="model-or-fixture",
                input_summary="Generate candidate-safe follow-up draft.",
                output_summary={"draftId": draft_id, "safetyPassed": safety["passed"]},
                status="completed",
            )
            self.audit(workflow_id, "agent.feedback.generated", "user", actor["id"], "Candidate-safe feedback draft generated.", {"draftId": draft_id}, "recruiter_internal", trace_id)
            return deepcopy(draft)

    def latest_feedback_draft(self, workflow_id: str) -> dict[str, Any]:
        drafts = [
            d
            for d in self._state["communicationDrafts"].values()
            if d["workflowId"] == workflow_id and d["status"] in {"drafted", "release_pending_approval"}
        ]
        if not drafts:
            raise NotFoundError("No feedback draft available for approval")
        return deepcopy(sorted(drafts, key=lambda d: d["createdAt"])[-1])

    def prepare_feedback_release(
        self,
        workflow_id: str,
        draft_id: str,
        subject: str,
        approved_body: str,
        safety: dict[str, Any],
        actor: dict[str, Any],
        source_material_summary: str | None,
        release_channel: str,
    ) -> dict[str, Any]:
        with self._lock:
            draft = self._state["communicationDrafts"].get(draft_id)
            if not draft or draft["workflowId"] != workflow_id:
                raise NotFoundError(draft_id)
            version_number = len(draft.get("versions", [])) + 1
            version_id = f"{draft_id}_v{version_number}"
            generated_body = draft.get("generatedBody") or draft.get("body", "")
            draft["subject"] = subject
            draft["body"] = approved_body
            draft["editedBody"] = approved_body if approved_body != generated_body else None
            draft["approvedBody"] = approved_body
            draft["currentVersionId"] = version_id
            draft["visibilityCheckStatus"] = "passed" if safety["passed"] else "blocked"
            draft["releaseStatus"] = "pending_approval"
            draft["releaseChannel"] = release_channel
            draft["sourceMaterialSummary"] = source_material_summary
            draft["status"] = "release_pending_approval"
            draft["updatedAt"] = utc_now_iso()
            draft.setdefault("versions", []).append(
                {
                    "id": version_id,
                    "versionNumber": version_number,
                    "subject": subject,
                    "body": approved_body,
                    "changeSummary": "HR edited or approved candidate-safe feedback for release.",
                    "createdByActorType": "user",
                    "createdByActorId": actor["id"],
                    "sourceMaterialSummary": source_material_summary,
                    "safetyCheck": safety,
                    "visibility": "candidate_visible",
                    "createdAt": utc_now_iso(),
                }
            )
            self.audit(
                workflow_id,
                "candidate.feedback.release_prepared",
                "user",
                actor["id"],
                "Candidate-safe feedback body prepared for human approval.",
                {"draftId": draft_id, "versionId": version_id},
                "recruiter_internal",
            )
            return deepcopy(draft)

    def link_draft_approval(self, draft_id: str, approval_id: str) -> dict[str, Any]:
        draft = self._state["communicationDrafts"].get(draft_id)
        if not draft:
            raise NotFoundError(draft_id)
        draft["approvalId"] = approval_id
        draft["updatedAt"] = utc_now_iso()
        return deepcopy(draft)

    def approved_feedback(self, workflow_id: str) -> dict[str, Any] | None:
        drafts = [d for d in self._state["communicationDrafts"].values() if d["workflowId"] == workflow_id and d["status"] in {"draft_created", "sent", "released"}]
        if not drafts:
            return None
        latest = sorted(drafts, key=lambda d: d["updatedAt"])[-1]
        return {
            "subject": latest["subject"],
            "body": latest.get("approvedBody") or latest["body"],
            "status": latest["status"],
            "releaseStatus": latest.get("releaseStatus"),
            "releaseChannel": latest.get("releaseChannel"),
            "releasedAt": latest.get("releasedAt"),
            "sourceMaterialSummary": latest.get("sourceMaterialSummary"),
        }

    def save_gmail_result(self, workflow_id: str, approval_id: str, result: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.mark_approval_executed(approval_id)
            draft = {
                "id": f"gmail_{uuid4().hex[:10]}",
                "workflowId": workflow_id,
                "channel": "gmail",
                "currentVersionId": None,
                "subject": result.get("subject"),
                "body": result.get("approvedBody") or result.get("bodySummary", "Candidate-safe message approved."),
                "generatedBody": None,
                "editedBody": None,
                "approvedBody": result.get("approvedBody") or result.get("bodySummary", "Candidate-safe message approved."),
                "releaseStatus": "released",
                "releaseChannel": "gmail",
                "releasedAt": utc_now_iso(),
                "sourceMaterialSummary": result.get("sourceMaterialSummary"),
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
            linked_drafts = [
                item
                for item in self._state["communicationDrafts"].values()
                if item.get("approvalId") == approval_id and item["id"] != draft["id"]
            ]
            for linked in linked_drafts:
                linked["status"] = draft["status"]
                linked["releaseStatus"] = "released"
                linked["releasedAt"] = draft["releasedAt"]
                linked["externalMessageId"] = draft["externalMessageId"]
                linked["threadId"] = draft["threadId"]
                linked["updatedAt"] = utc_now_iso()
            self.set_stage(workflow_id, "follow_up_sent")
            self.integration_event(workflow_id, "gmail", result.get("operation", "draft"), result.get("messageId") or result.get("draftId"), {}, result, "succeeded", result.get("traceId"))
            self.audit(workflow_id, "gmail.message.sent" if result.get("status") == "sent" else "gmail.draft.created", "system", "gmail", "Approved candidate communication processed through Gmail.", {"approvalId": approval_id}, "candidate_visible", result.get("traceId"))
            return deepcopy(draft)

    def record_agent_run(
        self,
        *,
        workflow_id: str,
        trace_id: str,
        agent_name: str,
        mode: str,
        provider: str,
        input_summary: str,
        output_summary: dict[str, Any],
        status: str,
    ) -> dict[str, Any]:
        event = {
            "id": f"run_{uuid4().hex[:10]}",
            "workflowId": workflow_id,
            "traceId": trace_id,
            "agentName": agent_name,
            "mode": mode,
            "provider": provider,
            "inputSummary": input_summary,
            "outputSummary": deepcopy(output_summary),
            "status": status,
            "humanApprovalStatus": "required",
            "createdAt": utc_now_iso(),
        }
        self._state.setdefault("agentRuns", []).append(event)
        return deepcopy(event)

    def agent_trace(self, workflow_id: str) -> dict[str, Any]:
        return {
            "workflowId": workflow_id,
            "agentRuns": [deepcopy(e) for e in self._state.get("agentRuns", []) if e["workflowId"] == workflow_id],
            "approvals": [deepcopy(a) for a in self._state["approvalRequests"].values() if a["workflowId"] == workflow_id],
            "integrationEvents": [deepcopy(e) for e in self._state["integrationEvents"] if e["workflowId"] == workflow_id],
            "auditEvents": self.timeline(workflow_id, candidate_visible=False),
        }

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
        stage = self.normalize_stage(stage)
        if workflow["stage"] != stage:
            workflow["stage"] = stage
            workflow["updatedAt"] = datetime.now(timezone.utc).isoformat()


class SQLiteStore(InMemoryStore):
    def __init__(self, database_path: str | Path) -> None:
        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        super().__init__()
        self._init_db()
        loaded = self._load_state()
        if loaded is None:
            self._save_state()
        else:
            self._state = loaded

    def _init_db(self) -> None:
        with closing(sqlite3.connect(self.database_path)) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS app_state (
                    id TEXT PRIMARY KEY,
                    state_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def _load_state(self) -> dict[str, Any] | None:
        with closing(sqlite3.connect(self.database_path)) as conn:
            row = conn.execute("SELECT state_json FROM app_state WHERE id = ?", ("default",)).fetchone()
        if not row:
            return None
        return json.loads(row[0])

    def _save_state(self) -> None:
        state_json = json.dumps(self._state, sort_keys=True)
        with closing(sqlite3.connect(self.database_path)) as conn:
            conn.execute(
                """
                INSERT INTO app_state (id, state_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    state_json = excluded.state_json,
                    updated_at = excluded.updated_at
                """,
                ("default", state_json, utc_now_iso()),
            )
            conn.commit()

    def reset_demo(self, keep_tokens: bool = True) -> dict[str, Any]:
        result = super().reset_demo(keep_tokens=keep_tokens)
        self._save_state()
        return result

    def login(self, email: str, password: str, expected_password: str) -> dict[str, Any]:
        result = super().login(email, password, expected_password)
        self._save_state()
        return result

    def analyze_evidence(self, workflow_id: str, actor: dict[str, Any], provider_mode: str = "mock") -> dict[str, Any]:
        result = super().analyze_evidence(workflow_id, actor, provider_mode)
        self._save_state()
        return result

    def save_cv_analysis(
        self,
        workflow_id: str,
        actor: dict[str, Any],
        cv_artifact: dict[str, Any],
        analysis: dict[str, Any],
        provider_mode: str,
        job_scope_text: str | None = None,
    ) -> dict[str, Any]:
        result = super().save_cv_analysis(workflow_id, actor, cv_artifact, analysis, provider_mode, job_scope_text)
        self._save_state()
        return result

    def add_research(self, artifact: dict[str, Any]) -> dict[str, Any]:
        result = super().add_research(artifact)
        self._save_state()
        return result

    def save_interview_plan(self, workflow_id: str, plan: dict[str, Any]) -> dict[str, Any]:
        result = super().save_interview_plan(workflow_id, plan)
        self._save_state()
        return result

    def save_round_interview_plan(self, workflow_id: str, round_id: str, plan: dict[str, Any], actor: dict[str, Any]) -> dict[str, Any]:
        result = super().save_round_interview_plan(workflow_id, round_id, plan, actor)
        self._save_state()
        return result

    def save_round_transcript(
        self,
        workflow_id: str,
        round_id: str,
        transcript_text: str,
        source_type: str,
        provider: str,
        visibility: str,
        actor: dict[str, Any],
    ) -> dict[str, Any]:
        result = super().save_round_transcript(workflow_id, round_id, transcript_text, source_type, provider, visibility, actor)
        self._save_state()
        return result

    def review_round(self, workflow_id: str, round_id: str, summary: str, outcome: str, actor: dict[str, Any]) -> dict[str, Any]:
        result = super().review_round(workflow_id, round_id, summary, outcome, actor)
        self._save_state()
        return result

    def create_approval(self, workflow_id: str, action_type: str, payload: dict[str, Any], risk_level: str, provider: str, actor: dict[str, Any]) -> dict[str, Any]:
        result = super().create_approval(workflow_id, action_type, payload, risk_level, provider, actor)
        self._save_state()
        return result

    def decide_approval(self, approval_id: str, status: str, actor: dict[str, Any]) -> dict[str, Any]:
        result = super().decide_approval(approval_id, status, actor)
        self._save_state()
        return result

    def mark_approval_executed(self, approval_id: str) -> None:
        super().mark_approval_executed(approval_id)
        self._save_state()

    def save_schedule(self, workflow_id: str, approval_id: str, result: dict[str, Any]) -> dict[str, Any]:
        round_record = super().save_schedule(workflow_id, approval_id, result)
        self._save_state()
        return round_record

    def add_notes(self, workflow_id: str, notes: str, visibility: str, actor: dict[str, Any]) -> dict[str, Any]:
        result = super().add_notes(workflow_id, notes, visibility, actor)
        self._save_state()
        return result

    def complete_round(self, workflow_id: str, round_id: str, notes: str, visibility: str, actor: dict[str, Any]) -> dict[str, Any]:
        result = super().complete_round(workflow_id, round_id, notes, visibility, actor)
        self._save_state()
        return result

    def submit_addendum(
        self,
        workflow_id: str,
        round_id: str,
        body: str,
        addendum_type: str,
        sensitive: bool,
        actor: dict[str, Any],
        attachments: list[dict[str, Any]] | None = None,
        links: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        result = super().submit_addendum(workflow_id, round_id, body, addendum_type, sensitive, actor, attachments, links)
        self._save_state()
        return result

    def acknowledge_addendum(
        self,
        workflow_id: str,
        addendum_id: str,
        actor: dict[str, Any],
        review_note: str | None = None,
        review_status: str = "acknowledged",
    ) -> dict[str, Any]:
        result = super().acknowledge_addendum(workflow_id, addendum_id, actor, review_note, review_status)
        self._save_state()
        return result

    def save_feedback_draft(self, workflow_id: str, subject: str, body: str, safety: dict[str, Any], actor: dict[str, Any]) -> dict[str, Any]:
        result = super().save_feedback_draft(workflow_id, subject, body, safety, actor)
        self._save_state()
        return result

    def link_draft_approval(self, draft_id: str, approval_id: str) -> dict[str, Any]:
        result = super().link_draft_approval(draft_id, approval_id)
        self._save_state()
        return result

    def save_gmail_result(self, workflow_id: str, approval_id: str, result: dict[str, Any]) -> dict[str, Any]:
        draft = super().save_gmail_result(workflow_id, approval_id, result)
        self._save_state()
        return draft
