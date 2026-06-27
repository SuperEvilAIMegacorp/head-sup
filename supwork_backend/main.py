from __future__ import annotations

import argparse
from datetime import datetime, time, timedelta, timezone
from typing import Any

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from supwork_backend.config import Settings, get_settings
from supwork_backend.exa_client import ExaClient
from supwork_backend.google_clients import GoogleClients, GoogleProviderNotConfigured
from supwork_backend.model_provider import ModelProvider
from supwork_backend.pdf_parser import PdfParseError, parse_cv_pdf
from supwork_backend.provider_status import provider_status
from supwork_backend.safety import assert_candidate_safe, candidate_safe_check
from supwork_backend.schemas import (
    AddendumRequest,
    AddendumReviewRequest,
    ApprovalCreateRequest,
    ApprovalDecisionResponse,
    FeedbackReleaseApprovalRequest,
    FeedbackDraftRequest,
    GmailDraftRequest,
    GoogleScheduleRequest,
    LoginRequest,
    LoginResponse,
    NotesRequest,
    RoundCompleteRequest,
    RoundQuestionRequest,
    RoundReviewRequest,
    RoundTranscriptRequest,
    ResearchRequest,
)
from supwork_backend.store import ForbiddenError, InMemoryStore, NotFoundError, SQLiteStore


def create_app(settings: Settings | None = None, store: InMemoryStore | None = None) -> FastAPI:
    settings = settings or get_settings()
    store = store or (SQLiteStore(settings.sqlite_database_path) if settings.supwork_storage_mode == "sqlite" else InMemoryStore())
    model = ModelProvider(settings)
    exa = ExaClient(settings)
    google = GoogleClients(settings)

    app = FastAPI(title="sup'work backend", version="0.1.0")
    origins = [settings.frontend_origin] if settings.frontend_origin else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def current_actor(authorization: str | None = Header(default=None)) -> dict[str, Any]:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
        token = authorization.split(" ", 1)[1].strip()
        try:
            return store.actor_for_token(token)
        except ForbiddenError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    def require_recruiter(actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        if actor["role"] not in {"hr", "interviewer", "hiring_manager", "admin"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recruiter role required")
        return actor

    def handle_error(exc: Exception) -> HTTPException:
        if isinstance(exc, NotFoundError):
            return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
        if isinstance(exc, (ForbiddenError, PermissionError, ValueError)):
            return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected backend error")

    async def store_research_artifact(request: ResearchRequest, research_type: str) -> dict[str, Any]:
        artifact = await exa.research(request.model_dump())
        artifact["workflowId"] = request.workflowId
        artifact["researchType"] = research_type
        return store.add_research(artifact)

    def parse_calendar_datetime(value: str, tz: timezone) -> datetime:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid datetime: {value}") from exc
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=tz)
        return parsed.astimezone(tz)

    def normalize_timezone(value: str) -> tuple[str, timezone]:
        normalized = value.strip() if value else settings.google_calendar_time_zone
        aliases = {
            "singapore standard time": ("Asia/Singapore", timezone(timedelta(hours=8))),
            "asia/singapore": ("Asia/Singapore", timezone(timedelta(hours=8))),
            "sgt": ("Asia/Singapore", timezone(timedelta(hours=8))),
            "utc": ("UTC", timezone.utc),
        }
        return aliases.get(normalized.lower(), (normalized, timezone(timedelta(hours=8))))

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.app_name}

    @app.get("/api/provider-status")
    def get_provider_status() -> dict[str, Any]:
        return provider_status(settings, model, exa, google)

    @app.get("/api/interviews/calendar-availability")
    def calendar_availability(
        startDateTime: str = Query(...),
        endDateTime: str = Query(...),
        timeZone: str = Query(default="Asia/Singapore"),
    ) -> dict[str, Any]:
        time_zone_name, tz = normalize_timezone(timeZone)
        start = parse_calendar_datetime(startDateTime, tz)
        end = parse_calendar_datetime(endDateTime, tz)
        if end <= start:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="endDateTime must be after startDateTime")

        slots: list[dict[str, Any]] = []
        day = start.date()
        last_day = end.date()
        while day <= last_day and len(slots) < 20:
            if day.weekday() < 5:
                for slot_time in (time(10, 0), time(14, 30)):
                    slot_start = datetime.combine(day, slot_time, tzinfo=tz)
                    slot_end = slot_start + timedelta(minutes=45)
                    if start <= slot_start and slot_end <= end:
                        slots.append(
                            {
                                "startDateTime": slot_start.isoformat(),
                                "endDateTime": slot_end.isoformat(),
                                "timeZone": time_zone_name,
                                "durationMinutes": 45,
                                "status": "available",
                            }
                        )
            day += timedelta(days=1)

        return {
            "providerMode": "fixture",
            "calendarId": settings.google_calendar_id,
            "timeZone": time_zone_name,
            "startDateTime": start.isoformat(),
            "endDateTime": end.isoformat(),
            "availableSlots": slots,
            "busySlots": [],
            "availability": slots,
        }

    @app.post("/api/auth/login", response_model=LoginResponse)
    def login(request: LoginRequest) -> dict[str, Any]:
        try:
            result = store.login(str(request.email), request.password, settings.demo_password)
        except Exception as exc:
            raise handle_error(exc) from exc
        return {"accessToken": result["token"], "user": result["user"]}

    @app.post("/api/auth/logout")
    def logout(actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        return {"status": "ok", "userId": actor["id"]}

    @app.get("/api/auth/me")
    def me(actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        return {"user": actor, "workflowIds": store.workflow_ids_for_actor(actor)}

    @app.post("/api/demo/reset")
    def reset_demo(actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        return store.reset_demo(keep_tokens=True)

    @app.get("/api/candidate/workflows/{workflow_id}")
    def candidate_workflow(workflow_id: str, actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        try:
            return store.candidate_view(workflow_id, actor)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/candidate/workflows")
    def candidate_workflows(actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        ids = store.workflow_ids_for_actor(actor)
        return {"workflowIds": ids, "defaultWorkflowId": ids[0] if ids else None}

    @app.get("/api/candidate/workflows/{workflow_id}/evidence")
    def candidate_evidence(workflow_id: str, actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        view = candidate_workflow(workflow_id, actor)
        return {"workflowId": workflow_id, "evidence": view["evidenceSummary"]}

    @app.get("/api/candidate/workflows/{workflow_id}/timeline")
    def candidate_timeline(workflow_id: str, actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        view = candidate_workflow(workflow_id, actor)
        return {"workflowId": workflow_id, "timeline": view["timeline"]}

    @app.get("/api/candidate/workflows/{workflow_id}/schedule")
    def candidate_schedule(workflow_id: str, actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        view = candidate_workflow(workflow_id, actor)
        return {"workflowId": workflow_id, "schedule": view["schedule"]}

    @app.get("/api/candidate/workflows/{workflow_id}/rounds")
    def candidate_rounds(workflow_id: str, actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        try:
            view = candidate_workflow(workflow_id, actor)
            return {"workflowId": workflow_id, "rounds": view["rounds"]}
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.get("/api/candidate/workflows/{workflow_id}/rounds/{round_id}")
    def candidate_round(workflow_id: str, round_id: str, actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        try:
            if actor["role"] == "interviewee":
                store.candidate_view(workflow_id, actor)
            return store.round(workflow_id, round_id, actor_role="interviewee")
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.get("/api/recruiter/workflows")
    def recruiter_workflows(actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        return {"workflowIds": store.workflow_ids_for_actor(actor)}

    @app.get("/api/recruiter/workflows/{workflow_id}")
    def recruiter_workflow(workflow_id: str, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return store.recruiter_view(workflow_id)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.get("/api/recruiter/workflows/{workflow_id}/rounds")
    def recruiter_rounds(workflow_id: str, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return {"workflowId": workflow_id, "rounds": store.rounds(workflow_id, actor_role=actor["role"])}
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.get("/api/recruiter/workflows/{workflow_id}/rounds/{round_id}")
    def recruiter_round(workflow_id: str, round_id: str, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return store.round(workflow_id, round_id, actor_role=actor["role"])
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/analyze-evidence")
    def analyze_evidence(workflow_id: str, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            provider_mode = settings.model_provider
            return store.analyze_evidence(workflow_id, actor, provider_mode)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/cv/upload-analysis")
    async def upload_cv_analysis(
        workflow_id: str,
        file: UploadFile = File(...),
        jobScopeText: str = Form(default=""),
        actor: dict[str, Any] = Depends(require_recruiter),
    ) -> dict[str, Any]:
        try:
            filename = file.filename or "candidate_cv.pdf"
            if not filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
                raise ValueError("CV upload must be a PDF")
            content = await file.read()
            artifact = parse_cv_pdf(filename, content)
            view = store.recruiter_view(workflow_id)
            if jobScopeText.strip():
                view["role"]["jobScopeText"] = jobScopeText.strip()
            analysis = model.cv_evidence_analysis(view, artifact)
            return store.save_cv_analysis(
                workflow_id,
                actor,
                artifact,
                analysis,
                settings.model_provider,
                jobScopeText,
            )
        except PdfParseError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.get("/api/workflows/{workflow_id}/research")
    def get_research(workflow_id: str, actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        if actor["role"] == "interviewee":
            view = store.candidate_view(workflow_id, actor)
            return view["roleBrief"]
        return {"artifacts": store.research(workflow_id)}

    @app.post("/api/research/company")
    async def research_company(request: ResearchRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return await store_research_artifact(request, "company")
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/research/role-market")
    async def research_role_market(request: ResearchRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return await store_research_artifact(request, "role_market")
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/research/interview-brief")
    async def research_interview_brief(request: ResearchRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return await store_research_artifact(request, "interview_brief")
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/questions")
    def generate_questions(workflow_id: str, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            active_round = store.active_round(workflow_id)
            view = store.recruiter_view(workflow_id)
            view["activeRound"] = store.round(workflow_id, active_round["id"], actor_role=actor["role"])
            plan = model.interview_plan(view, view["evidenceMappings"])
            return store.save_round_interview_plan(workflow_id, active_round["id"], plan, actor)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/rounds/{round_id}/questions")
    def generate_round_questions(
        workflow_id: str,
        round_id: str,
        request: RoundQuestionRequest | None = None,
        actor: dict[str, Any] = Depends(require_recruiter),
    ) -> dict[str, Any]:
        try:
            view = store.recruiter_view(workflow_id)
            view["activeRound"] = store.round(workflow_id, round_id, actor_role=actor["role"])
            plan = model.interview_plan(view, view["evidenceMappings"])
            return store.save_round_interview_plan(workflow_id, round_id, plan, actor)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/notes")
    def add_notes(workflow_id: str, request: NotesRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return store.add_notes(workflow_id, request.notes, request.visibility, actor)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/rounds/{round_id}/complete")
    def complete_round(workflow_id: str, round_id: str, request: RoundCompleteRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return store.complete_round(workflow_id, round_id, request.notes, request.visibility, actor)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/rounds/{round_id}/transcript")
    def store_round_transcript(
        workflow_id: str,
        round_id: str,
        request: RoundTranscriptRequest,
        actor: dict[str, Any] = Depends(require_recruiter),
    ) -> dict[str, Any]:
        try:
            return store.save_round_transcript(
                workflow_id,
                round_id,
                request.transcriptText,
                request.sourceType,
                request.provider,
                request.visibility,
                actor,
            )
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/rounds/{round_id}/review")
    def review_round(workflow_id: str, round_id: str, request: RoundReviewRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return store.review_round(workflow_id, round_id, request.summary, request.outcome, actor)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/candidate-safe-summary")
    def feedback_draft(workflow_id: str, request: FeedbackDraftRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            view = store.recruiter_view(workflow_id)
            draft = model.feedback_draft(view, request.nextStep)
            return store.save_feedback_draft(workflow_id, draft["subject"], draft["body"], draft["safety"], actor)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/feedback-draft")
    def feedback_draft_alias(workflow_id: str, request: FeedbackDraftRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        return feedback_draft(workflow_id, request, actor)

    @app.post("/api/recruiter/workflows/{workflow_id}/feedback-release-approval")
    def feedback_release_approval(workflow_id: str, request: FeedbackReleaseApprovalRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            draft = store.latest_feedback_draft(workflow_id)
            if request.draftId and request.draftId != draft["id"]:
                matches = [item for item in store.recruiter_view(workflow_id)["draftHistory"] if item["id"] == request.draftId]
                if not matches:
                    raise NotFoundError(request.draftId)
                draft = matches[0]
            subject = request.subject or draft["subject"]
            approved_body = request.approvedBody or request.editedBody or draft["body"]
            safety = candidate_safe_check(f"{subject}\n{approved_body}")
            if not safety["passed"]:
                raise ForbiddenError(f"Candidate-facing feedback failed safety check: {', '.join(safety['findings'])}")
            prepared_draft = store.prepare_feedback_release(
                workflow_id,
                draft["id"],
                subject,
                approved_body,
                safety,
                actor,
                request.sourceMaterialSummary,
                request.channel,
            )
            approval = store.create_approval(
                workflow_id,
                request.actionType,
                {
                    "channel": request.channel,
                    "draftId": prepared_draft["id"],
                    "draftVersionId": prepared_draft["currentVersionId"],
                    "subject": prepared_draft["subject"],
                    "approvedBody": prepared_draft["approvedBody"],
                    "sourceMaterialSummary": request.sourceMaterialSummary,
                    "candidateFacing": True,
                },
                request.riskLevel,
                request.channel,
                actor,
            )
            linked_draft = store.link_draft_approval(prepared_draft["id"], approval["id"])
            return {"approval": approval, "draft": linked_draft}
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/approvals")
    def create_approval(request: ApprovalCreateRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return store.create_approval(
                request.workflowId,
                request.actionType,
                request.proposedPayload,
                request.riskLevel,
                request.provider,
                actor,
            )
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.get("/api/approvals")
    def approvals(workflowId: str = "wf_demo", actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        return {"approvals": store.recruiter_view(workflowId)["approvals"]}

    @app.get("/api/approvals/{approval_id}")
    def approval(approval_id: str, workflowId: str = "wf_demo", actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        matches = [item for item in store.recruiter_view(workflowId)["approvals"] if item["id"] == approval_id]
        if not matches:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found")
        return matches[0]

    @app.post("/api/approvals/{approval_id}/approve", response_model=ApprovalDecisionResponse)
    def approve(approval_id: str, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            result = store.decide_approval(approval_id, "approved", actor)
            return {"approvalId": result["id"], "status": result["status"]}
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/approvals/{approval_id}/reject", response_model=ApprovalDecisionResponse)
    def reject(approval_id: str, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            result = store.decide_approval(approval_id, "rejected", actor)
            return {"approvalId": result["id"], "status": result["status"]}
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/integrations/google-calendar/create-approved")
    def create_google_calendar_event(request: GoogleScheduleRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            if not request.humanApproved:
                raise ForbiddenError("humanApproved must be true")
            assert_candidate_safe(request.description)
            store.require_approved(request.approvalId, request.workflowId, {"schedule_interview"})
            payload = request.model_dump()
            live = settings.supwork_provider == "live" and settings.google_configured
            result = google.create_calendar_event(payload, live=live)
            round_record = store.save_schedule(request.workflowId, request.approvalId, result)
            return {"schedule": round_record, "providerResult": result}
        except GoogleProviderNotConfigured as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/integrations/gmail/draft-approved")
    def create_gmail_draft(request: GmailDraftRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        return _gmail_action(request, actor, send=False)

    @app.post("/api/integrations/gmail/send-approved")
    def send_gmail(request: GmailDraftRequest, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        return _gmail_action(request, actor, send=True)

    def _gmail_action(request: GmailDraftRequest, actor: dict[str, Any], send: bool) -> dict[str, Any]:
        try:
            if not request.humanApproved:
                raise ForbiddenError("humanApproved must be true")
            safety = candidate_safe_check(f"{request.subject}\n{request.body}")
            if not safety["passed"]:
                raise ForbiddenError(f"Candidate-facing email failed safety check: {', '.join(safety['findings'])}")
            approval = store.require_approved(request.approvalId, request.workflowId, {"create_gmail_draft", "send_candidate_follow_up"})
            approved_subject = approval.get("proposedPayload", {}).get("subject")
            approved_body = approval.get("proposedPayload", {}).get("approvedBody")
            if approved_subject and request.subject != approved_subject:
                raise ForbiddenError("Gmail subject must match the approved feedback subject")
            if approved_body and request.body != approved_body:
                raise ForbiddenError("Gmail body must match the approved feedback body")
            live = settings.supwork_provider == "live" and settings.google_configured and bool(settings.gmail_sender_email)
            result = google.create_gmail_draft(request.model_dump(), live=live, send=send)
            result["approvedBody"] = request.body
            result["sourceMaterialSummary"] = approval.get("proposedPayload", {}).get("sourceMaterialSummary")
            draft = store.save_gmail_result(request.workflowId, request.approvalId, result)
            return {"draft": draft, "providerResult": result}
        except GoogleProviderNotConfigured as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/candidate/workflows/{workflow_id}/rounds/{round_id}/addendum")
    def submit_addendum(workflow_id: str, round_id: str, request: AddendumRequest, actor: dict[str, Any] = Depends(current_actor)) -> dict[str, Any]:
        try:
            return store.submit_addendum(
                workflow_id,
                round_id,
                request.body,
                request.addendumType,
                request.sensitiveFlag,
                actor,
                [item.model_dump() for item in request.attachments],
                [item.model_dump() for item in request.links],
            )
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.get("/api/recruiter/workflows/{workflow_id}/addenda")
    def recruiter_addenda(workflow_id: str, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        try:
            return {"addenda": store.addenda(workflow_id, actor_role=actor["role"])}
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.post("/api/recruiter/workflows/{workflow_id}/addenda/{addendum_id}/acknowledge")
    def acknowledge_addendum(
        workflow_id: str,
        addendum_id: str,
        request: AddendumReviewRequest | None = None,
        actor: dict[str, Any] = Depends(require_recruiter),
    ) -> dict[str, Any]:
        try:
            review = request or AddendumReviewRequest()
            return store.acknowledge_addendum(workflow_id, addendum_id, actor, review.reviewNote, review.reviewStatus)
        except Exception as exc:
            raise handle_error(exc) from exc

    @app.get("/api/audit-log")
    def audit_log(workflowId: str = "wf_demo", actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        return {"events": store.timeline(workflowId, candidate_visible=False)}

    @app.get("/api/workflows/{workflow_id}/agent-trace")
    def agent_trace(workflow_id: str, actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, Any]:
        return store.agent_trace(workflow_id)

    @app.post("/api/model/chat")
    def model_chat(payload: dict[str, str], actor: dict[str, Any] = Depends(require_recruiter)) -> dict[str, str]:
        system = payload.get("system", "You are a hiring transparency assistant.")
        user = payload.get("user", "")
        return {"response": model.chat_completion(system, user)}

    return app


app = create_app()


def smoke() -> None:
    from fastapi.testclient import TestClient

    client = TestClient(create_app())
    login = client.post("/api/auth/login", json={"email": "hr@demo.supwork.local", "password": "demo"})
    login.raise_for_status()
    token = login.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    status_response = client.get("/api/provider-status")
    status_response.raise_for_status()
    workflow = client.get("/api/recruiter/workflows/wf_demo", headers=headers)
    workflow.raise_for_status()
    approval = client.post(
        "/api/approvals",
        headers=headers,
        json={
            "workflowId": "wf_demo",
            "actionType": "schedule_interview",
            "provider": "google_calendar",
            "proposedPayload": {"meetingProvider": "google_meet"},
        },
    )
    approval.raise_for_status()
    approval_id = approval.json()["id"]
    client.post(f"/api/approvals/{approval_id}/approve", headers=headers).raise_for_status()
    print("smoke ok")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--smoke", action="store_true")
    args = parser.parse_args()
    if args.smoke:
        smoke()
