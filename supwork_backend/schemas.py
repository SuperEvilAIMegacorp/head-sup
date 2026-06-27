from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

Visibility = Literal["candidate_visible", "recruiter_internal", "interviewer_internal", "system_audit", "secret_redacted"]
Role = Literal["interviewee", "hr", "interviewer", "hiring_manager", "admin"]
ApprovalStatus = Literal["pending", "approved", "rejected", "expired", "executed", "failed"]


class Actor(BaseModel):
    id: str
    email: str
    displayName: str
    role: Role


class LoginRequest(BaseModel):
    email: str
    password: str = "demo"


class LoginResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: Actor


class ResearchRequest(BaseModel):
    workflowId: str = "wf_demo"
    company: str = "Example AI"
    companyUrl: str | None = None
    roleTitle: str = "AI Solutions Engineer"
    industry: str = "AI deployment"
    region: str = "Singapore/APAC"


class ApprovalCreateRequest(BaseModel):
    workflowId: str
    actionType: str
    proposedPayload: dict[str, Any]
    riskLevel: str = "medium"
    provider: str = "google"


class ApprovalDecisionResponse(BaseModel):
    approvalId: str
    status: ApprovalStatus


class GoogleScheduleRequest(BaseModel):
    workflowId: str
    approvalId: str
    candidate: dict[str, Any]
    role: dict[str, Any]
    startTime: datetime
    durationMinutes: int = Field(default=45, ge=15, le=240)
    timezone: str = "Asia/Singapore"
    attendees: list[str] = Field(default_factory=list)
    meetingProvider: Literal["google_meet"] = "google_meet"
    humanApproved: bool
    approvedBy: str
    description: str = "Candidate-safe interview conversation for the role."


class GmailDraftRequest(BaseModel):
    workflowId: str
    approvalId: str
    to: str
    subject: str
    body: str
    humanApproved: bool
    approvedBy: str


class AddendumRequest(BaseModel):
    addendumType: str = "clarification"
    body: str
    sensitiveFlag: bool = False


class NotesRequest(BaseModel):
    notes: str
    visibility: Visibility = "interviewer_internal"


class FeedbackDraftRequest(BaseModel):
    includeAddenda: bool = True
    nextStep: str = "Recruiter review"
