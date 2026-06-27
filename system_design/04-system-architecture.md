# 04. System Architecture

## Architecture Overview

```text
Candidate Portal / Recruiter Workspace
  -> Frontend app
  -> Authentication and role routing
  -> Backend API
  -> Workflow service
  -> Agent orchestration
  -> Safety and visibility policy
  -> Persistence and audit
  -> Integration services
       -> Exa
       -> Google Calendar / Google Meet
       -> Gmail
       -> Workato
       -> Model provider
```

sup'work is built around one core rule: the backend is the control plane. The frontend never calls Exa, Workato, Google, Gmail, or model providers directly.

Supabase is the preferred hosted data platform for the hackathon build because it gives the team managed Postgres, Auth, Storage, Realtime primitives, and an admin dashboard in one service. sup'work should use Supabase Postgres as the durable source of truth, but workflow reads and writes still pass through the backend API so approval checks, role-shaped visibility, and audit logging remain enforceable.

## Logical Components

### Frontend App

Responsibilities:

- Candidate portal.
- Recruiter workspace.
- Login screen and role-based routing.
- Shared transparency timeline.
- CV evidence UI.
- Research source display.
- Interview plan display.
- Approval cards.
- Schedule and Meet link display.
- Post-interview addendum submission and review UI.
- Feedback release UI.
- Workato/Gmail receipt display.
- Audit and provider status views.

Frontend must not:

- Store API secrets.
- Call Exa directly.
- Call Workato webhooks directly.
- Create calendar events directly.
- Send email directly.
- Decide visibility by string matching alone.

### Backend API

Responsibilities:

- Authentication and demo-user identity.
- Supabase Auth token verification or backend-issued demo sessions.
- Role-based access control for HR and interviewee accounts.
- Workflow state machine.
- Artifact upload and extraction.
- Evidence mapping.
- Agent orchestration.
- Exa query planning and source persistence.
- Approval enforcement.
- Google Calendar / Meet execution.
- Workato execution and callback verification.
- Gmail draft/send execution.
- Audit logging.
- Visibility filtering.
- Provider status.

The backend may use Supabase service credentials for database and storage operations. Those credentials must never be shipped to the frontend.

### Workflow Service

The workflow service owns:

- Current stage.
- Allowed transitions.
- Interviewee and HR view models.
- Timeline events.
- Approval requirements.
- Error states.

It prevents accidental bypass of approvals and visibility rules.

### Agent Orchestration Layer

Agents produce analysis, drafts, and proposals. They do not execute side effects.

| Agent | Responsibility |
| --- | --- |
| Orchestrator | Summarizes state, routes intents, proposes next actions. |
| Evidence agent | Extracts and maps candidate evidence to role requirements. |
| Research agent | Summarizes Exa public research. |
| Question agent | Generates interview questions tied to evidence gaps. |
| Scheduling agent | Drafts schedule payloads. |
| Communication agent | Drafts candidate-safe emails and follow-ups. |
| Safety agent | Checks unsupported claims, visibility leaks, and unsafe language. |

### Integration Service Layer

Integration services wrap external providers behind typed backend APIs.

```text
ExaClient
GoogleCalendarClient
GmailClient
WorkatoClient
ModelProvider
```

Each service should:

- Validate inputs.
- Redact secrets in logs.
- Return normalized metadata.
- Record tool calls or integration events.
- Fail safely.

## Deployment Topology

### Local Development

```text
Frontend: localhost Vite app
Backend: localhost Python or Node API
Database: SQLite for fast fixture mode, or Supabase local/hosted Postgres for integration mode
Storage: local fixture files, or Supabase Storage bucket for upload flows
Providers: mock by default, live optional
```

### Hosted Demo

```text
Frontend: Vercel, Netlify, Azure Static Web Apps, or equivalent
Backend: Render, Railway, Fly.io, Cloud Run, or equivalent
Database: Supabase Postgres
Storage: Supabase Storage for CVs, addendum attachments, and generated artifacts that need file backing
Auth: Supabase Auth or backend-issued sessions mapped to seeded HR/interviewee accounts
Secrets: backend environment variables only
```

### Production Direction

```text
Frontend: static hosting with HTTPS
Backend: containerized API service
Database: Postgres, with Supabase acceptable until scale or compliance needs justify a different managed Postgres
File storage: Supabase Storage or equivalent object storage
Queue: background jobs for slow integrations
Secrets: managed secret store
Auth: role-based access control
Audit: immutable event log
```

## Supabase Boundary

Use Supabase for:

- Postgres tables for workflows, approvals, generated draft versions, provider events, receipts, and audit events.
- Auth identities for seeded HR and interviewee demo users if this is faster than custom auth.
- Storage buckets for CV uploads, addendum attachments, and generated exports.
- Optional Realtime subscriptions for candidate timeline, schedule, addendum, and receipt updates.

Do not use Supabase to bypass backend rules:

- The frontend must not directly mutate workflow tables.
- Row-level security should deny broad client access by default.
- The backend should shape interviewee and HR view models explicitly.
- Storage uploads should go through backend-issued signed URLs or backend proxy validation.
- Service-role credentials stay server-side only.

## Runtime Modes

| Mode | Purpose | External side effects |
| --- | --- | --- |
| Fixture mode | Stable judge walkthrough with no credentials. | None |
| Mock provider mode | Deterministic local testing of agent and approval flows. | None |
| Live provider mode | Real Exa, Google, Gmail, Workato, and model calls. | Only after approval |

The hosted demo should support switching internally between fixture and live paths so failures do not kill the presentation.

## Request Flow: Evidence Mapping

```text
Frontend uploads CV/job scope
  -> Backend stores artifacts
  -> Document extraction
  -> Evidence agent maps role requirements to candidate evidence
  -> Safety agent checks unsupported claims
  -> Workflow service stores evidence mapping
  -> Interviewee and HR view models are shaped separately
```

## Request Flow: Exa Research

```text
Recruiter requests research
  -> Backend validates workflow and role
  -> Research service plans Exa queries
  -> Exa client retrieves public context
  -> Sources are normalized and stored
  -> Research agent summarizes with source references
  -> Safety agent labels candidate-safe portions
  -> UI shows research artifact and source cards
```

## Request Flow: Scheduling

```text
Recruiter asks to schedule
  -> Scheduling agent drafts payload
  -> Backend creates approval request
  -> Recruiter approves
  -> Backend validates approval and payload
  -> Google Calendar or Workato creates event
  -> Backend stores event metadata
  -> Candidate timeline updates with Meet link
  -> Audit event records the chain
```

## Request Flow: Authentication And Two-Account Demo

```text
HR opens hosted sup'work on laptop A
  -> Logs in as HR demo account
  -> Backend creates authenticated session with role=hr
  -> HR receives HR-shaped workflow view

Interviewee opens hosted sup'work on laptop B
  -> Logs in as interviewee demo account
  -> Backend creates authenticated session with role=interviewee
  -> Interviewee receives candidate-shaped workflow view

Both sessions operate on the same workflow ID
  -> Backend enforces role-based visibility
  -> Timeline, schedule, addendum, receipts, and audit updates persist to Supabase Postgres
  -> Optional Supabase Realtime notifies both sessions to refresh shaped backend views
```

## Request Flow: Candidate Feedback Release

```text
Interviewer adds notes
  -> Backend stores internal-only notes
  -> Candidate may submit post-interview addendum
  -> Backend stores addendum as candidate-supplied context
  -> HR reviews or acknowledges addendum
  -> Agent drafts feedback
  -> Safety agent separates candidate-safe content
  -> Recruiter reviews and approves release
  -> Candidate feedback view updates
  -> Audit event records release
```

## Security Boundaries

Frontend:

- No secrets.
- No direct provider calls.
- Receives already-shaped interviewee or HR view models.

Backend:

- Owns secrets.
- Owns auth sessions and role checks.
- Owns approvals.
- Owns provider calls.
- Owns visibility shaping.

Database:

- Stores visibility labels.
- Stores audit events.
- Stores provider metadata, not raw secrets.
- Uses Supabase Postgres `jsonb` fields for flexible provider payload summaries and generated-content context.
- Uses relational foreign keys for workflow, approval, draft-version, integration-event, and audit chains.

External providers:

- Receive minimal required data.
- Never receive internal reasoning unless needed and approved.

## Observability

Track:

- Request trace IDs.
- Agent run IDs.
- Approval IDs.
- Provider call IDs.
- Integration event IDs.
- Workato recipe run IDs.
- Google Calendar event IDs.
- Gmail message/thread IDs.

Every live side effect should be traceable from:

```text
user action -> approval -> provider request -> provider response -> workflow state -> audit event
```

## Error Handling

| Failure | Expected behavior |
| --- | --- |
| Exa unavailable | Show cached research or `research unavailable`; do not block screening. |
| Model provider unavailable | Fall back to mock/static output for demo. |
| Google Calendar fails | Preserve approval, show error, offer Workato fallback. |
| Meet link pending | Show `conference_pending`, retry/re-read event. |
| Workato callback delayed | Show `automation_pending`; allow refresh. |
| Gmail fails | Preserve local draft and show provider-safe error. |
| Notes unavailable | Allow seeded/manual notes; do not require live transcript. |

## Testing Architecture

Backend tests:

- State transition validation.
- Approval enforcement.
- Visibility shaping.
- Exa source persistence.
- Google event payload generation.
- Workato callback verification.
- Candidate-safe feedback filtering.
- Audit event creation.

Frontend tests:

- Candidate view renders timeline and evidence cards.
- Recruiter view renders research, questions, approvals.
- Approval card handles pending/approved/rejected.
- Candidate feedback does not display internal notes.
- Mobile layout has no horizontal overflow.

Smoke tests:

- Full fixture workflow.
- Exa research dry run or cached source load.
- Google Calendar dry-run payload.
- Optional live Google scheduling.
- Workato webhook dry run.




