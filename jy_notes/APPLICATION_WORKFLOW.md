# Application Workflow: HeadSup TalentFlow IQ

## Workflow Objective

HeadSup TalentFlow IQ coordinates the interview process from candidate intake to post-interview follow-up. The application combines AI reasoning, Exa research, Workato workflow automation, Gmail communication, Google Calendar scheduling, and Google Meet interview links while keeping all external actions approval-gated.

The core workflow is:

```text
Candidate intake
  -> role and CV evidence extraction
  -> Exa-powered role/company research
  -> AI screening and gap analysis
  -> interview question generation
  -> human-approved scheduling
  -> Google Calendar or Workato executes calendar/email automation
  -> interview transcript or notes captured
  -> next-round recommendation and follow-up draft
  -> human-approved candidate communication
```

## Actors

| Actor | Role in workflow |
| --- | --- |
| Recruiter | Owns candidate pipeline, reviews AI output, approves scheduling and communication. |
| Hiring manager | Reviews evidence, asks follow-up questions, approves interview progression. |
| Interviewer | Receives interview brief, runs interview, adds notes or transcript. |
| Candidate | Receives scheduling, attends interview, optionally submits follow-up material. |
| AI orchestrator | Coordinates agent outputs, explains current status, drafts next actions. |
| Exa research service | Retrieves public web context for companies, roles, skills, and market signals. |
| Workato | Executes approved workflow automation across Gmail, Google Calendar, Slack, ATS, spreadsheets, or other tools. |
| Backend API | Enforces permissions, approval gates, validation, persistence, and audit logging. |

## Workflow States

Each candidate application moves through explicit states.

```text
created
  -> intake_ready
  -> evidence_extracted
  -> research_enriched
  -> screening_ready
  -> recruiter_review
  -> interview_planning
  -> schedule_pending_approval
  -> scheduled
  -> interview_completed
  -> transcript_or_notes_ready
  -> next_step_pending_approval
  -> follow_up_sent
  -> closed
```

State rules:

- AI can suggest state transitions but cannot finalize consequential transitions.
- Scheduling, rejection, advancement, and candidate communication require approval.
- External side effects are only allowed from approved states.
- Every state transition is written to the audit log.

## End-To-End Workflow

### 1. Recruiter Creates A Candidate Workflow

Recruiter action:

- Creates a new candidate workflow.
- Enters candidate name, email, role title, and source.
- Uploads CV or resume.
- Pastes job description or role scope.
- Optionally attaches internal hiring rubric.

System actions:

```text
POST /api/workflows
POST /api/workflows/{workflow_id}/artifacts
```

Backend stores:

- Candidate record.
- Role record.
- Uploaded CV artifact.
- Job scope artifact.
- Optional rubric artifact.

State transition:

```text
created -> intake_ready
```

Audit events:

- `workflow.created`
- `artifact.uploaded.cv`
- `artifact.uploaded.job_scope`

### 2. Backend Extracts Candidate And Role Evidence

Recruiter action:

- Clicks `Generate analysis`.

System actions:

```text
POST /api/workflows/{workflow_id}/screen
```

Agent actions:

- Screening agent extracts role requirements from the job scope.
- Screening agent extracts candidate evidence from the CV.
- Safety agent checks for unsupported claims and unsafe hiring language.
- Orchestrator agent summarizes the workflow status.

Generated outputs:

- Role summary.
- Required skills.
- Preferred skills.
- Candidate strengths.
- Partial matches.
- Missing evidence.
- Interview validation needs.
- Candidate-safe summary.
- Internal-only notes.

State transition:

```text
intake_ready -> evidence_extracted
```

Audit events:

- `agent.screening.started`
- `agent.screening.completed`
- `agent.safety.completed`

### 3. Exa Enriches The Workflow With Web Research

Recruiter action:

- Clicks `Research role and company`.
- Or asks Ask IQ: `research this company and prepare interviewer context`.

System actions:

```text
POST /api/research/company
POST /api/research/role-market
POST /api/research/interview-brief
```

Exa search targets:

- Company website and product pages.
- Recent company news.
- Role-specific skill trends.
- Public documentation for tools listed in the job scope.
- Industry-specific interview topics.

Exa should not be used for:

- Secretly researching a candidate's private life.
- Making hiring decisions from public web data.
- Inferring protected characteristics.
- Replacing reviewer judgment.

Generated outputs:

- Company context brief.
- Role market context.
- Publicly sourced talking points.
- Interviewer prep notes.
- Suggested role-specific question themes.
- Source URLs and short summaries.

State transition:

```text
evidence_extracted -> research_enriched
```

Audit events:

- `exa.search.company.completed`
- `exa.search.role_market.completed`
- `research_brief.generated`

### 4. Recruiter Reviews Evidence And Decides Whether To Interview

Recruiter action:

- Reviews candidate evidence.
- Checks missing evidence and Exa research context.
- Decides whether to proceed to interview planning.

System behavior:

- Shows clear separation between CV evidence, Exa public research, AI interpretation, and human notes.
- Labels uncertainty.
- Prevents AI from showing a final hire or reject decision.

Possible recruiter decisions:

```text
Proceed to interview
Request more candidate info
Hold for review
Close workflow
```

Approval requirements:

- `Proceed to interview` can be a human state change.
- `Request more candidate info` requires approval before sending email.
- `Close workflow` requires confirmation if it sends candidate communication.

State transition:

```text
research_enriched -> recruiter_review
```

Audit events:

- `review.opened`
- `review.decision.recorded`

### 5. AI Generates Interview Plan

Recruiter action:

- Clicks `Generate interview plan`.
- Or asks Ask IQ: `prepare round 1 questions for this candidate`.

System actions:

```text
POST /api/workflows/{workflow_id}/questions
```

Agent actions:

- Question agent reads job scope, CV evidence, missing evidence, rubric, Exa role research, and current round.
- Generates interview questions tied to evidence gaps.
- Safety agent removes inappropriate or discriminatory questions.
- Orchestrator groups questions by interview round.

Generated outputs:

- Interview objective.
- Question list.
- Evidence rationale for each question.
- Expected signal.
- Follow-up prompts.
- Red flags to validate.
- Candidate-safe context if needed.

State transition:

```text
recruiter_review -> interview_planning
```

Audit events:

- `agent.questions.generated`
- `agent.safety.questions_checked`

### 6. Recruiter Requests Scheduling

Recruiter action:

- Uses Ask IQ to schedule.

Example prompt:

```text
schedule round 1 for tomorrow at 2pm with Jane and Alex, 45 minutes, Google Meet
```

System actions:

```text
POST /api/workflows/{workflow_id}/ask
```

Agent actions:

- Scheduling agent parses date, time, duration, attendees, timezone, candidate, role, and meeting provider.
- Backend validates required fields.
- Backend checks integration status.
- Backend creates an approval request instead of calling Google Calendar or Workato immediately.

Execution modes:

- `google_direct`: backend creates or updates the Google Calendar event directly and requests Google Meet conference data.
- `workato`: backend calls a Workato API recipe, and Workato performs Google Calendar, Gmail, notification, and downstream sync steps.
- The recruiter sees the same approval card in both modes.

Generated approval payload:

```json
{
  "actionType": "schedule_interview",
  "workflowId": "wf_123",
  "candidateName": "Jane Tan",
  "candidateEmail": "jane@example.com",
  "roleTitle": "Product Manager",
  "roundNumber": 1,
  "startTime": "2026-06-28T14:00:00+08:00",
  "durationMinutes": 45,
  "timezone": "Asia/Singapore",
  "attendees": ["alex@company.com"],
  "meetingProvider": "google_meet",
  "executionMode": "google_direct",
  "humanApproved": false
}
```

State transition:

```text
interview_planning -> schedule_pending_approval
```

Audit events:

- `approval.created.schedule_interview`
- `agent.scheduling.draft_created`

### 7. Human Approves Scheduling

Recruiter action:

- Reviews approval card.
- Confirms attendees, candidate email, time, timezone, duration, and provider.
- Clicks `Approve and schedule`.

System actions:

```text
POST /api/approvals/{approval_id}/approve
POST /api/integrations/google-calendar/create-approved
POST /api/integrations/workato/schedule-interview
```

Backend validation before scheduling execution:

- Approval exists.
- Approval status is `approved`.
- Approved by authenticated recruiter.
- Payload has `humanApproved: true`.
- Candidate email is present.
- Start time is in the future.
- Meeting provider is allowed.
- Execution mode is either `google_direct` or `workato`.
- Attendees are valid.

Approved scheduling payload:

```json
{
  "workflowId": "wf_123",
  "approvalId": "appr_456",
  "actionType": "schedule_interview",
  "candidate": {
    "name": "Jane Tan",
    "email": "jane@example.com"
  },
  "role": {
    "title": "Product Manager"
  },
  "round": {
    "number": 1,
    "durationMinutes": 45
  },
  "startTime": "2026-06-28T14:00:00+08:00",
  "timezone": "Asia/Singapore",
  "attendees": ["alex@company.com"],
  "meetingProvider": "google_meet",
  "executionMode": "workato",
  "humanApproved": true,
  "approvedBy": "recruiter@company.com"
}
```

State remains:

```text
schedule_pending_approval
```

Audit events:

- `approval.approved.schedule_interview`
- `google_calendar.schedule_interview.requested` or `workato.schedule_interview.requested`

### 8. Google Calendar Or Workato Executes Scheduling Automation

The product supports two execution modes.

```text
google_direct
  -> backend calls Google Calendar API directly
  -> Calendar event is created with Google Meet conference data
  -> backend stores event ID and Meet link

workato
  -> backend calls Workato API recipe
  -> Workato creates Google Calendar event and Gmail notification
  -> Workato calls backend callback with event ID and Meet link
```

Workato recipe trigger:

```text
New API request: schedule_interview
```

Workato recipe steps:

1. Receive approved payload from backend.
2. Validate `humanApproved` is `true`.
3. Create Google Calendar event with Google Meet conference data.
4. Add candidate and interviewer attendees.
5. Send candidate-safe Gmail confirmation or calendar invite.
6. Send hiring-team notification through Slack, Gmail, or another configured channel.
7. Call TalentFlow IQ callback endpoint with result.

Workato callback to backend:

```text
POST /api/integrations/workato/callbacks/schedule-interview
```

Callback payload:

```json
{
  "workflowId": "wf_123",
  "approvalId": "appr_456",
  "status": "scheduled",
  "provider": "google_calendar",
  "externalEventId": "event_789",
  "joinUrl": "https://meet.google.com/abc-defg-hij",
  "startsAt": "2026-06-28T14:00:00+08:00",
  "attendees": ["jane@example.com", "alex@company.com"]
}
```

Backend stores:

- Interview round.
- External event ID.
- Google Meet join URL.
- Integration event.
- Updated workflow status.

State transition:

```text
schedule_pending_approval -> scheduled
```

Audit events:

- `workato.schedule_interview.completed`
- `interview.scheduled`

### 9. Candidate Receives Interview Communication

Candidate experience:

- Receives Gmail or calendar invite.
- Receives Google Meet join link.
- Sees role, time, timezone, and interview duration.
- Does not receive internal evidence notes, scores, or rubric concerns.

Recruiter experience:

- Sees meeting link in TalentFlow IQ.
- Sees that Workato completed the automation.
- Can copy meeting details or open external event.

Audit events:

- `candidate.communication.sent`
- `calendar.event.created`
- `google_calendar.event.created`
- `google_meet.link.created`

### 10. Interviewer Receives Brief

Interviewer action:

- Opens interview round in TalentFlow IQ.
- Reviews generated interview plan.
- Reviews candidate-safe and internal-only labels.
- Uses questions during the interview.

System output:

- Candidate summary.
- Role requirements.
- Key evidence.
- Missing evidence.
- Exa-generated company or market context.
- Round-specific questions.
- Note-taking area.

State remains:

```text
scheduled
```

Audit events:

- `interview_brief.viewed`

### 11. Interview Completes

Interviewer action:

- Marks interview complete.
- Adds notes.
- Optionally uploads a transcript or interview recording notes.

System actions:

```text
POST /api/interviews/{round_id}/complete
POST /api/interviews/{round_id}/notes
POST /api/interviews/{round_id}/transcript
```

Backend behavior:

- Stores interviewer notes as internal-only.
- Stores transcript artifact if uploaded.
- Keeps transcript unavailable state non-blocking.
- Allows next-step generation from interviewer notes alone if no transcript exists.

State transition:

```text
scheduled -> interview_completed
```

If transcript or notes are available:

```text
interview_completed -> transcript_or_notes_ready
```

Audit events:

- `interview.completed`
- `interview.notes.saved`
- `transcript.stored` or `transcript.not_ready`

### 12. AI Generates Next-Step Recommendation

Recruiter action:

- Clicks `Generate next step`.
- Or asks Ask IQ: `what should we do after round 1?`

System actions:

```text
POST /api/workflows/{workflow_id}/next-step
```

Agent actions:

- Orchestrator reads CV evidence, job scope, interview questions, notes, transcript, and Exa context.
- Screening agent updates evidence coverage.
- Question agent suggests next-round focus if needed.
- Communication agent drafts candidate-safe follow-up.
- Safety agent checks unsupported claims and visibility leaks.

Possible recommendations:

```text
Advance to round 2
Request additional candidate material
Schedule hiring manager interview
Hold for review
Close with candidate-safe rejection draft
```

Important rule:

- The recommendation is not a decision.
- A human must approve progression, rejection, or communication.

State transition:

```text
transcript_or_notes_ready -> next_step_pending_approval
```

Audit events:

- `agent.next_step.generated`
- `approval.created.next_step`

### 13. Human Approves Candidate Follow-Up

Recruiter action:

- Reviews next-step recommendation.
- Edits candidate email if needed.
- Approves follow-up.

System actions:

```text
POST /api/approvals/{approval_id}/approve
POST /api/integrations/workato/send-candidate-follow-up
```

Workato recipe steps:

1. Receive approved follow-up payload.
2. Validate `humanApproved` is `true`.
3. Send Gmail follow-up or create draft.
4. Optionally update external ATS stage.
5. Notify hiring team.
6. Callback TalentFlow IQ with message metadata.

State transition:

```text
next_step_pending_approval -> follow_up_sent
```

Audit events:

- `approval.approved.follow_up`
- `workato.follow_up.completed`
- `candidate.follow_up_sent`

### 14. Candidate Submits Add-On Material

Candidate action:

- Provides clarification, portfolio link, document, or project sample.

System actions:

```text
POST /api/candidate-portal/{workflow_id}/addon
```

Backend behavior:

- Stores add-on as candidate-supplied evidence.
- Labels it separately from validated evidence.
- Notifies recruiter.
- Allows agent to consider it only as unvalidated candidate context.

State transition:

```text
follow_up_sent -> recruiter_review
```

Audit events:

- `candidate.addon_submitted`
- `artifact.uploaded.candidate_addon`

### 15. Workflow Closes

Closure paths:

```text
hired
rejected
withdrawn
archived
```

Rules:

- AI cannot close the workflow on its own.
- Candidate communication must be approved.
- Exported packets must redact internal-only content when intended for candidates.

State transition:

```text
follow_up_sent -> closed
```

Audit events:

- `workflow.closed`
- `candidate.final_communication.sent`

## Swimlane Summary

```text
Recruiter
  Create workflow
  Upload CV and job scope
  Review analysis
  Approve schedule
  Review interview outcome
  Approve next step

TalentFlow IQ Backend
  Store artifacts
  Run agents
  Enforce approvals
  Call Exa
  Call Workato
  Store audit events

AI Agents
  Extract evidence
  Identify gaps
  Generate questions
  Draft scheduling and emails
  Check safety and visibility

Exa
  Search company and role context
  Return sourced research snippets
  Support interviewer prep

Workato
  Create Google Calendar event
  Attach Google Meet link
  Send Gmail or notification
  Update downstream tools
  Callback with external IDs

Candidate
  Receives invite
  Attends interview
  Receives follow-up
  Optionally submits add-on material
```

## Workato Recipes

### Recipe 1: Schedule Interview

Trigger:

```text
API request from TalentFlow IQ
```

Inputs:

- `workflowId`
- `approvalId`
- `candidate.name`
- `candidate.email`
- `role.title`
- `round.number`
- `startTime`
- `timezone`
- `durationMinutes`
- `attendees`
- `meetingProvider`
- `executionMode`
- `humanApproved`
- `approvedBy`

Steps:

1. Stop if `humanApproved` is not `true`.
2. Create Google Calendar event with Google Meet conference data.
3. Add attendees.
4. Send calendar invite.
5. Send internal hiring-team notification.
6. POST callback to TalentFlow IQ.

Outputs:

- `status`
- `externalEventId`
- `joinUrl`
- `provider`
- `startsAt`

### Recipe 2: Send Candidate Follow-Up

Trigger:

```text
API request from TalentFlow IQ
```

Inputs:

- `workflowId`
- `approvalId`
- `candidate.email`
- `subject`
- `body`
- `humanApproved`
- `approvedBy`

Steps:

1. Stop if `humanApproved` is not `true`.
2. Send Gmail message or create Gmail draft.
3. Store Gmail message ID.
4. Optionally notify recruiter.
5. POST callback to TalentFlow IQ.

Outputs:

- `messageId`
- `threadId`
- `status`

### Recipe 3: Interview Completed Notification

Trigger:

```text
Calendar event ended or manual backend call
```

Inputs:

- `workflowId`
- `roundId`
- `externalEventId`

Steps:

1. Notify interviewer to submit notes.
2. Notify backend that interview ended.
3. Optionally request transcript upload or notes completion.
4. Create follow-up task for recruiter.

Outputs:

- `taskId`
- `notificationStatus`

### Recipe 4: ATS Stage Sync

Trigger:

```text
Approved state transition from TalentFlow IQ
```

Inputs:

- `workflowId`
- `candidateEmail`
- `newStage`
- `approvedBy`
- `humanApproved`

Steps:

1. Stop if `humanApproved` is not `true`.
2. Update ATS or spreadsheet row.
3. Notify hiring team.
4. POST callback to TalentFlow IQ.

Outputs:

- `externalCandidateId`
- `externalStage`
- `status`

## Exa Research Workflows

### Company Research

Input:

```json
{
  "companyName": "Acme AI",
  "roleTitle": "Product Manager"
}
```

Search prompts:

```text
Acme AI company product overview
Acme AI recent news hiring product manager
Acme AI engineering product culture
```

Output:

- Company summary.
- Recent relevant developments.
- Product or market context.
- Public source list.
- Interviewer talking points.

### Role Market Research

Input:

```json
{
  "roleTitle": "Product Manager",
  "industry": "AI recruiting software",
  "seniority": "mid-level"
}
```

Search prompts:

```text
product manager AI recruiting software skills
AI hiring platform product manager interview topics
recruiting automation market trends
```

Output:

- Role skill themes.
- Market trends.
- Suggested interview focus areas.
- Public source list.

### Interview Brief Research

Input:

```json
{
  "roleTitle": "Product Manager",
  "companyName": "Acme AI",
  "candidateEvidenceGaps": [
    "No direct enterprise sales evidence",
    "Limited metrics ownership evidence"
  ]
}
```

Output:

- External context.
- Evidence-gap question themes.
- Suggested follow-up areas.
- Sources.

## Approval Matrix

| Action | AI can draft | Human approval required | Workato executes | Audit required |
| --- | --- | --- | --- | --- |
| CV screening summary | Yes | No | No | Yes |
| Exa role research | Yes | No | No | Yes |
| Interview questions | Yes | Recommended before use | No | Yes |
| Gmail draft | Yes | Yes before send | Yes | Yes |
| Gmail send | No | Yes | Yes | Yes |
| Calendar event | No | Yes | Yes | Yes |
| Google Calendar / Meet event | No | Yes | Yes | Yes |
| Transcript polling | Yes | Configurable | Optional | Yes |
| Candidate advancement | Yes | Yes | Optional | Yes |
| Candidate rejection | Yes | Yes | Optional | Yes |

## UI Workflow

### Dashboard

Shows:

- Candidate pipeline.
- Current stage.
- Missing evidence count.
- Pending approvals.
- Integration health.
- Recent audit events.

Primary actions:

- Create workflow.
- Open candidate.
- Review pending approvals.

### Candidate Workspace

Tabs:

- `Overview`
- `CV Evidence`
- `Research`
- `Interview Plan`
- `Scheduling`
- `Follow-Up`
- `Audit`

Key UI rules:

- Evidence from CV, Exa, transcript, and human notes must be visually separated.
- Candidate-safe content must be labeled.
- Internal-only content must be blocked from email payloads.
- Approval cards must show exact external action details.

### Ask IQ Panel

Supported prompts:

```text
What evidence is missing for this candidate?
Research this company for interviewer prep.
Generate round 1 interview questions.
Schedule round 1 tomorrow at 2pm.
Draft a candidate follow-up email.
What should we review next?
```

Assistant behavior:

- Explain current state.
- Propose next action.
- Generate approval card when external side effect is requested.
- Refuse to send, schedule, reject, or advance without approval.

## Backend Endpoint Map

```text
Workflow
  POST /api/workflows
  GET /api/workflows
  GET /api/workflows/{workflow_id}
  PATCH /api/workflows/{workflow_id}/state

Artifacts
  POST /api/workflows/{workflow_id}/artifacts
  GET /api/workflows/{workflow_id}/artifacts

Agents
  POST /api/workflows/{workflow_id}/screen
  POST /api/workflows/{workflow_id}/questions
  POST /api/workflows/{workflow_id}/ask
  POST /api/workflows/{workflow_id}/next-step

Research
  POST /api/research/company
  POST /api/research/role-market
  POST /api/research/interview-brief

Approvals
  POST /api/approvals
  GET /api/approvals
  POST /api/approvals/{approval_id}/approve
  POST /api/approvals/{approval_id}/reject

Workato
  POST /api/integrations/workato/schedule-interview
  POST /api/integrations/workato/reschedule-interview
  POST /api/integrations/workato/cancel-interview
  POST /api/integrations/workato/send-candidate-follow-up
  POST /api/integrations/workato/sync-stage
  POST /api/integrations/workato/callbacks/schedule-interview
  POST /api/integrations/workato/callbacks/follow-up

Google Workspace
  POST /api/integrations/google-calendar/create-approved
  POST /api/integrations/google-calendar/update-approved
  POST /api/integrations/google-calendar/cancel-approved
  POST /api/integrations/gmail/send-approved

Interviews
  POST /api/interviews/{round_id}/complete
  POST /api/interviews/{round_id}/notes
  POST /api/interviews/{round_id}/transcript

Audit
  GET /api/audit-log
  GET /api/provider-status
```

## Data Captured Per Workflow

```text
Candidate identity
Role scope
CV artifact
Rubric artifact
Exa research brief
Agent screening output
Interview question set
Approval requests
Workato job IDs
Calendar event IDs
Google Meet join URL
Gmail message IDs
Interview notes
Transcript artifact
Next-step recommendation
Final workflow state
Audit events
```

## Demo Workflow For Judges

1. Open the live app.
2. Show the pipeline dashboard and integration status.
3. Create a candidate workflow.
4. Upload a CV and paste job scope.
5. Generate AI screening.
6. Show evidence, gaps, and uncertainty labels.
7. Click `Research role and company with Exa`.
8. Show sourced interviewer brief.
9. Ask IQ: `generate round 1 questions`.
10. Ask IQ: `schedule round 1 tomorrow at 2pm with Google Meet`.
11. Show the approval card.
12. Approve scheduling.
13. Show Workato job completion and returned meeting link.
14. Mark interview complete or show transcript fixture.
15. Generate next-step recommendation.
16. Approve a candidate-safe Gmail follow-up.
17. Show audit log with AI, Exa, approval, Workato, and communication events.

## MVP Build Order

1. Implement local candidate workflow records.
2. Implement CV/job-scope upload and static extraction.
3. Implement AI screening using provider boundary.
4. Implement Exa research endpoint and UI tab.
5. Implement approval request model and approval card UI.
6. Implement Workato schedule-interview recipe call.
7. Implement Workato callback endpoint.
8. Implement Gmail follow-up recipe call.
9. Implement audit log UI.
10. Prepare one reliable live demo path and one mock fallback path.

## Non-Negotiable Safety Rules

- AI never sends candidate communication directly.
- AI never creates meetings directly.
- AI never rejects, advances, or selects a candidate directly.
- Workato recipes must reject payloads without `humanApproved: true`.
- Exa research must not be used to infer protected characteristics.
- Candidate-facing content must never include internal-only notes.
- Secrets and tokens must remain server-side.
- Every external side effect must have an approval and audit event.

## Success Criteria

For the hackathon, the workflow is successful if judges can see:

- A real candidate packet created from CV and job scope.
- AI reasoning tied to evidence.
- Exa used centrally for research enrichment, not bolted on.
- A real Workato-powered scheduling or Gmail action.
- Human approval before the external action.
- A clear audit trail proving what happened.
