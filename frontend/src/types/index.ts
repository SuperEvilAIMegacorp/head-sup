export type UserRole = 'interviewee' | 'hr';
export type WorkflowStage =
  | 'applied'
  | 'created'
  | 'intake_ready'
  | 'evidence_review'
  | 'evidence_mapped'
  | 'research_enriched'
  | 'recruiter_review'
  | 'interview_planning'
  | 'schedule_pending_approval'
  | 'scheduled'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'interview_complete'
  | 'addendum_window_open'
  | 'notes_ready'
  | 'follow_up_pending_approval'
  | 'follow_up_sent'
  | 'follow_up'
  | 'closed';

export interface User { id: string; email: string; role: UserRole; name: string; }
export interface AuthSession { accessToken: string; user: User; backendAvailable: boolean; }
export interface Workflow {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  recruiterName: string;
  interviewerName: string;
  jobTitle: string;
  company: string;
  region: string;
  stage: WorkflowStage;
  providerMode?: string;
  statusSummary?: string;
  createdAt: string;
  updatedAt: string;
}
export interface TimelineEvent { id: string; type: string; label: string; summary?: string; timestamp: string; actor: string; candidateVisible: boolean; approvalId?: string; source?: string; }
export interface EvidenceMapping { id: string; requirement: string; evidence: string; sourceLocation?: string; sourceExcerpt?: string; sourcePage?: number; status: 'covered' | 'partial' | 'gap' | 'unclear'; whyItMatters: string; whatToAdd: string; visibility: 'candidate-visible' | 'internal'; }
export interface SourceArtifact { id: string; filename: string; contentType?: string; pageCount?: number; parser?: string; pages: { page: number; text: string; charCount?: number }[]; uploadedAt?: string; }
export interface ResearchArtifact { id: string; title: string; url: string; snippet: string; source: string; freshness: string; type: 'company' | 'role-market'; candidateSafe?: boolean; retrievedAt?: string; }
export interface ApprovalRequest { id: string; type: 'scheduling' | 'follow_up'; status: 'pending' | 'approved' | 'rejected'; candidateEmail: string; interviewerName: string; dateTime: string; timezone: string; duration: number; googleMeetLink?: string; googleCalendarEventId?: string; }
export type InterviewRoundStatus =
  | 'locked'
  | 'ready'
  | 'pre_interview'
  | 'questions_ready'
  | 'scheduled'
  | 'transcript_ready'
  | 'complete'
  | 'completed'
  | 'interview_completed'
  | 'supplement_submitted'
  | 'reviewed'
  | 'pending';
export interface InterviewRoundQuestion { id: string; prompt: string; rationale?: string; expectedSignal?: string; evidenceTarget?: string; followUp?: string; visibility?: string; source?: string; }
export interface InterviewRoundEvidence { id: string; title: string; body: string; kind: 'transcript' | 'manual' | 'candidate_addendum' | 'cv_evidence'; sourceLabel?: string; statusLabel?: string; visibility?: string; }
export interface InterviewRound {
  id: string;
  title: string;
  status: InterviewRoundStatus;
  dateTime: string;
  timezone: string;
  duration: number;
  attendees: string[];
  meetLink?: string;
  roundNumber?: number;
  roundType?: string;
  hrBriefing?: string;
  candidateBriefing?: string;
  validationFocus?: string[];
  candidatePrepThemes?: string[];
  answerShape?: string[];
  addendumPrompt?: string;
  nextHumanAction?: string;
  questions?: InterviewRoundQuestion[];
  transcriptEvidence?: InterviewRoundEvidence[];
  transcriptPlaceholderPath?: string;
  reviewStatus?: string;
  reviewSummary?: string;
}
export interface InterviewPlanQuestion { question: string; rationale: string; expectedSignal: string; visibility?: string; }
export interface InterviewPlan { id?: string; objective: string; questions: InterviewPlanQuestion[]; candidatePrepThemes: string[]; safetyStatus?: string; }
export interface CandidateAddendum { id: string; type: 'clarification' | 'correction' | 'additional_document' | 'special_consideration' | 'follow_up_note'; body: string; attachments: { name: string; size: string }[]; sensitive: boolean; submittedAt: string; acknowledgedAt?: string; acknowledgedBy?: string; reviewNote?: string; status: 'pending' | 'acknowledged'; }
export interface AuditEvent { id: string; eventType: string; actor: string; timestamp: string; provider?: string; summary: string; }
export interface IntegrationReceipt { id: string; provider: string; type: string; referenceId: string; createdAt: string; }
export interface FeedbackEntry { observedEvidence: string[]; interviewerInterpretation: string; recommendedNextStep: string; addendumReviewed: boolean; approved: boolean; candidateVisible: boolean; }
export interface WorkflowSyncState { backendAvailable: boolean; dataSource: 'backend' | 'fixture'; lastSyncedAt?: string; error?: string; }
