import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { 
  Workflow, TimelineEvent, EvidenceMapping, ResearchArtifact, 
  ApprovalRequest, InterviewRound, CandidateAddendum, AuditEvent 
} from '../types';
import { 
  mockWorkflow, mockTimelineEvents, mockEvidenceMappings, 
  mockResearchArtifacts, mockApprovalRequests, mockInterviewRounds, 
  mockAddenda, mockAuditEvents 
} from '../data/mockWorkflow';

interface WorkflowContextType {
  workflow: Workflow;
  timelineEvents: TimelineEvent[];
  evidenceMappings: EvidenceMapping[];
  researchArtifacts: ResearchArtifact[];
  approvalRequests: ApprovalRequest[];
  interviewRounds: InterviewRound[];
  addenda: CandidateAddendum[];
  auditEvents: AuditEvent[];
  
  // Actions
  approveScheduling: (id: string) => Promise<void>;
  submitAddendum: (data: Omit<CandidateAddendum, 'id' | 'status' | 'submittedAt'>) => Promise<void>;
  acknowledgeAddendum: (id: string, actorName: string) => Promise<void>;
  runExaResearch: () => Promise<void>;
  approveFollowUp: (email: string, draftId: string) => Promise<void>;
  addAuditEvent: (event: Omit<AuditEvent, 'id'>) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, setWorkflow] = useState<Workflow>(mockWorkflow);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(mockTimelineEvents);
  const [evidenceMappings, setEvidenceMappings] = useState<EvidenceMapping[]>(mockEvidenceMappings);
  const [researchArtifacts, setResearchArtifacts] = useState<ResearchArtifact[]>(mockResearchArtifacts);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(mockApprovalRequests);
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>(mockInterviewRounds);
  const [addenda, setAddenda] = useState<CandidateAddendum[]>(mockAddenda);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(mockAuditEvents);

  const addAuditEvent = useCallback((event: Omit<AuditEvent, 'id'>) => {
    const newEvent: AuditEvent = { ...event, id: `ae_${Date.now()}` };
    setAuditEvents(prev => [newEvent, ...prev]);
  }, []);

  const addTimelineEvent = useCallback((event: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = { ...event, id: `te_${Date.now()}` };
    setTimelineEvents(prev => [...prev, newEvent]);
  }, []);

  const approveScheduling = async (id: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setApprovalRequests(prev => prev.map(req => 
          req.id === id 
            ? { ...req, status: 'approved', googleMeetLink: 'https://meet.google.com/sup-work-demo', googleCalendarEventId: 'gcal_evt_supwork_demo' } 
            : req
        ));
        
        setInterviewRounds(prev => prev.map(round => 
          round.id === 'round_1' ? { ...round, status: 'scheduled', meetLink: 'https://meet.google.com/sup-work-demo' } : round
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
          source: 'Google Calendar fixture'
        });

        addAuditEvent({
          eventType: 'google_calendar.event.created',
          actor: 'Backend API',
          timestamp: new Date().toISOString(),
          provider: 'Google Calendar / Meet',
          summary: 'Approved schedule payload executed and Meet link stored.'
        });

        resolve();
      }, 800);
    });
  };

  const submitAddendum = async (data: Omit<CandidateAddendum, 'id' | 'status' | 'submittedAt'>) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
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
          source: 'candidate-supplied'
        });

        addAuditEvent({
          eventType: 'candidate.addendum_submitted',
          actor: workflow.candidateName,
          timestamp: new Date().toISOString(),
          summary: 'Candidate submitted a post-interview addendum.'
        });

        resolve();
      }, 600);
    });
  };

  const acknowledgeAddendum = async (id: string, actorName: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setAddenda(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'acknowledged', acknowledgedAt: new Date().toISOString(), acknowledgedBy: actorName } : a
        ));

        addTimelineEvent({
          type: 'addendum_acknowledged',
          label: 'Addendum acknowledged by HR',
          summary: 'HR acknowledged the candidate-supplied addendum before follow-up generation.',
          timestamp: new Date().toISOString(),
          actor: actorName,
          candidateVisible: true,
          source: 'HR review'
        });

        addAuditEvent({
          eventType: 'candidate.addendum_acknowledged',
          actor: actorName,
          timestamp: new Date().toISOString(),
          summary: 'HR acknowledged candidate addendum.'
        });

        resolve();
      }, 500);
    });
  };

  const runExaResearch = async () => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
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
          summary: 'Source-backed company context refreshed through backend research route.'
        });

        resolve();
      }, 1200);
    });
  };

  const approveFollowUp = async (email: string, draftId: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        addTimelineEvent({
          type: 'follow_up_sent',
          label: 'Follow-up draft approved',
          summary: 'HR approved a candidate-safe Gmail draft after visibility checks.',
          timestamp: new Date().toISOString(),
          actor: workflow.recruiterName,
          candidateVisible: true,
          source: 'Gmail draft fixture'
        });

        addAuditEvent({
          eventType: 'workato.recipe.completed',
          actor: 'Backend API',
          timestamp: new Date().toISOString(),
          provider: 'Gmail / Workato fixture',
          summary: `Approved follow-up draft ${draftId} processed for ${email}.`
        });
        
        resolve();
      }, 1000);
    });
  };

  return (
    <WorkflowContext.Provider value={{
      workflow, timelineEvents, evidenceMappings, researchArtifacts, 
      approvalRequests, interviewRounds, addenda, auditEvents,
      approveScheduling, submitAddendum, acknowledgeAddendum, runExaResearch, approveFollowUp, addAuditEvent
    }}>
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
