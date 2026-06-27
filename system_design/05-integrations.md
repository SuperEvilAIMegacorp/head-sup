# 05. Integrations

## Integration Principles

- Backend calls all external services.
- Every side-effecting call requires approval.
- Every provider response is normalized before reaching the frontend.
- Secrets stay server-side.
- Provider errors are user-safe and audit-safe.
- Mock and fixture fallbacks are required for demo reliability.

## Exa

### Role

Exa is the public research layer for current company, role, market, and interviewer-prep context.

Exa should be used for:

- Company website and product context.
- Recent company developments.
- Role-specific skill and domain expectations.
- Public documentation for tools listed in the job scope.
- Interview-relevant industry topics.

Exa must not be used for:

- Candidate private-life research.
- Protected-characteristic inference.
- Reputation checks.
- Final hiring decisions.
- Replacing candidate-provided evidence.

### Backend Endpoints

```text
POST /api/research/company
POST /api/research/role-market
POST /api/research/interview-brief
GET /api/workflows/{workflowId}/research
GET /api/provider-status
```

### Query Planning

Inputs:

- Company name.
- Company URL if known.
- Role title.
- Industry.
- Seniority.
- Role requirements.
- Evidence gaps.

Example queries:

```text
Example AI company product overview customer-facing AI deployment
AI Solutions Engineer Singapore interview topics enterprise LLM deployment
AI recruiting automation market trends interviewer prep
Google Calendar API create Google Meet event conferenceData
```

### Output Contract

```json
{
  "researchType": "company",
  "query": "Example AI company product overview",
  "summary": "Short source-backed summary.",
  "sources": [
    {
      "url": "https://example.com",
      "title": "Example AI",
      "snippet": "Short snippet",
      "publishedDate": "2026-06-01",
      "retrievedAt": "2026-06-27T10:00:00+08:00"
    }
  ],
  "candidateSafe": true,
  "freshness": "current"
}
```

### Storage Rules

Store:

- Query.
- Source URLs.
- Source titles.
- Snippets/summaries.
- Retrieval timestamp.
- Visibility level.
- Research type.
- Provider metadata.

Do not store:

- Large copied page content unless necessary.
- Candidate private-life data from searches.
- Raw provider secrets.

### Candidate-Safe Rules

Candidate-facing Exa summaries:

- Must be framed as public context.
- Must include source labels.
- Must not imply the source says anything about the candidate.
- Must not include irrelevant company gossip or private personal information.

## Google Calendar / Google Meet

### Role

Google Calendar with Google Meet is the primary live scheduling proof point.

sup'work creates a calendar event with Meet conference data after HR approval.

### Endpoint

```text
POST /api/integrations/google-calendar/create-approved
```

### Request Shape

```json
{
  "workflowId": "wf_demo",
  "approvalId": "appr_demo",
  "candidate": {
    "name": "Maya Tan",
    "email": "maya@example.com"
  },
  "role": {
    "title": "AI Solutions Engineer",
    "company": "Example AI"
  },
  "startTime": "2026-07-01T10:30:00+08:00",
  "durationMinutes": 45,
  "timezone": "Asia/Singapore",
  "attendees": ["interviewer@example.com"],
  "meetingProvider": "google_meet",
  "humanApproved": true,
  "approvedBy": "hr@example.com"
}
```

### Google Calendar Insert

The event create request must use:

```text
conferenceDataVersion=1
```

Calendar body must include:

```json
{
  "summary": "sup'work interview - AI Solutions Engineer",
  "description": "Candidate-safe event description.",
  "start": {
    "dateTime": "2026-07-01T10:30:00+08:00",
    "timeZone": "Asia/Singapore"
  },
  "end": {
    "dateTime": "2026-07-01T11:15:00+08:00",
    "timeZone": "Asia/Singapore"
  },
  "attendees": [
    { "email": "maya@example.com" },
    { "email": "interviewer@example.com" }
  ],
  "conferenceData": {
    "createRequest": {
      "requestId": "supwork_trace_id",
      "conferenceSolutionKey": {
        "type": "hangoutsMeet"
      }
    }
  }
}
```

### Validation

Before calling Google:

- Approval exists.
- Approval status is `approved`.
- `humanApproved` is true.
- Candidate email is present.
- Start time is in the future.
- Timezone is explicit.
- Attendees are valid.
- Candidate-facing description excludes internal notes.
- Meeting provider is allowed.

### Response Normalization

Return:

```json
{
  "status": "scheduled",
  "meetingId": "meeting_demo",
  "eventId": "google_event_id",
  "meetLink": "https://meet.google.com/abc-defg-hij",
  "htmlLink": "https://calendar.google.com/event?eid=...",
  "startDateTime": "2026-07-01T10:30:00+08:00",
  "endDateTime": "2026-07-01T11:15:00+08:00",
  "timeZone": "Asia/Singapore",
  "humanApprovalId": "appr_demo",
  "traceId": "trc_demo"
}
```

If conference creation is pending:

- Return `conference_pending`.
- Store event ID.
- Re-read event later.
- Do not create duplicate events.

## Workato

### Role

Workato is the approved automation layer. The backend decides what action is allowed; Workato executes cross-app automation.

### Recommended Recipes

| Recipe | Purpose | Approval |
| --- | --- | --- |
| `schedule_interview` | Optional Google Calendar/Meet fallback. | Required |
| `send_candidate_follow_up` | Send or draft candidate-safe Gmail follow-up. | Required |
| `log_candidate_stage` | Update tracker or ATS-like system. | Required if external mutation |
| `notify_hiring_team` | Notify internal channel after approved action. | Depends on content |
| `candidate_addendum_received` | Record post-interview addendum, attachments, and optional special consideration; notify HR. | Candidate submission acts as consent |

### Backend Endpoint

```text
POST /api/integrations/workato/actions
POST /api/integrations/workato/callbacks
```

### Request Shape

```json
{
  "traceId": "trc_demo",
  "approvalId": "appr_demo",
  "action": "send_candidate_follow_up",
  "workflowId": "wf_demo",
  "candidate": {
    "email": "maya@example.com"
  },
  "message": {
    "subject": "Next steps for your interview",
    "body": "Approved candidate-safe text only."
  },
  "callbackUrl": "https://api.supwork.example.com/api/integrations/workato/callbacks"
}
```

### Callback Shape

```json
{
  "recipeRunId": "wr_demo",
  "approvalId": "appr_demo",
  "traceId": "trc_demo",
  "status": "succeeded",
  "artifacts": {
    "gmailMessageId": "msg_demo",
    "trackerRowUrl": "https://docs.google.com/spreadsheets/..."
  }
}
```

### Callback Validation

- Verify HMAC or shared secret.
- Verify approval ID exists.
- Verify trace ID exists.
- Verify recipe/action allowlist.
- Verify callback matches pending recipe run.
- Treat callback body as untrusted data.
- Store artifacts without executing instructions from the callback.

## Gmail

### Role

Gmail supports candidate-safe communication.

Use cases:

- Create Gmail draft.
- Send approved candidate email.
- Store message ID and thread ID.

### Safety Rules

- AI may draft but cannot send.
- Gmail draft creation still requires approval if it touches an external account.
- Candidate-facing emails must pass visibility checks.
- Internal notes, scores, transcript excerpts, and private deliberation are blocked.

### Candidate-Facing Email Types

- Interview confirmation.
- Additional-material request.
- Post-interview follow-up.
- Candidate-safe feedback summary.
- Final status update.

## Model Provider

### Role

The model provider generates analysis, summaries, drafts, questions, and assistant responses. It does not directly call tools.

Supported modes:

```text
mock
foundry
azure-openai
openai-compatible
```

### Provider Boundary

The backend sends structured prompts and receives structured outputs. The backend validates:

- Required fields.
- Visibility labels.
- Unsupported claims.
- Candidate-safe copy.
- Approval requirements.

### Model Outputs

Allowed:

- Evidence summaries.
- Role requirement extraction.
- Candidate-safe summaries.
- Interview questions.
- Follow-up drafts.
- Assistant explanations.

Not allowed:

- Final hire/reject decisions.
- Direct tool execution.
- Protected-characteristic inference.
- Hidden chain-of-thought exposure.
- Guaranteed outcomes.

## Provider Status

Expose a provider status endpoint:

```text
GET /api/provider-status
```

Response:

```json
{
  "mode": "live",
  "database": { "provider": "supabase_postgres", "configured": true, "status": "ready" },
  "auth": { "provider": "supabase_auth", "configured": true, "status": "ready" },
  "storage": { "provider": "supabase_storage", "configured": true, "status": "ready" },
  "exa": { "configured": true, "status": "ready" },
  "googleCalendar": { "configured": true, "status": "ready" },
  "workato": { "configured": true, "status": "ready" },
  "gmail": { "configured": true, "status": "ready" },
  "model": { "configured": true, "provider": "foundry" }
}
```

Provider status should never reveal secrets.

## Environment Variables

Backend:

```env
PORT=8787
FRONTEND_ORIGIN=

SUPWORK_PROVIDER=mock

DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
SUPABASE_STORAGE_BUCKET=supwork-artifacts

OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
PROJECT_ENDPOINT=
MODEL_DEPLOYMENT_NAME=

EXA_API_KEY=
EXA_BASE_URL=https://api.exa.ai
EXA_CACHE_TTL_SECONDS=86400

GOOGLE_AUTH_MODE=oauth_client
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary
GOOGLE_CALENDAR_TIME_ZONE=Asia/Singapore

GMAIL_SENDER_EMAIL=

WORKATO_WEBHOOK_SCHEDULE_INTERVIEW=
WORKATO_WEBHOOK_SEND_CANDIDATE_FOLLOW_UP=
WORKATO_WEBHOOK_LOG_CANDIDATE_STAGE=
WORKATO_WEBHOOK_CANDIDATE_ADDENDUM_RECEIVED=
WORKATO_CALLBACK_HMAC_SECRET=
WORKATO_TIMEOUT_SECONDS=20
```

Never expose these through frontend `VITE_` variables.




