import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  acknowledgeAddendum as acknowledgeBackendAddendum,
  analyzeEvidence,
  approveApproval,
  completeRound as completeBackendRound,
  createApproval,
  createFeedbackReleaseApproval,
  createGmailDraft,
  generateRoundQuestions as generateBackendRoundQuestions,
  generateFeedbackDraft,
  generateInterviewPlan as generateBackendInterviewPlan,
  getCandidateWorkflow,
  getRecruiterWorkflow,
  reviewRound as reviewBackendRound,
  runResearch,
  scheduleGoogleMeet,
  storeRoundTranscript as storeBackendRoundTranscript,
  submitAddendum as submitBackendAddendum,
  SupworkApiError,
  uploadCvAnalysis as uploadBackendCvAnalysis,
  type BackendAddendum,
  type BackendAuditEvent,
  type BackendCandidateWorkflow,
  type BackendEvidenceMapping,
  type BackendRecruiterWorkflow,
  type BackendResearchArtifact,
  type BackendRound,
  type BackendRoundEvidence,
  type BackendRoundQuestion,
  type BackendSourceArtifact,
} from '@/api/supworkClient';
import { useAuth } from '@/context/AuthContext';
import {
  Workflow,
  TimelineEvent,
  EvidenceMapping,
  ResearchArtifact,
  ApprovalRequest,
  InterviewRound,
  InterviewPlan,
  CandidateAddendum,
  AuditEvent,
  SourceArtifact,
  WorkflowSyncState,
} from '../types';
import {
  mockWorkflow,
  mockTimelineEvents,
  mockEvidenceMappings,
  mockResearchArtifacts,
  mockApprovalRequests,
  mockInterviewRounds,
  mockAddenda,
  mockAuditEvents,
} from '../data/mockWorkflow';

interface WorkflowContextType {
  workflow: Workflow;
  timelineEvents: TimelineEvent[];
  evidenceMappings: EvidenceMapping[];
  researchArtifacts: ResearchArtifact[];
  approvalRequests: ApprovalRequest[];
  interviewRounds: InterviewRound[];
  interviewPlan: InterviewPlan | null;
  addenda: CandidateAddendum[];
  auditEvents: AuditEvent[];
  sourceArtifacts: SourceArtifact[];
  syncState: WorkflowSyncState;

  refreshWorkflow: () => Promise<void>;
  uploadCvAnalysis: (file: File, jobScopeText: string) => Promise<void>;
  approveScheduling: (id: string) => Promise<void>;
  submitAddendum: (data: Omit<CandidateAddendum, 'id' | 'status' | 'submittedAt'>) => Promise<void>;
  acknowledgeAddendum: (id: string, actorName: string, reviewNote?: string) => Promise<void>;
  runExaResearch: () => Promise<void>;
  generateInterviewPlan: (roundId?: string) => Promise<void>;
  storeInterviewTranscript: (roundId: string, transcriptText: string, sourceType?: 'live' | 'talentflow_placeholder' | 'manual') => Promise<void>;
  reviewInterviewRound: (roundId: string, summary: string, outcome?: string) => Promise<void>;
  completeInterviewRound: (roundId: string, notes: string) => Promise<void>;
  approveFollowUp: (email: string, draftId: string, draft?: { body?: string; subject?: string }) => Promise<void>;
  addAuditEvent: (event: Omit<AuditEvent, 'id'>) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);
const WORKFLOW_ID = 'wf_demo';

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { accessToken, backendAvailable, logout, user } = useAuth();
  const [workflow, setWorkflow] = useState<Workflow>(mockWorkflow);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(mockTimelineEvents);
  const [evidenceMappings, setEvidenceMappings] = useState<EvidenceMapping[]>(mockEvidenceMappings);
  const [researchArtifacts, setResearchArtifacts] = useState<ResearchArtifact[]>(mockResearchArtifacts);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(mockApprovalRequests);
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>(mockInterviewRounds);
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlan | null>(null);
  const [addenda, setAddenda] = useState<CandidateAddendum[]>(mockAddenda);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(mockAuditEvents);
  const [sourceArtifacts, setSourceArtifacts] = useState<SourceArtifact[]>([]);
  const [syncState, setSyncState] = useState<WorkflowSyncState>({
    backendAvailable: false,
    dataSource: 'fixture',
  });

  const canUseBackend = Boolean(accessToken && backendAvailable && user);

  const applyBackendView = useCallback((view: BackendCandidateWorkflow | BackendRecruiterWorkflow) => {
    const research = 'researchArtifacts' in view ? view.researchArtifacts : (view as BackendCandidateWorkflow).roleBrief?.artifacts;
    const candidateAddenda = 'candidateAddenda' in view ? view.candidateAddenda : (view as BackendCandidateWorkflow).submittedAddenda;
    setWorkflow(mapWorkflow(view));
    setEvidenceMappings(mapEvidence('evidenceMappings' in view ? view.evidenceMappings : view.evidenceSummary));
    setResearchArtifacts(mapResearch(research));
    setTimelineEvents(mapTimeline(view.timeline ?? ('auditEvents' in view ? view.auditEvents : [])));
    setAuditEvents(mapAudit('auditEvents' in view ? view.auditEvents : view.timeline));
    setAddenda(mapAddenda(candidateAddenda));
    setSourceArtifacts(mapSourceArtifacts(view.sourceArtifacts));
    setInterviewRounds(prev => mapRounds(view, prev));
    setApprovalRequests(prev => mapApprovals(view, prev));
    setInterviewPlan('interviewPlan' in view ? mapInterviewPlan(view.interviewPlan) : null);
    setSyncState({
      backendAvailable: true,
      dataSource: 'backend',
      lastSyncedAt: new Date().toISOString(),
    });
  }, []);

  const refreshWorkflow = useCallback(async () => {
    if (!canUseBackend || !accessToken || !user) {
      setSyncState(prev => ({ ...prev, backendAvailable: false, dataSource: 'fixture' }));
      return;
    }
    try {
      const view = user.role === 'interviewee'
        ? await getCandidateWorkflow(accessToken, WORKFLOW_ID)
        : await getRecruiterWorkflow(accessToken, WORKFLOW_ID);
      applyBackendView(view);
    } catch (error) {
      if (error instanceof SupworkApiError && error.status === 401) {
        logout();
      }
      setSyncState({
        backendAvailable: false,
        dataSource: 'fixture',
        error: error instanceof Error ? error.message : String(error),
        lastSyncedAt: new Date().toISOString(),
      });
    }
  }, [accessToken, applyBackendView, canUseBackend, logout, user]);

  useEffect(() => {
    void refreshWorkflow();
  }, [refreshWorkflow]);

  useEffect(() => {
    if (!canUseBackend) return;
    const id = window.setInterval(() => {
      void refreshWorkflow();
    }, 3500);
    return () => window.clearInterval(id);
  }, [canUseBackend, refreshWorkflow]);

  const uploadCvAnalysis = async (file: File, jobScopeText: string) => {
    if (!canUseBackend || !accessToken) {
      throw new Error('Live backend connection is required for CV upload and parsing.');
    }
    await uploadBackendCvAnalysis(accessToken, WORKFLOW_ID, file, jobScopeText);
    await refreshWorkflow();
  };

  const addAuditEvent = useCallback((event: Omit<AuditEvent, 'id'>) => {
    const newEvent: AuditEvent = { ...event, id: `ae_${Date.now()}` };
    setAuditEvents(prev => [newEvent, ...prev]);
  }, []);

  const addTimelineEvent = useCallback((event: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = { ...event, id: `te_${Date.now()}` };
    setTimelineEvents(prev => [...prev, newEvent]);
  }, []);

  const approveScheduling = async (id: string) => {
    if (canUseBackend && accessToken) {
      const selected = approvalRequests.find(req => req.id === id) ?? approvalRequests.find(req => req.type === 'scheduling');
      const approval = id.startsWith('appr_')
        ? { id }
        : await createApproval(accessToken, {
          actionType: 'schedule_interview',
          provider: 'google_calendar',
          proposedPayload: {
            candidateEmail: selected?.candidateEmail ?? workflow.candidateEmail,
            meetingProvider: 'google_meet',
            timezone: selected?.timezone ?? 'Asia/Singapore',
          },
          workflowId: WORKFLOW_ID,
        });

      await approveApproval(accessToken, approval.id);
      await scheduleGoogleMeet(accessToken, {
        approvalId: approval.id,
        candidateEmail: selected?.candidateEmail ?? workflow.candidateEmail,
        candidateName: workflow.candidateName,
        dateTime: selected?.dateTime ?? new Date(Date.now() + 2 * 86400000).toISOString(),
        duration: selected?.duration ?? 45,
        timezone: selected?.timezone ?? 'Asia/Singapore',
      });
      await refreshWorkflow();
      return;
    }

    setApprovalRequests(prev => prev.map(req =>
      req.id === id
        ? { ...req, status: 'approved', googleMeetLink: 'https://meet.google.com/sup-work-demo', googleCalendarEventId: 'gcal_evt_supwork_demo' }
        : req,
    ));
    setInterviewRounds(prev => prev.map(round =>
      round.id === 'round_1' ? { ...round, status: 'scheduled', meetLink: 'https://meet.google.com/sup-work-demo' } : round,
    ));
    setWorkflow(prev => ({ ...prev, stage: 'interview_scheduled' }));
    addTimelineEvent({
      type: 'interview_scheduled',
      label: 'Google Meet scheduled',
      summary: 'Recruiter approved the candidate-facing calendar payload before the external event was created.',
      timestamp: new Date().toISOString(),
      actor: workflow.recruiterName,
      candidateVisible: true,
      approvalId: id,
      source: 'Google Calendar fixture',
    });
    addAuditEvent({
      eventType: 'google_calendar.event.created',
      actor: 'Backend API',
      timestamp: new Date().toISOString(),
      provider: 'Google Calendar / Meet',
      summary: 'Approved schedule payload executed and Meet link stored.',
    });
  };

  const submitAddendum = async (data: Omit<CandidateAddendum, 'id' | 'status' | 'submittedAt'>) => {
    if (canUseBackend && accessToken) {
      const roundId = interviewRounds.find(round => isRoundComplete(round.status))?.id;
      if (!roundId) throw new Error('No interview round is available for addendum submission.');
      await submitBackendAddendum(accessToken, WORKFLOW_ID, roundId, {
        addendumType: data.type,
        attachments: data.attachments,
        body: data.body,
        links: [],
        sensitiveFlag: data.sensitive,
      });
      await refreshWorkflow();
      return;
    }

    const newAddendum: CandidateAddendum = {
      ...data,
      id: `add_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    setAddenda(prev => [...prev, newAddendum]);
    addTimelineEvent({
      type: 'addendum_submitted',
      label: 'Candidate addendum submitted',
      summary: 'Candidate supplied optional post-interview context for HR review. It is unvalidated until acknowledged.',
      timestamp: new Date().toISOString(),
      actor: workflow.candidateName,
      candidateVisible: true,
      source: 'candidate-supplied',
    });
    addAuditEvent({
      eventType: 'candidate.addendum_submitted',
      actor: workflow.candidateName,
      timestamp: new Date().toISOString(),
      summary: 'Candidate submitted a post-interview addendum.',
    });
  };

  const acknowledgeAddendum = async (id: string, actorName: string, reviewNote?: string) => {
    if (canUseBackend && accessToken) {
      await acknowledgeBackendAddendum(accessToken, WORKFLOW_ID, id, {
        reviewNote: reviewNote?.trim() || undefined,
        reviewStatus: 'acknowledged',
      });
      await refreshWorkflow();
      return;
    }

    setAddenda(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'acknowledged', acknowledgedAt: new Date().toISOString(), acknowledgedBy: actorName } : a,
    ));
    addTimelineEvent({
      type: 'addendum_acknowledged',
      label: 'Addendum acknowledged by HR',
      summary: 'HR acknowledged the candidate-supplied addendum before follow-up generation.',
      timestamp: new Date().toISOString(),
      actor: actorName,
      candidateVisible: true,
      source: 'HR review',
    });
    addAuditEvent({
      eventType: 'candidate.addendum_acknowledged',
      actor: actorName,
      timestamp: new Date().toISOString(),
      summary: 'HR acknowledged candidate addendum.',
    });
  };

  const runExaResearch = async () => {
    if (canUseBackend && accessToken) {
      await Promise.all([
        runResearch(accessToken, WORKFLOW_ID, 'company'),
        runResearch(accessToken, WORKFLOW_ID, 'role-market'),
      ]);
      await refreshWorkflow();
      return;
    }

    const newArtifact: ResearchArtifact = {
      id: `ra_${Date.now()}`,
      title: 'Example AI customer deployment patterns',
      url: 'https://example.com/customer-ai-deployment-patterns',
      snippet: 'This source reports that enterprise AI buyers increasingly ask for monitoring, rollout governance, and clear owner handoffs.',
      source: 'Exa live/fixture',
      freshness: 'just now',
      type: 'company',
      candidateSafe: true,
      retrievedAt: new Date().toISOString(),
    };
    setResearchArtifacts(prev => [newArtifact, ...prev]);
    addAuditEvent({
      eventType: 'exa.search.completed',
      actor: workflow.recruiterName,
      timestamp: new Date().toISOString(),
      provider: 'Exa',
      summary: 'Source-backed company context refreshed through backend research route.',
    });
  };

  const generateInterviewPlan = async (roundId?: string) => {
    if (canUseBackend && accessToken) {
      await analyzeEvidence(accessToken, WORKFLOW_ID);
      if (roundId) {
        await generateBackendRoundQuestions(accessToken, WORKFLOW_ID, roundId);
      } else {
        await generateBackendInterviewPlan(accessToken, WORKFLOW_ID);
      }
      await refreshWorkflow();
    }
  };

  const storeInterviewTranscript = async (
    roundId: string,
    transcriptText: string,
    sourceType: 'live' | 'talentflow_placeholder' | 'manual' = 'live',
  ) => {
    if (!canUseBackend || !accessToken) {
      throw new Error('Live backend connection is required for transcript storage.');
    }
    await storeBackendRoundTranscript(accessToken, WORKFLOW_ID, roundId, { sourceType, transcriptText });
    await refreshWorkflow();
  };

  const reviewInterviewRound = async (roundId: string, summary: string, outcome = 'advance') => {
    if (!canUseBackend || !accessToken) {
      throw new Error('Live backend connection is required for round review.');
    }
    await reviewBackendRound(accessToken, WORKFLOW_ID, roundId, { outcome, summary });
    await refreshWorkflow();
  };

  const completeInterviewRound = async (roundId: string, notes: string) => {
    if (canUseBackend && accessToken) {
      await completeBackendRound(accessToken, WORKFLOW_ID, roundId, notes);
      await refreshWorkflow();
      return;
    }
    setInterviewRounds(prev => prev.map(round => round.id === roundId ? { ...round, status: 'complete' } : round));
    setWorkflow(prev => ({ ...prev, stage: 'interview_complete' }));
  };

  const approveFollowUp = async (email: string, draftId: string, draft?: { body?: string; subject?: string }) => {
    if (canUseBackend && accessToken) {
      const generatedDraft = await generateFeedbackDraft(accessToken, WORKFLOW_ID);
      const subject = draft?.subject?.trim() || String(generatedDraft.subject ?? 'Next steps from supwork');
      const body = draft?.body?.trim() || String(generatedDraft.body ?? 'Candidate-safe follow-up approved.');
      const approvalResult = await createFeedbackReleaseApproval(accessToken, WORKFLOW_ID, {
        editedBody: body,
        sourceMaterialSummary: 'Reviewed interview notes and candidate addendum context in supwork.',
        subject,
      });
      await approveApproval(accessToken, approvalResult.approval.id);
      await createGmailDraft(accessToken, {
        approvalId: approvalResult.approval.id,
        body: String(approvalResult.draft.body ?? body),
        subject: String(approvalResult.draft.subject ?? subject),
        to: email,
        workflowId: WORKFLOW_ID,
      });
      await refreshWorkflow();
      return;
    }

    addTimelineEvent({
      type: 'follow_up_sent',
      label: 'Follow-up draft approved',
      summary: 'HR approved a candidate-safe Gmail draft after visibility checks.',
      timestamp: new Date().toISOString(),
      actor: workflow.recruiterName,
      candidateVisible: true,
      source: 'Gmail draft fixture',
    });
    addAuditEvent({
      eventType: 'workato.recipe.completed',
      actor: 'Backend API',
      timestamp: new Date().toISOString(),
      provider: 'Gmail / Workato fixture',
      summary: `Approved follow-up draft ${draftId} processed for ${email}.`,
    });
  };

  const value = useMemo(() => ({
    workflow,
    timelineEvents,
    evidenceMappings,
    researchArtifacts,
    approvalRequests,
    interviewRounds,
    interviewPlan,
    addenda,
    auditEvents,
    sourceArtifacts,
    syncState,
    refreshWorkflow,
    uploadCvAnalysis,
    approveScheduling,
    submitAddendum,
    acknowledgeAddendum,
    runExaResearch,
    generateInterviewPlan,
    storeInterviewTranscript,
    reviewInterviewRound,
    completeInterviewRound,
    approveFollowUp,
    addAuditEvent,
  }), [
    workflow,
    timelineEvents,
    evidenceMappings,
    researchArtifacts,
    approvalRequests,
    interviewRounds,
    interviewPlan,
    addenda,
    auditEvents,
    sourceArtifacts,
    syncState,
    refreshWorkflow,
  ]);

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}

function mapWorkflow(view: BackendCandidateWorkflow | BackendRecruiterWorkflow): Workflow {
  return {
    id: view.workflowId,
    candidateEmail: view.candidate.email,
    candidateId: 'usr_candidate',
    candidateName: view.candidate.name,
    company: view.role.company,
    createdAt: mockWorkflow.createdAt,
    interviewerName: 'Priya Shah',
    jobTitle: view.role.title,
    providerMode: view.providerMode,
    recruiterName: 'Alex Lee',
    region: view.role.location ?? 'Singapore / APAC',
    stage: view.stage as Workflow['stage'],
    statusSummary: view.statusSummary,
    updatedAt: new Date().toISOString(),
  };
}

function mapEvidence(items: BackendEvidenceMapping[] = []): EvidenceMapping[] {
  if (!items.length) return mockEvidenceMappings;
  return items.map(item => ({
    evidence: item.candidateEvidence ?? item.evidence ?? '',
    id: item.id,
    requirement: item.requirement,
    sourceLocation: sourceLocationLabel(item.sourceLocation),
    sourceExcerpt: sourceLocationExcerpt(item.sourceLocation) ?? item.candidateEvidence ?? item.evidence,
    sourcePage: sourceLocationPage(item.sourceLocation),
    status: item.status,
    visibility: item.visibility === 'candidate_visible' ? 'candidate-visible' : 'internal',
    whatToAdd: item.candidateAction ?? item.whatToAdd ?? '',
    whyItMatters: item.whyItMatters,
  }));
}

function mapSourceArtifacts(items: BackendSourceArtifact[] = []): SourceArtifact[] {
  return items.map(item => ({
    contentType: item.contentType,
    filename: item.filename,
    id: item.id,
    pageCount: item.pageCount,
    pages: item.pages ?? [],
    parser: item.parser,
    uploadedAt: item.uploadedAt,
  }));
}

function mapResearch(artifacts: BackendResearchArtifact[] = []): ResearchArtifact[] {
  if (!artifacts.length) return mockResearchArtifacts;
  return artifacts.flatMap(artifact => {
    const sources = artifact.sources?.length ? artifact.sources : [{
      snippet: artifact.summary,
      title: artifact.researchType ?? 'Research artifact',
      url: 'https://example.com',
      retrievedAt: new Date().toISOString(),
    }];
    return sources.map((source, index) => ({
      candidateSafe: artifact.visibility === 'candidate_visible',
      freshness: artifact.freshness ?? 'current',
      id: `${artifact.id}_${index}`,
      retrievedAt: source.retrievedAt,
      snippet: source.snippet ?? artifact.summary ?? '',
      source: artifact.provider ?? 'backend',
      title: source.title ?? artifact.researchType ?? 'Research artifact',
      type: artifact.researchType === 'role_market' ? 'role-market' : 'company',
      url: source.url ?? 'https://example.com',
    }));
  });
}

function mapApprovals(view: BackendCandidateWorkflow | BackendRecruiterWorkflow, previous: ApprovalRequest[]): ApprovalRequest[] {
  const schedule = view.schedule;
  const backendApprovals = 'approvals' in view ? view.approvals ?? [] : [];
  const mapped = backendApprovals
    .filter(approval => approval.actionType === 'schedule_interview' || approval.actionType === 'create_gmail_draft')
    .map(approval => ({
      candidateEmail: view.candidate.email,
      dateTime: schedule?.startDateTime ?? mockApprovalRequests[0].dateTime,
      duration: 45,
      googleCalendarEventId: typeof approval.proposedPayload?.eventId === 'string' ? approval.proposedPayload.eventId : undefined,
      googleMeetLink: schedule?.meetLink,
      id: approval.id,
      interviewerName: 'Priya Shah',
      status: approval.status === 'executed' ? 'approved' : normalizeApprovalStatus(approval.status),
      timezone: schedule?.timeZone ?? 'Asia/Singapore',
      type: approval.actionType === 'schedule_interview' ? 'scheduling' : 'follow_up',
    }) satisfies ApprovalRequest);

  if (mapped.length) return mapped;
  if (schedule) {
    return [{
      candidateEmail: view.candidate.email,
      dateTime: schedule.startDateTime ?? mockApprovalRequests[0].dateTime,
      duration: 45,
      googleCalendarEventId: schedule.approvalId,
      googleMeetLink: schedule.meetLink,
      id: schedule.approvalId ?? 'backend_schedule',
      interviewerName: 'Priya Shah',
      status: schedule.status === 'scheduled' || isRoundComplete(normalizeRoundStatus(schedule.status)) ? 'approved' : 'pending',
      timezone: schedule.timeZone ?? 'Asia/Singapore',
      type: 'scheduling',
    }];
  }
  return previous.length ? previous : mockApprovalRequests;
}

function mapRounds(view: BackendCandidateWorkflow | BackendRecruiterWorkflow, previous: InterviewRound[]): InterviewRound[] {
  const backendRounds = Array.isArray(view.rounds) ? view.rounds : [];
  if (backendRounds.length) {
    return [...backendRounds]
      .sort((a, b) => (a.roundNumber ?? 999) - (b.roundNumber ?? 999))
      .map((round, index) => mapBackendRound(round, view, index));
  }

  if (!view.schedule) return previous.length ? previous : mockInterviewRounds;
  const status = normalizeRoundStatus(view.schedule.status);
  return [{
    attendees: ['Priya Shah', 'Alex Lee'],
    dateTime: view.schedule.startDateTime ?? mockInterviewRounds[0].dateTime,
    duration: 45,
    id: view.schedule.roundId ?? 'round_1',
    meetLink: view.schedule.meetLink,
    status,
    timezone: view.schedule.timeZone ?? 'Asia/Singapore',
    title: 'Customer AI deployment interview',
  }];
}

function mapBackendRound(round: BackendRound, view: BackendCandidateWorkflow | BackendRecruiterWorkflow, index: number): InterviewRound {
  const fallback = mockInterviewRounds[index] ?? mockInterviewRounds[0];
  const start = round.scheduledStart ?? '';
  const end = round.scheduledEnd;
  return {
    addendumPrompt: round.addendumPrompt,
    answerShape: Array.isArray(round.answerShape) ? round.answerShape.map(String) : [],
    attendees: ['Priya Shah', 'Alex Lee'],
    candidateBriefing: round.candidateBriefing,
    candidatePrepThemes: (round.candidatePrepThemes ?? round.candidatePrep ?? []).map(String),
    dateTime: start,
    duration: durationMinutes(start, end) ?? fallback.duration ?? 45,
    hrBriefing: round.hrBriefing,
    id: round.id,
    meetLink: round.meetingJoinUrl ?? undefined,
    nextHumanAction: round.nextHumanAction,
    questions: mapRoundQuestions(round.questions),
    reviewStatus: round.reviewStatus,
    reviewSummary: round.reviewSummary,
    roundNumber: round.roundNumber,
    roundType: round.roundType,
    status: normalizeRoundStatus(round.roundStatus ?? round.status),
    timezone: round.timezone ?? view.schedule?.timeZone ?? fallback.timezone ?? 'Asia/Singapore',
    title: round.title,
    transcriptEvidence: mapRoundEvidence(round.transcriptEvidence),
    transcriptPlaceholderPath: round.transcriptPlaceholderPath,
    validationFocus: (round.validationFocus ?? []).map(String),
  };
}

function mapRoundQuestions(items: BackendRoundQuestion[] = []): InterviewRound['questions'] {
  return items.map((item, index) => ({
    evidenceTarget: item.evidenceTarget,
    expectedSignal: item.expectedSignal,
    followUp: item.followUp,
    id: item.id ?? `round_question_${index}`,
    prompt: item.prompt ?? item.question ?? 'Walk through one relevant example.',
    rationale: item.rationale,
    source: item.source,
    visibility: item.visibility,
  }));
}

function mapRoundEvidence(items: BackendRoundEvidence[] = []): InterviewRound['transcriptEvidence'] {
  return items.map((item, index) => ({
    body: item.body ?? '',
    id: item.id ?? `round_evidence_${index}`,
    kind: item.kind ?? 'manual',
    sourceLabel: item.sourceLabel,
    statusLabel: item.statusLabel,
    title: item.title ?? 'Round evidence',
    visibility: item.visibility,
  }));
}

function durationMinutes(start?: string | null, end?: string | null) {
  if (!start || !end) return undefined;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return undefined;
  return Math.round((endMs - startMs) / 60000);
}

function mapInterviewPlan(plan: Record<string, unknown> | null | undefined): InterviewPlan | null {
  if (!plan) return null;
  const rawQuestions = Array.isArray(plan.questions) ? plan.questions : [];
  const rawPrepThemes = Array.isArray(plan.candidatePrepThemes) ? plan.candidatePrepThemes : [];
  return {
    candidatePrepThemes: rawPrepThemes.map(String),
    id: typeof plan.id === 'string' ? plan.id : undefined,
    objective: typeof plan.objective === 'string' ? plan.objective : 'Validate evidence gaps with fair, role-related questions.',
    questions: rawQuestions
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map(item => ({
        expectedSignal: String(item.expectedSignal ?? 'Specific, role-relevant evidence.'),
        question: String(item.question ?? 'Walk through one relevant example.'),
        rationale: String(item.rationale ?? 'Generated from current evidence gaps.'),
        visibility: typeof item.visibility === 'string' ? item.visibility : undefined,
      })),
    safetyStatus: typeof plan.safetyStatus === 'string' ? plan.safetyStatus : undefined,
  };
}

function mapAddenda(items: BackendAddendum[] = []): CandidateAddendum[] {
  return items.map(item => ({
    acknowledgedAt: item.reviewedAt ?? undefined,
    acknowledgedBy: item.reviewedBy ?? undefined,
    attachments: (item.attachments ?? []).map(file => ({
      name: file.name ?? file.filename ?? 'Candidate attachment',
      size: file.size ?? (typeof file.sizeBytes === 'number' ? `${Math.max(1, Math.round(file.sizeBytes / 1024))} KB` : 'metadata only'),
    })),
    body: item.body,
    id: item.id,
    reviewNote: item.reviewNotes ?? undefined,
    sensitive: Boolean(item.sensitiveFlag ?? item.sensitive),
    status: item.status === 'acknowledged' ? 'acknowledged' : 'pending',
    submittedAt: item.submittedAt,
    type: (item.addendumType ?? item.type ?? 'clarification') as CandidateAddendum['type'],
  }));
}

function mapTimeline(events: BackendAuditEvent[] = []): TimelineEvent[] {
  if (!events.length) return mockTimelineEvents;
  return events.map(event => ({
    actor: event.actor ?? event.actorId ?? event.actorType ?? 'System',
    candidateVisible: event.visibility !== 'recruiter_internal',
    id: event.id,
    label: event.label ?? humanizeEvent(event.eventType ?? event.type ?? 'workflow.event'),
    source: event.traceId,
    summary: event.summary,
    timestamp: event.createdAt ?? event.timestamp ?? new Date().toISOString(),
    type: event.eventType ?? event.type ?? 'workflow.event',
  }));
}

function mapAudit(events: BackendAuditEvent[] = []): AuditEvent[] {
  if (!events.length) return mockAuditEvents;
  return events.map(event => ({
    actor: event.actor ?? event.actorId ?? event.actorType ?? 'System',
    eventType: event.eventType ?? event.type ?? 'workflow.event',
    id: event.id,
    provider: event.provider,
    summary: event.summary ?? event.label ?? '',
    timestamp: event.createdAt ?? event.timestamp ?? new Date().toISOString(),
  }));
}

function sourceLocationLabel(value: BackendEvidenceMapping['sourceLocation']) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const page = value.page ? `CV p.${value.page}` : 'CV';
  const section = value.section ? `, ${value.section}` : '';
  return `${page}${section}`;
}

function sourceLocationExcerpt(value: BackendEvidenceMapping['sourceLocation']) {
  if (!value || typeof value === 'string') return undefined;
  return typeof value.excerpt === 'string' ? value.excerpt : undefined;
}

function sourceLocationPage(value: BackendEvidenceMapping['sourceLocation']) {
  if (!value || typeof value === 'string') return undefined;
  return typeof value.page === 'number' ? value.page : undefined;
}

function normalizeApprovalStatus(status: string): ApprovalRequest['status'] {
  if (status === 'approved' || status === 'pending' || status === 'rejected') return status;
  return status === 'executed' ? 'approved' : 'pending';
}

function normalizeRoundStatus(status?: string | null): InterviewRound['status'] {
  switch (status) {
    case 'locked':
    case 'ready':
    case 'pre_interview':
    case 'questions_ready':
    case 'scheduled':
    case 'transcript_ready':
    case 'complete':
    case 'completed':
    case 'interview_completed':
    case 'supplement_submitted':
    case 'reviewed':
      return status;
    default:
      return 'pending';
  }
}

function isRoundComplete(status: InterviewRound['status']) {
  return ['complete', 'completed', 'interview_completed', 'supplement_submitted', 'reviewed'].includes(status);
}

function humanizeEvent(type: string) {
  return type
    .replaceAll('.', ' ')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}
