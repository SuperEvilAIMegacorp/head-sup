# 08. Hosting, Demo, And Delivery

## Hosted Demo Goal

sup'work needs a proper live hosted demo with both interviewee and HR accounts. The demo must prove that the product works as a real system with authentication, shared backend state, database persistence, and live integrations, not only as slides or local screenshots.

Minimum proof:

- Hosted frontend URL.
- Hosted backend URL.
- Seeded or uploaded candidate workflow.
- Interviewee and HR accounts.
- Role-based API responses from the same workflow.
- Exa-backed or cached research sources.
- One approved external action.
- Audit log proving the chain.

Preferred proof:

- Live Exa research call.
- Live Google Calendar event with Google Meet link.
- Live Workato recipe creating a Gmail draft or tracker row.

## Hosting Shape

```text
Frontend: Vercel, Netlify, Azure Static Web Apps, or equivalent
Backend: Render, Railway, Fly.io, Cloud Run, or equivalent
Database: SQLite for hackathon demo; Postgres if time allows
Auth: server-side sessions or JWTs with seeded HR/interviewee accounts
Secrets: backend environment variables only
CORS: restrict to hosted frontend origin
```

## Runtime Modes

| Mode | Purpose |
| --- | --- |
| Fixture mode | Stable walkthrough if provider credentials fail. |
| Mock provider mode | Deterministic AI outputs for judging. |
| Live integration mode | Real Exa, Google Calendar/Meet, Workato, Gmail, and model calls where configured. |

The hosted app should default to a reliable seeded workflow, then demonstrate live actions where available.

## Environment Setup

Backend environment:

```env
PORT=8787
FRONTEND_ORIGIN=https://your-frontend.example.com

SUPWORK_PROVIDER=mock

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

Frontend environment:

```env
VITE_SUPWORK_API_BASE=https://your-backend.example.com
```

Never commit:

- `.env`
- Google client secret
- Google refresh token
- Workato webhook URLs
- Exa key
- private resumes
- real transcripts
- local databases

## Demo Data

Seed one high-quality workflow:

- Candidate: Maya Tan.
- Target role: AI Solutions Engineer.
- Company: Example AI.
- Region/timezone: Singapore/APAC, Asia/Singapore.
- Resume fixture with evidence for technical depth and customer deployment.
- Role scope with clear requirements.
- Exa company and role research cache.
- Interview plan.
- Approval request.
- Scheduled meeting fixture or live event.
- Post-interview addendum fixture or live submission.
- Seeded interview notes.
- Candidate-safe feedback draft.
- Workato/Gmail receipt.

## Golden Demo Script

1. Open hosted sup'work on two laptops.
2. Laptop A logs in as `interviewee@demo.supwork.local`.
3. Laptop B logs in as `hr@demo.supwork.local`.
4. Interviewee account shows transparency timeline.
5. Interviewee account shows CV evidence mapped to role requirements.
6. Interviewee account shows constructive evidence statuses: `covered`, `partial`, `gap`, `unclear`.
7. HR account opens the same Candidate Packet.
8. HR runs or reveals Exa company and role research.
9. HR generates interview questions tied to evidence gaps.
10. HR opens Scheduling.
11. HR asks to schedule a real candidate interview.
12. HR sees and approves the scheduling card.
13. HR shows Google Calendar event ID and Google Meet link.
14. Interviewee account live-updates with confirmed schedule and prep brief.
15. HR marks interview complete or adds seeded/manual interview notes.
16. Interviewee account submits a post-interview addendum with clarification, special consideration, or document.
17. HR account receives and acknowledges the addendum.
18. HR generates candidate-safe feedback.
19. HR approves Gmail draft/send or Workato action.
20. Interviewee account shows updated receipt/status.
21. HR shows audit log with AI, Exa, approval, Google/Meet, addendum, Workato/Gmail events.

## Demo Timing

For a 3 to 4 minute video:

| Segment | Time |
| --- | ---: |
| Product thesis and candidate problem | 20s |
| Two-account login and candidate transparency timeline | 35s |
| CV evidence and role context | 35s |
| HR Exa research and interview planning | 40s |
| Approval-gated Google Meet scheduling | 45s |
| Interviewee schedule update and post-interview addendum | 35s |
| Feedback/follow-up and Workato/Gmail receipt | 35s |
| Audit trail and closing pitch | 25s |

## Live Proof Requirements

### Exa

Show:

- Query or research action.
- Source cards.
- Freshness/source labels.

Fallback:

- Cached source cards with clear `cached` label.

### Google Calendar / Meet

Show:

- Approval card.
- Event creation result.
- Meet link.
- Candidate schedule update.

Fallback:

- Workato-created event or mock event metadata with fallback label.

### Workato

Show:

- Approved action.
- Recipe run status.
- Callback/receipt artifact.

Fallback:

- Mock receipt with `fixture` label.

## Preflight Checklist

Before recording or presenting:

- Hosted frontend loads.
- Hosted backend health endpoint responds.
- CORS works from frontend to backend.
- Seed workflow loads.
- HR login works.
- Interviewee login works.
- HR and interviewee accounts can access the same workflow with different visibility.
- Exa provider status is correct.
- Google provider status is correct.
- Workato provider status is correct.
- Approval card creates a pending approval.
- Approved Google scheduling succeeds or fallback works.
- Candidate schedule updates.
- Interviewee addendum submission appears in HR account.
- HR addendum acknowledgement appears in interviewee timeline or receipt.
- Audit log shows approval and provider event.
- No secrets appear in UI, logs, or screenshots.
- Candidate-facing content does not include internal notes.

## Failure Handling During Demo

| Failure | Demo response |
| --- | --- |
| Exa live call fails | Switch to cached research artifact and explain freshness label. |
| Google auth fails | Use Workato Calendar fallback or scheduled fixture. |
| Meet conference pending | Show `conference_pending`, then refresh or use fixture event. |
| Workato callback delayed | Show `automation_pending` and audit request. |
| Model provider fails | Use mock provider output. |
| Auth/session fails | Use pre-seeded demo credentials and keep both browsers logged in before judging. |
| Addendum update is delayed | Refresh both accounts and show persisted addendum/audit event. |
| Backend cold start | Keep a health tab open and pre-warm before presentation. |

## Submission Assets

Required:

- Pitch deck link.
- Public repository link.
- Project demo video link.
- Live website URL.
- Social post link with `#supcareer #build2026 #hackathon #PetaniAI`.

Recommended:

- Architecture screenshot.
- Demo script.
- Safety and transparency matrix screenshot.
- Audit log screenshot after live side effect.
- One-page product narrative.

## Final Demo Claim

sup'work is not just a hiring copilot. It is a transparency layer for the interviewee and a governed workflow layer for HR. The demo should make that visible in the first minute.




