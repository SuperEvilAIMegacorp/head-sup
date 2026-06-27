import type { AuthSession, User } from "@/types";

export const SUPWORK_API_BASE =
  import.meta.env.VITE_SUPWORK_API_BASE ??
  import.meta.env.VITE_SUPWORK_BACKEND_URL ??
  "http://127.0.0.1:8787";

type HttpMethod = "GET" | "POST";

interface RequestOptions {
  body?: unknown;
  method?: HttpMethod;
  token?: string | null;
}

export class SupworkApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SupworkApiError";
  }
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await request<{ accessToken: string; user: BackendActor }>("/api/auth/login", {
    body: { email, password },
    method: "POST",
  });
  return {
    accessToken: response.accessToken,
    backendAvailable: true,
    user: mapActor(response.user),
  };
}

export function getMe(token: string) {
  return request<{ user: BackendActor; workflowIds: string[] }>("/api/auth/me", { token });
}

export function getProviderStatus() {
  return request<Record<string, unknown>>("/api/provider-status");
}

export function getCandidateWorkflow(token: string, workflowId = "wf_demo") {
  return request<BackendCandidateWorkflow>(`/api/candidate/workflows/${workflowId}`, { token });
}

export function getRecruiterWorkflow(token: string, workflowId = "wf_demo") {
  return request<BackendRecruiterWorkflow>(`/api/recruiter/workflows/${workflowId}`, { token });
}

export function analyzeEvidence(token: string, workflowId = "wf_demo") {
  return request<Record<string, unknown>>(`/api/recruiter/workflows/${workflowId}/analyze-evidence`, {
    method: "POST",
    token,
  });
}

export function uploadCvAnalysis(token: string, workflowId: string, file: File, jobScopeText: string) {
  const form = new FormData();
  form.set("file", file);
  form.set("jobScopeText", jobScopeText);
  return request<Record<string, unknown>>(`/api/recruiter/workflows/${workflowId}/cv/upload-analysis`, {
    body: form,
    method: "POST",
    token,
  });
}

export function runResearch(token: string, workflowId = "wf_demo", researchType: "company" | "role-market" = "company") {
  const path = researchType === "company" ? "/api/research/company" : "/api/research/role-market";
  return request<Record<string, unknown>>(path, {
    body: {
      company: "Example AI",
      industry: "AI deployment",
      region: "Singapore/APAC",
      roleTitle: "AI Solutions Engineer",
      workflowId,
    },
    method: "POST",
    token,
  });
}

export function generateInterviewPlan(token: string, workflowId = "wf_demo") {
  return request<Record<string, unknown>>(`/api/recruiter/workflows/${workflowId}/questions`, {
    method: "POST",
    token,
  });
}

export function getCandidateRounds(token: string, workflowId = "wf_demo") {
  return request<{ workflowId: string; rounds: BackendRound[] }>(`/api/candidate/workflows/${workflowId}/rounds`, { token });
}

export function getRecruiterRounds(token: string, workflowId = "wf_demo") {
  return request<{ workflowId: string; rounds: BackendRound[] }>(`/api/recruiter/workflows/${workflowId}/rounds`, { token });
}

export function generateRoundQuestions(token: string, workflowId: string, roundId: string) {
  return request<Record<string, unknown>>(`/api/recruiter/workflows/${workflowId}/rounds/${roundId}/questions`, {
    method: "POST",
    token,
  });
}

export function createApproval(
  token: string,
  input: {
    actionType: string;
    provider: string;
    proposedPayload: Record<string, unknown>;
    riskLevel?: string;
    workflowId?: string;
  },
) {
  return request<BackendApproval>("/api/approvals", {
    body: { workflowId: "wf_demo", riskLevel: "medium", ...input },
    method: "POST",
    token,
  });
}

export function approveApproval(token: string, approvalId: string) {
  return request<{ approvalId: string; status: string }>(`/api/approvals/${approvalId}/approve`, {
    method: "POST",
    token,
  });
}

export function scheduleGoogleMeet(
  token: string,
  input: {
    approvalId: string;
    candidateEmail: string;
    candidateName: string;
    dateTime: string;
    duration: number;
    timezone: string;
    interviewerEmail?: string;
  },
) {
  return request<{ schedule: BackendInterviewRound; providerResult: Record<string, unknown> }>(
    "/api/integrations/google-calendar/create-approved",
    {
      body: {
        approvalId: input.approvalId,
        approvedBy: "hr@demo.supwork.local",
        attendees: [input.interviewerEmail ?? "interviewer@example.com"],
        candidate: { email: input.candidateEmail, name: input.candidateName },
        description: "Candidate-safe interview conversation for the role.",
        durationMinutes: input.duration,
        humanApproved: true,
        meetingProvider: "google_meet",
        role: { company: "Example AI", title: "AI Solutions Engineer" },
        startTime: input.dateTime,
        timezone: input.timezone,
        workflowId: "wf_demo",
      },
      method: "POST",
      token,
    },
  );
}

export function completeRound(
  token: string,
  workflowId: string,
  roundId: string,
  notes: string,
) {
  return request<Record<string, unknown>>(`/api/recruiter/workflows/${workflowId}/rounds/${roundId}/complete`, {
    body: { notes, visibility: "interviewer_internal" },
    method: "POST",
    token,
  });
}

export function storeRoundTranscript(
  token: string,
  workflowId: string,
  roundId: string,
  input: { provider?: string; sourceType?: "live" | "talentflow_placeholder" | "manual"; transcriptText: string },
) {
  return request<Record<string, unknown>>(`/api/recruiter/workflows/${workflowId}/rounds/${roundId}/transcript`, {
    body: {
      provider: input.provider ?? "manual",
      sourceType: input.sourceType ?? "live",
      transcriptText: input.transcriptText,
      visibility: "interviewer_internal",
    },
    method: "POST",
    token,
  });
}

export function reviewRound(
  token: string,
  workflowId: string,
  roundId: string,
  input: { outcome?: string; summary?: string } = {},
) {
  return request<Record<string, unknown>>(`/api/recruiter/workflows/${workflowId}/rounds/${roundId}/review`, {
    body: { outcome: input.outcome ?? "advance", summary: input.summary ?? "" },
    method: "POST",
    token,
  });
}

export function submitAddendum(
  token: string,
  workflowId: string,
  roundId: string,
  input: {
    addendumType: string;
    attachments?: Array<Record<string, unknown>>;
    body: string;
    links?: Array<Record<string, unknown>>;
    sensitiveFlag: boolean;
  },
) {
  return request<Record<string, unknown>>(`/api/candidate/workflows/${workflowId}/rounds/${roundId}/addendum`, {
    body: input,
    method: "POST",
    token,
  });
}

export function acknowledgeAddendum(
  token: string,
  workflowId: string,
  addendumId: string,
  input: { reviewNote?: string; reviewStatus?: string } = {},
) {
  return request<Record<string, unknown>>(`/api/recruiter/workflows/${workflowId}/addenda/${addendumId}/acknowledge`, {
    body: input,
    method: "POST",
    token,
  });
}

export function generateFeedbackDraft(token: string, workflowId = "wf_demo", nextStep = "Recruiter will review the added rollout context.") {
  return request<Record<string, unknown>>(`/api/recruiter/workflows/${workflowId}/feedback-draft`, {
    body: { includeAddenda: true, nextStep },
    method: "POST",
    token,
  });
}

export function createFeedbackReleaseApproval(
  token: string,
  workflowId = "wf_demo",
  input: {
    approvedBody?: string;
    draftId?: string;
    editedBody?: string;
    sourceMaterialSummary?: string;
    subject?: string;
  } = {},
) {
  return request<{ approval: BackendApproval; draft: Record<string, unknown> }>(
    `/api/recruiter/workflows/${workflowId}/feedback-release-approval`,
    {
      body: { actionType: "create_gmail_draft", channel: "gmail", riskLevel: "medium", ...input },
      method: "POST",
      token,
    },
  );
}

export function createGmailDraft(
  token: string,
  input: { approvalId: string; body: string; subject: string; to: string; workflowId?: string },
) {
  return request<Record<string, unknown>>("/api/integrations/gmail/draft-approved", {
    body: {
      approvedBy: "hr@demo.supwork.local",
      humanApproved: true,
      workflowId: "wf_demo",
      ...input,
    },
    method: "POST",
    token,
  });
}

export function getAgentTrace(token: string, workflowId = "wf_demo") {
  return request<Record<string, unknown>>(`/api/workflows/${workflowId}/agent-trace`, { token });
}

export function resetDemo(token: string) {
  return request<Record<string, unknown>>("/api/demo/reset", { method: "POST", token });
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  let body: BodyInit | undefined;
  if (isFormData) {
    body = options.body as FormData;
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${SUPWORK_API_BASE}${path}`, {
      body,
      cache: "no-store",
      headers,
      method: options.method ?? "GET",
    });
  } catch (error) {
    throw new SupworkApiError(error instanceof Error ? error.message : "Backend unavailable");
  }

  if (!response.ok) {
    throw new SupworkApiError(await responseMessage(response), response.status);
  }
  return response.json() as Promise<T>;
}

async function responseMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: unknown; message?: unknown };
    return String(payload.detail ?? payload.message ?? response.statusText);
  } catch {
    return response.statusText || "Request failed";
  }
}

function mapActor(actor: BackendActor): User {
  return {
    email: actor.email,
    id: actor.id,
    name: actor.displayName,
    role: actor.role === "interviewee" ? "interviewee" : "hr",
  };
}

export interface BackendActor {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface BackendApproval {
  id: string;
  workflowId: string;
  actionType: string;
  proposedPayload: Record<string, unknown>;
  riskLevel: string;
  provider: string;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface BackendInterviewRound {
  id: string;
  workflowId: string;
  roundNumber: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  timezone?: string;
  meetingProvider?: string;
  calendarEventId?: string;
  meetingJoinUrl?: string;
  roundStatus?: string;
  approvalId?: string;
  createdAt?: string;
}

export interface BackendRoundQuestion {
  id?: string;
  prompt?: string;
  question?: string;
  rationale?: string;
  expectedSignal?: string;
  evidenceTarget?: string;
  followUp?: string;
  visibility?: string;
  source?: string;
}

export interface BackendRoundEvidence {
  id?: string;
  title?: string;
  body?: string;
  kind?: "transcript" | "manual" | "candidate_addendum" | "cv_evidence";
  sourceLabel?: string;
  statusLabel?: string;
  visibility?: string;
}

export interface BackendRound {
  id: string;
  workflowId: string;
  roundNumber: number;
  roundType?: string;
  title: string;
  roundStatus?: string;
  status?: string;
  statusLabel?: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  timezone?: string | null;
  meetingProvider?: string | null;
  meetingJoinUrl?: string | null;
  notesStatus?: string;
  approvalId?: string | null;
  traceId?: string | null;
  hrBriefing?: string;
  candidateBriefing?: string;
  validationFocus?: string[];
  candidatePrep?: string[];
  candidatePrepThemes?: string[];
  answerShape?: string[];
  addendumPrompt?: string;
  nextHumanAction?: string;
  questions?: BackendRoundQuestion[];
  transcriptEvidence?: BackendRoundEvidence[];
  transcriptPlaceholderPath?: string;
  reviewStatus?: string;
  reviewSummary?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendWorkflowBase {
  workflowId: string;
  candidate: { email: string; name: string };
  role: {
    company: string;
    id: string;
    jobScopeText?: string;
    location?: string;
    title: string;
  };
  stage: string;
  providerMode?: string;
  statusSummary?: string;
  timeline?: BackendAuditEvent[];
  schedule?: {
    approvalId?: string;
    endDateTime?: string;
    meetLink?: string;
    roundId?: string;
    startDateTime?: string;
    status?: string;
    timeZone?: string;
  } | null;
  agentFilledFields?: Record<string, unknown> | null;
  feedback?: { body: string; status: string; subject: string } | null;
  receipts?: Record<string, unknown>[];
  sourceArtifacts?: BackendSourceArtifact[];
  rounds?: BackendRound[];
}

export interface BackendCandidateWorkflow extends BackendWorkflowBase {
  evidenceSummary: BackendEvidenceMapping[];
  roleBrief?: { artifacts?: BackendResearchArtifact[] };
  interviewPrep?: string[];
  submittedAddenda?: BackendAddendum[];
}

export interface BackendRecruiterWorkflow extends BackendWorkflowBase {
  auditEvents?: BackendAuditEvent[];
  candidateAddenda?: BackendAddendum[];
  draftHistory?: Record<string, unknown>[];
  evidenceMappings: BackendEvidenceMapping[];
  integrationEvents?: Record<string, unknown>[];
  interviewPlan?: Record<string, unknown> | null;
  researchArtifacts?: BackendResearchArtifact[];
  approvals?: BackendApproval[];
}

export interface BackendEvidenceMapping {
  id: string;
  workflowId?: string;
  requirement: string;
  status: "covered" | "partial" | "gap" | "unclear";
  candidateEvidence?: string;
  evidence?: string;
  sourceLocation?: string | Record<string, unknown>;
  whyItMatters: string;
  candidateAction?: string;
  whatToAdd?: string;
  visibility: string;
}

export interface BackendSourceArtifact {
  id: string;
  filename: string;
  contentType?: string;
  pageCount?: number;
  parser?: string;
  pages?: Array<{ page: number; text: string; charCount?: number }>;
  uploadedAt?: string;
}

export interface BackendResearchArtifact {
  id: string;
  workflowId: string;
  researchType?: string;
  provider?: string;
  summary?: string;
  sources?: Array<{
    publishedDate?: string | null;
    retrievedAt?: string;
    snippet?: string;
    title?: string;
    url?: string;
  }>;
  visibility?: string;
  freshness?: string;
}

export interface BackendAddendum {
  id: string;
  roundId: string;
  addendumType?: string;
  type?: string;
  attachments?: Array<{ filename?: string; name?: string; size?: string; sizeBytes?: number }>;
  body: string;
  candidateVisibleReceipt?: string;
  links?: Array<{ label?: string; linkType?: string; url: string }>;
  reviewNotes?: string | null;
  sensitiveFlag?: boolean;
  sensitive?: boolean;
  status: string;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export interface BackendAuditEvent {
  id: string;
  eventType?: string;
  type?: string;
  actorId?: string;
  actorType?: string;
  actor?: string;
  summary?: string;
  label?: string;
  visibility?: string;
  traceId?: string;
  createdAt?: string;
  timestamp?: string;
  provider?: string;
}
