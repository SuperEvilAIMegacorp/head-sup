# System Design: HeadSup TalentFlow IQ

## Hackathon Positioning

HeadSup TalentFlow IQ is a live, AI-assisted hiring coordination system based on the TalentFlow IQ fork. It helps recruiters and hiring teams screen applicants, schedule interviews, generate evidence-based interview questions, summarize interview signals, and communicate next steps while keeping humans in control of every consequential decision.

The project is aligned with the `Future of Work` and `AI-Native Organizations` challenge statements in `hackathon.md`:

- `Future of Work`: helps candidates and hiring teams navigate job opportunities with clearer evidence, structured feedback, and transparent process status.
- `AI-Native Organizations`: turns fragmented recruiting work across Gmail, Google Calendar, Google Meet, transcripts, CVs, and review notes into an agent-assisted workflow.
- `Security, Resilience & Defense`: applies approval gates, audit logs, access controls, and careful secret handling for external integrations.

## Judging Criteria Mapping

| Hackathon criterion | System design response |
| --- | --- |
| Proof of Work - Functionality | Ship a working local or hosted app with live CV upload, AI screening, Gmail drafting, Google Calendar or Workato scheduling, Google Meet link creation, and auditable approvals. |
| Problem Fit & Market Value | Recruiting teams lose time across scattered emails, calendars, interviews, resumes, and notes. The product creates a single evidence trail for faster and safer candidate review. |
| Design, Craft & Taste | The UI should make status, evidence, uncertainty, source labels, and approval decisions obvious instead of hiding them behind generic chat. |
| Innovation & Sponsor Technology | Uses an agentic reasoning layer to coordinate tools, evidence, Exa web research, and approved actions. OpenAI/Codex can be used for agent reasoning and development workflow; Exa is used centrally for grounded role, company, and market research instead of being bolted on. |

## Product Goal

Build a live hiring copilot that connects to real communication and meeting systems while preserving a strict boundary between AI-generated recommendations and human-approved actions.

The demo should prove:

1. A recruiter can upload a CV and job scope.
2. The agent extracts role requirements and candidate evidence.
3. The system identifies strengths, gaps, missing evidence, and suggested interview questions.
4. Exa retrieves current public context about the company, role, market, and interview topics.
5. The recruiter can ask for a scheduling action.
6. The app drafts a Gmail message or Google Calendar interview invite.
7. A human approves the action before any external side-effect API call is made.
8. The system records the action, provider, payload summary, research sources, and resulting meeting or email metadata.

## Core Users

| User | Need |
| --- | --- |
| Recruiter | Move candidates through screening, scheduling, interviews, and follow-up without losing context. |
| Hiring manager | Review role-linked evidence and interview signals without reading every raw artifact. |
| Interviewer | Receive focused questions based on unresolved candidate evidence gaps. |
| Candidate | Get clearer scheduling, process status, and safe applicant-facing communication. |
| Admin | Configure API credentials, permissions, audit logs, and integration boundaries. |

## System Context

```text
Recruiter / Hiring Team
  -> React/Vite web app
  -> Python backend API
  -> Agent orchestration layer
  -> Provider boundary
  -> Persistence and audit log
  -> Live integrations
       -> Gmail / Google Workspace APIs
       -> Google Calendar / Google Meet APIs
       -> Workato API recipes
       -> Exa Search API
       -> OpenAI / Foundry-compatible model provider
```

## High-Level Architecture

```text
Frontend
  React/Vite app
  Candidate pipeline workspace
  CV and job-scope upload
  Evidence review views
  Ask IQ assistant panel
  Approval cards for external actions
  Provider/source markers

Backend
  Python API server
  ATS workflow service
  Orchestrator chat service
  Agent provider boundary
  Integration service layer
  Policy and safety guardrails
  SQLite for hackathon demo persistence
  Audit log for tool calls and approvals

AI and Reasoning Layer
  Screening agent
  Question-generation agent
  Scheduling agent
  Communication agent
  Safety and visibility agent
  Orchestrator agent

Live Integrations
  Gmail API for draft/send candidate communication
  Google Calendar API for availability, interview events, and Google Meet links
  Gmail API for candidate communication
  Workato API recipes for cross-app scheduling and notifications
  Exa Search API for company, role, market, and interviewer research
  Optional Google Drive API for candidate add-on files
```

## Integration Strategy

The system should support both demo-safe mock mode and live integration mode.

| Mode | Purpose | External side effects |
| --- | --- | --- |
| Static fixture mode | Stable judge walkthrough with no credentials. | None |
| Mock provider mode | Deterministic local testing of agent and approval flows. | None |
| Live provider mode | Real API-backed demo with Gmail, Google Calendar, Google Meet, Workato, Exa, and model calls. | Only after human approval for side effects |

## Scheduling Execution Options

The application should support two scheduling execution paths. Both use the same approval card and audit model.

| Option | When to use | What executes the meeting action |
| --- | --- | --- |
| Direct Google Workspace | Best for a simpler hackathon build with fewer moving parts. | Backend calls Google Calendar API to create or update an event with Google Meet conference data. |
| Workato over Google Workspace | Best when the demo should show sponsor-style workflow automation across multiple tools. | Backend calls a Workato API recipe; Workato creates the Google Calendar event, Gmail notification, and any downstream updates. |

Recommended MVP choice:

- Implement `google_direct` first for predictable scheduling.
- Add `workato` second to show automation value if time allows.
- Keep the UI identical: the recruiter approves the same scheduling card regardless of execution path.

## External Integrations

### Gmail

Use Gmail API for candidate-safe communication.

Primary capabilities:

- Create draft outreach emails.
- Send approved candidate emails.
- Read recruiter-selected thread metadata when explicitly permitted.
- Store message IDs and thread IDs in the workflow record.

Safety constraints:

- AI may draft emails but cannot send without `humanApproved: true`.
- Candidate-facing emails must pass the safety and visibility check.
- Internal reviewer notes, scores, transcript excerpts, and private deliberation should never appear in candidate emails.

Recommended scopes for demo:

```text
https://www.googleapis.com/auth/gmail.compose
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly
```

### Google Calendar

Use Google Calendar API as the primary direct scheduling path.

Primary capabilities:

- Read recruiter availability.
- Create approved interview events.
- Add candidate and interviewer attendees.
- Attach Google Meet conferencing data.
- Update or cancel approved interview events.
- Store Calendar event IDs and Meet links in the workflow record.

Safety constraints:

- AI may draft calendar payloads but cannot create, update, or cancel events without `humanApproved: true`.
- Candidate-facing event descriptions must exclude internal notes, scores, rubric concerns, and transcript excerpts.
- All event changes must create audit records.

Recommended scopes for demo:

```text
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.readonly
```

### Google Meet

Use Google Meet through Google Calendar conference creation. The backend or Workato creates a Google Calendar event with conference data enabled, then stores the generated Meet link.

Primary capabilities:

- Create interview meeting links through Calendar event creation.
- Return and store `hangoutLink` or `conferenceData.entryPoints`.
- Include the Meet link in Gmail follow-up and calendar invite payloads.
- Allow rescheduling through approved Calendar event updates.

Expected Google environment variables:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_WORKSPACE_ADMIN_EMAIL=
GMAIL_SENDER_EMAIL=
GOOGLE_CALENDAR_ID=primary
```

### Workato

Use Workato when the team wants automation recipes to own the Google Workspace side effects instead of calling Google APIs directly from the backend.

Primary capabilities:

- Expose callable API recipes for scheduling, rescheduling, cancellation, Gmail follow-up, and internal notifications.
- Connect Google Calendar, Gmail, Slack, spreadsheets, and ATS-like tools without custom backend code for every system.
- Return external event IDs, Meet links, Gmail message IDs, and Workato job IDs to the backend callback endpoint.

Recommended Workato recipes:

- `schedule_interview`
- `reschedule_interview`
- `cancel_interview`
- `send_candidate_follow_up`
- `sync_candidate_stage`

Required controls:

- Scheduling must require `humanApproved: true`.
- Rescheduling and cancellation must require `humanApproved: true`.
- Workato recipes must reject payloads where `humanApproved` is not `true`.
- Workato callbacks must be authenticated with a shared callback secret.

Expected Workato environment variables:

```text
WORKATO_SCHEDULE_INTERVIEW_URL=
WORKATO_RESCHEDULE_INTERVIEW_URL=
WORKATO_CANCEL_INTERVIEW_URL=
WORKATO_SEND_FOLLOW_UP_URL=
WORKATO_API_TOKEN=
WORKATO_CALLBACK_SECRET=
```

### Exa Search

Use Exa Search as the live web research layer for public, current context that is not contained in the uploaded CV, job scope, rubric, or interview notes.

Primary capabilities:

- Search public web sources for company background, product context, market updates, and role-specific trends.
- Retrieve source URLs, titles, summaries, and highlights for interviewer prep.
- Generate research briefs that are clearly separated from candidate evidence.
- Support better interview questions by adding current role and industry context.
- Store source metadata so judges and reviewers can see where public context came from.

Recommended Exa research workflows:

- `company_research`: public company overview, product context, and recent developments.
- `role_market_research`: current skills, tools, and industry expectations for the target role.
- `interview_brief_research`: sourced talking points and question themes for interviewers.
- `risk_context_research`: optional policy or compliance context for hiring workflow safety.

Safety constraints:

- Exa research must not be used to secretly investigate a candidate's private life.
- Exa research must not infer protected characteristics or make hiring decisions.
- Exa results must be labeled as public web research, not validated candidate evidence.
- Candidate-facing messages must not cite or include Exa findings unless a recruiter explicitly approves candidate-safe wording.
- The system should store source URLs and summaries, but avoid copying large external page content into candidate records.

Expected Exa environment variables:

```text
EXA_API_KEY=
EXA_DEFAULT_NUM_RESULTS=5
EXA_ENABLE_LIVE_RESEARCH=true
```

### AI Provider

Use the existing TalentFlow IQ provider boundary so the frontend never calls a model directly.

Supported provider shape:

```text
mock provider
azure-openai provider
foundry provider
openai-compatible provider
```

Core rule:

- The model produces analysis, drafts, questions, and explanations.
- The backend executes tools only through typed services with validation, approval, and audit logging.

## Secret And API Key Handling

API keys and OAuth client secrets must remain server-side.

```text
.env
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_REDIRECT_URI=
  GOOGLE_WORKSPACE_ADMIN_EMAIL=
  GMAIL_SENDER_EMAIL=
  GOOGLE_CALENDAR_ID=
  WORKATO_SCHEDULE_INTERVIEW_URL=
  WORKATO_RESCHEDULE_INTERVIEW_URL=
  WORKATO_CANCEL_INTERVIEW_URL=
  WORKATO_SEND_FOLLOW_UP_URL=
  WORKATO_API_TOKEN=
  WORKATO_CALLBACK_SECRET=
  EXA_API_KEY=
  EXA_DEFAULT_NUM_RESULTS=
  EXA_ENABLE_LIVE_RESEARCH=
  OPENAI_API_KEY=
  AZURE_OPENAI_ENDPOINT=
  AZURE_OPENAI_API_KEY=
```

Rules:

- Do not commit `.env`, OAuth tokens, transcript files, uploaded CVs, or local databases.
- Do not expose secrets through `VITE_` variables.
- Store access tokens encrypted at rest for production. For hackathon local mode, store tokens in `.local-data/` only if `.gitignore` blocks it.
- Prefer OAuth consent for Google APIs and token-based Workato API recipe access instead of exposing raw credentials to the frontend.
- Rotate demo secrets after recording or public presentation.

## Data Model

```text
Candidate
  id
  name
  email
  role_id
  source
  created_at

Role
  id
  title
  job_scope_text
  rubric_json
  created_at

ApplicationWorkflow
  id
  candidate_id
  role_id
  stage
  provider_mode
  status_summary
  created_at
  updated_at

EvidenceArtifact
  id
  workflow_id
  type
  source_uri
  visibility
  extracted_text
  hash
  created_at

ResearchArtifact
  id
  workflow_id
  research_type
  query
  provider
  source_urls_json
  summary_json
  visibility
  created_at

AgentRun
  id
  workflow_id
  agent_name
  input_summary
  output_json
  provider
  created_at

ApprovalRequest
  id
  workflow_id
  action_type
  proposed_payload_json
  risk_level
  status
  approved_by
  approved_at

IntegrationEvent
  id
  workflow_id
  provider
  operation
  external_id
  request_summary_json
  response_summary_json
  created_at

InterviewRound
  id
  workflow_id
  round_number
  scheduled_start
  meeting_provider
  calendar_event_id
  meeting_join_url
  notes_status
  round_status
```

## Agent Responsibilities

| Agent | Responsibility | Forbidden actions |
| --- | --- | --- |
| Orchestrator agent | Coordinates workflow state, next steps, and tool proposals. | Cannot execute external side effects directly. |
| Screening agent | Compares CV evidence against job scope and rubric. | Cannot make final hiring decisions. |
| Research agent | Uses Exa results to prepare company, role, market, and interviewer context. | Cannot research private candidate life or treat public web context as validated candidate evidence. |
| Question agent | Generates targeted interview questions for unresolved evidence gaps. | Cannot ask discriminatory or unsupported questions. |
| Scheduling agent | Drafts interview slots, attendee lists, and calendar payloads. | Cannot create meetings without approval. |
| Communication agent | Drafts Gmail messages and candidate-safe updates. | Cannot send messages without approval. |
| Safety agent | Checks unsupported claims, visibility leaks, and unsafe hiring language. | Cannot override human approval requirements. |

## Core Workflows

### 1. Candidate Intake And Screening

```text
Recruiter uploads CV and job scope
  -> Backend stores artifacts
  -> Screening agent extracts evidence
  -> Safety agent checks unsupported claims
  -> UI shows strengths, partial matches, gaps, and source labels
  -> AgentRun and EvidenceArtifact records are stored
```

### 2. Exa Research Enrichment

```text
Recruiter clicks "Research role and company" or asks Ask IQ for interviewer prep
  -> Backend calls Exa Search with company, role, industry, and evidence-gap queries
  -> Research agent summarizes public sources into a company and role brief
  -> Backend stores source URLs, summaries, query metadata, and provider labels
  -> UI labels the output as Exa public web research, separate from CV evidence
  -> Interview planning can use the research brief for context and question themes
```

Example Exa-backed research outputs:

- Company and product overview.
- Recent public developments relevant to the role.
- Role-specific market expectations.
- Tools, technologies, and domain concepts to validate.
- Interviewer talking points with source URLs.
- Evidence-gap question themes grounded in the job scope and public role context.

### 3. Interview Planning

```text
Recruiter requests interview plan
  -> Question agent reads role, CV evidence, gaps, Exa research, and round state
  -> Agent returns targeted questions with evidence rationale
  -> UI separates internal interviewer notes from candidate-safe material
```

### 4. Gmail Candidate Communication

```text
Recruiter asks: "draft a follow-up email for this candidate"
  -> Communication agent drafts candidate-safe email
  -> Safety agent removes private internal context
  -> UI displays approval card
  -> Human approves
  -> Backend calls Gmail API
  -> IntegrationEvent stores Gmail message/thread metadata
```

### 5. Google Calendar / Workato Scheduling

```text
Recruiter asks: "schedule round 1 tomorrow at 2pm"
  -> Scheduling agent parses intent
  -> Backend validates attendees, time, timezone, and organizer
  -> UI displays approval card with exact payload summary
  -> Human approves
  -> Backend either calls Google Calendar directly or calls Workato
  -> Google Calendar event and Google Meet link are created
  -> Calendar event ID and Meet link are stored on InterviewRound
  -> IntegrationEvent stores Google or Workato metadata
```

### 6. Notes-Aware Follow-Up

```text
Google Meet interview completes
  -> Interviewer adds notes or uploads a transcript artifact
  -> Transcript or notes are stored as internal-only evidence
  -> Question agent generates next-round questions from updated evidence
  -> Safety agent blocks direct candidate exposure of internal notes or transcript details
```

## Approval Gates

The following actions require explicit human approval:

- Send Gmail message.
- Create Google Calendar event.
- Create Google Meet interview link.
- Update or cancel Google Calendar event.
- Cancel or reschedule an interview.
- Advance, reject, or mark a candidate as selected.
- Export candidate packet.
- Share feedback with a candidate.
- Use generated interview questions in production.

Approval payloads should show:

- Action type.
- Recipient or attendees.
- Time and timezone.
- Provider.
- Candidate-facing content.
- Internal-only fields excluded from the action.
- Risk warnings.

## API Surface

Suggested backend endpoints:

```text
POST /api/workflows
POST /api/workflows/{workflow_id}/artifacts
POST /api/workflows/{workflow_id}/screen
POST /api/workflows/{workflow_id}/ask
POST /api/workflows/{workflow_id}/questions

POST /api/research/company
POST /api/research/role-market
POST /api/research/interview-brief
GET /api/workflows/{workflow_id}/research-artifacts

POST /api/approvals
POST /api/approvals/{approval_id}/approve
POST /api/approvals/{approval_id}/reject

POST /api/integrations/gmail/draft
POST /api/integrations/gmail/send-approved
POST /api/integrations/google-calendar/create-approved
POST /api/integrations/google-calendar/update-approved
POST /api/integrations/google-calendar/cancel-approved
POST /api/integrations/workato/schedule-interview
POST /api/integrations/workato/reschedule-interview
POST /api/integrations/workato/cancel-interview
POST /api/interviews/{round_id}/notes

GET /api/provider-status
GET /api/audit-log
```

## Frontend Experience

Primary screens:

- Candidate pipeline.
- Candidate detail workspace.
- CV and job-scope upload.
- Evidence review.
- Exa research brief.
- Interview round planner.
- Ask IQ assistant.
- Approval center.
- Integration status panel.
- Audit trail.

Design requirements:

- Clearly label `mock`, `static`, and `live` provider modes.
- Clearly label Exa results as public web research with source URLs.
- Surface missing evidence instead of hiding it.
- Keep CV evidence, Exa research, interviewer notes, and AI interpretation visually separate.
- Separate candidate-safe and internal-only content visually.
- Show exact external actions before approval.
- Make integration failures understandable and recoverable.

## Deployment Plan For Hackathon

### Local Demo

```text
React/Vite frontend on localhost
Python API server on localhost
SQLite and local filesystem persistence
.env-backed credentials
Mock mode fallback
Live Gmail plus Google Calendar/Meet or Workato scheduling path enabled for the strongest demo moment
```

### Hosted Demo

```text
Frontend hosted on Vercel, Azure Static Web Apps, or similar
Backend hosted on Azure App Service, Render, Fly.io, or similar
Managed environment variables
HTTPS OAuth redirect URLs
SQLite replaced by Postgres if time allows
Blob storage for uploaded artifacts if time allows
```

## Demo Script

1. Open the live site.
2. Show the integration status panel with `Gmail connected`, `Google Calendar connected`, `Workato connected`, `Exa connected`, and `AI provider connected`.
3. Upload a CV and paste a job scope.
4. Generate role-linked candidate analysis.
5. Run Exa research for the company and role.
6. Show the sourced interviewer brief and explain that it is separate from candidate evidence.
7. Show strengths, gaps, missing evidence, and source labels.
8. Ask the assistant to draft candidate follow-up through Gmail.
9. Show the approval card and explain that AI cannot send without approval.
10. Approve the Gmail draft or send action.
11. Ask the assistant to schedule a Google Meet interview.
12. Approve the Google Calendar or Workato scheduling payload.
13. Show the returned Google Calendar event ID, Meet link, Exa research artifact, and audit event.
14. Explain how interviewer notes or uploaded transcripts feed next-round question generation.

## Reliability And Safety

Failure handling:

- If Gmail fails, keep the draft in the local workflow and show the API error.
- If Google Calendar scheduling fails, preserve the approval request and allow retry.
- If Workato scheduling fails, store the Workato error and allow retry without losing the approval context.
- If Exa search fails, keep the workflow usable and label research as unavailable instead of blocking screening or scheduling.
- If transcript or notes are unavailable, mark the round as `notes_pending` instead of blocking the workflow.
- If AI provider fails, fall back to mock or static mode for the demo.

Safety controls:

- Evidence-first outputs.
- Missing evidence labels.
- Exa research is labeled as public context, not candidate proof.
- Human approval for side effects.
- Candidate-safe versus internal-only visibility separation.
- Audit logs for agent runs, tool calls, approvals, and integration responses.
- No final hiring decision made by AI.

## Build Priorities

### Must Have

- CV and job-scope intake.
- Agent-generated screening summary.
- Exa company and role research brief with source URLs.
- Evidence gaps and interview questions.
- Ask IQ assistant.
- Human approval card.
- At least one live external integration: Gmail send/draft, Google Calendar/Meet scheduling, or Workato scheduling.
- Audit log for approved action.

### Should Have

- Gmail and Google Calendar/Meet live integration.
- Workato recipe path for scheduling and follow-up.
- Exa interview brief research using company, role, industry, and evidence-gap queries.
- Provider status panel.
- Interview notes or transcript upload path.
- Candidate-safe communication checker.

### Could Have

- Google Drive upload for candidate add-on materials.
- Admin integration setup screen.
- Hosted Postgres.
- Analytics dashboard for hiring funnel evidence coverage.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| OAuth setup consumes too much hackathon time. | Keep mock mode and enable one live integration first. |
| API keys or tokens leak. | Server-side env only, `.gitignore`, no `VITE_` secrets, rotate demo credentials. |
| AI invents candidate evidence. | Require source labels and missing-evidence language. |
| Exa results are mistaken for candidate evidence. | Label them as public research artifacts and keep them visually separate from CV, transcript, and human notes. |
| Exa returns irrelevant or stale sources. | Show source URLs, store query metadata, and allow recruiter dismissal or rerun. |
| Candidate receives unsafe internal content. | Run communication drafts through safety and visibility checks. |
| Google Meet transcript is unavailable during demo. | Use interviewer notes or transcript fixture upload and explain that transcript ingestion is separate from scheduling. |
| Judges question whether it works. | Show one real external side effect with approval and audit metadata. |

## Submission Assets

The project should prepare:

- Pitch deck link.
- Public repository link.
- Demo video link.
- Live website URL.
- Post link on X, Instagram, or LinkedIn with `#supcareer #build2026 #hackathon #PetaniAI`.

## One-Sentence Pitch

HeadSup TalentFlow IQ is an AI-native hiring workspace that connects CVs, job scopes, Exa web research, Gmail, Google Calendar, Google Meet, Workato automations, and interview notes into one approval-gated evidence trail so hiring teams move faster without letting AI make the final call.
