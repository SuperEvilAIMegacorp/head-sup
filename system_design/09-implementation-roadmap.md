# 09. Implementation Roadmap

## Build Strategy

Build the product around the hosted demo path first, then deepen integrations. The goal is not maximum platform breadth; it is a convincing, stable, humane end-to-end workflow.

Use this priority order:

1. Authenticated HR/interviewee product shell.
2. Shared workflow and seeded data.
3. Evidence mapping and transparency timeline.
4. Exa research and source display.
5. Approval cards.
6. Google Meet scheduling or Workato fallback.
7. Post-interview addendum.
8. Candidate-safe feedback/follow-up.
9. Audit trail.
10. Hosting and demo hardening.

## Phase 1: Product Shell

Exit criteria:

- Hosted or local app visibly reads as sup'work.
- HR and interviewee login accounts exist.
- Interviewee and HR views exist behind role-based auth.
- Shared seeded workflow loads.
- Timeline and core navigation work.

Tasks:

- Add sup'work branding.
- Add login screen.
- Add seeded HR and interviewee accounts.
- Add role-based routing.
- Build Candidate Home.
- Build Recruiter Pipeline or Candidate Packet.
- Seed demo candidate, role, and workflow.
- Add fixture provider status.

Verification:

- Frontend build.
- Interviewee account screenshot.
- HR account screenshot.
- Auth/session smoke check.

## Phase 2: Evidence And Transparency

Exit criteria:

- Interviewee sees role requirements mapped to CV evidence.
- HR sees the richer evidence packet.
- Visibility labels are present.

Tasks:

- Implement or adapt CV/job-scope extraction.
- Generate evidence mappings.
- Add evidence statuses.
- Add candidate-facing evidence cards.
- Add candidate correction/add-on affordance.
- Add visibility labels.

Verification:

- Evidence fixture renders.
- Interviewee API does not return internal notes.
- HR API shows internal details where allowed.

## Phase 3: Exa Research

Exit criteria:

- Recruiter can run or view Exa-backed company and role research.
- Candidate-safe role brief can be shown with source labels.

Tasks:

- Add Exa config.
- Add Exa client or provider wrapper.
- Add source normalization.
- Add research artifacts.
- Add source cards in UI.
- Add cached fallback.

Verification:

- Mock Exa test.
- Cached source fixture.
- Live call if key exists.

## Phase 4: Interview Planning

Exit criteria:

- Recruiter can generate interview questions tied to evidence gaps.
- Candidate can see safe prep themes.

Tasks:

- Add question-generation prompt or fixture.
- Add question rationale.
- Add expected signal.
- Add safety check.
- Add candidate prep brief shaping.

Verification:

- Questions reference evidence gaps.
- Candidate prep excludes internal notes.
- Unsafe questions are blocked or flagged.

## Phase 5: Approvals And Scheduling

Exit criteria:

- Recruiter approves a scheduling payload.
- Google Calendar/Meet event is created or Workato fallback works.
- Candidate schedule updates.

Tasks:

- Add approval request model.
- Add approval card UI.
- Add Google Calendar payload helper.
- Add Google scheduling endpoint.
- Add Workato scheduling fallback.
- Store event metadata.
- Add candidate schedule UI.

Verification:

- Scheduling rejects missing approval.
- Payload includes `conferenceData.createRequest`.
- Event metadata normalizes Meet link.
- Audit event created.

## Phase 6: Post-Interview Addendum

Exit criteria:

- Interviewee can submit a post-interview addendum after a round is marked complete.
- HR can review and acknowledge the addendum.
- Addendum status appears in both accounts with correct visibility.

Tasks:

- Add `candidate_addenda` and attachment model.
- Add addendum submission API.
- Add HR addendum review API.
- Add interviewee addendum UI.
- Add HR addendum review card.
- Add audit and receipt events.
- Add safety handling for special consideration.

Verification:

- Addendum submission requires interviewee auth.
- HR can see and acknowledge addendum.
- Interviewee can see receipt/acknowledgement.
- Special-consideration content is not summarized into discriminatory claims.

## Phase 7: Feedback And Follow-Up

Exit criteria:

- Interview notes can be added.
- Candidate-safe feedback can be generated.
- Follow-up can be approved.
- Gmail or Workato receipt displays.

Tasks:

- Add seeded/manual notes input.
- Include reviewed addendum context where appropriate.
- Add feedback generation.
- Add visibility checker.
- Add feedback release approval.
- Add Gmail draft/send or Workato action.
- Add candidate receipt.

Verification:

- Candidate feedback excludes raw internal notes.
- Candidate feedback does not expose sensitive addendum content unless appropriate and approved.
- Approval required before release.
- Workato/Gmail receipt stored.

## Phase 8: Audit And Provider Status

Exit criteria:

- Demo can show a complete audit chain.
- Provider readiness is visible.

Tasks:

- Add audit event taxonomy.
- Add provider status endpoint.
- Add audit UI.
- Add trace IDs across actions.
- Add error states.

Verification:

- Audit shows workflow creation, auth/session, evidence, Exa, approval, Google/Workato, addendum, feedback.
- Secrets are redacted.

## Phase 9: Hosting And Demo Hardening

Exit criteria:

- Public frontend URL.
- Public backend URL.
- CORS configured.
- Golden path rehearsed.
- Demo video recorded.

Tasks:

- Deploy frontend.
- Deploy backend.
- Configure env vars.
- Seed demo data.
- Seed HR and interviewee accounts.
- Pre-warm backend.
- Run smoke tests.
- Record demo.
- Prepare submission assets.

Verification:

- Hosted frontend loads.
- Hosted backend health works.
- Golden path completes.
- Two-laptop HR/interviewee demo completes.
- Live or fallback integration works.

## Workstream Split

| Workstream | Owns |
| --- | --- |
| Product/docs | Product narrative, demo script, system design, README. |
| Frontend shell | Login, navigation, Interviewee account, HR account, responsive layout. |
| CV evidence UI | Evidence cards, PDF/highlight display, add-on actions. |
| Research UI | Exa source cards, research panels, role brief. |
| Interview UI | Interview plan, prep brief, notes, feedback. |
| Addendum UI | Interviewee addendum form, attachments, HR review card, receipts. |
| Approvals UI | Approval cards, status states, edit/reject/approve. |
| Backend workflow | Workflow state, view models, evidence mapping, addendum state. |
| Auth | Demo users, sessions/JWTs, role-based API shaping. |
| Exa integration | Client, cache, sources, research endpoints. |
| Google scheduling | Calendar payload, Meet link handling, scheduling endpoint. |
| Workato/Gmail | Recipe triggers, callbacks, communication receipts. |
| Safety/QA | Visibility checks, redaction, transparency QA, Playwright screenshots. |
| Hosting/demo | CORS, deploys, env vars, smoke tests, video. |

## Test Plan

Backend unit tests:

- Evidence mapping statuses.
- Interviewee/HR visibility shaping.
- Auth role enforcement.
- Candidate addendum lifecycle.
- Exa source persistence.
- Approval required for side effects.
- Google Calendar payload includes conference data.
- Workato callback validates HMAC/shared secret.
- Candidate feedback excludes internal notes.
- Candidate addendum sensitive handling.
- Audit events are created.

Frontend checks:

- Interviewee account renders timeline.
- Evidence cards fit on mobile.
- HR research panel shows sources.
- Addendum form submits and HR review card updates.
- Approval card shows exact payload.
- Candidate schedule updates after scheduling.
- Feedback screen does not show internal notes.
- Audit view shows provider events.

Smoke scripts:

```powershell
npm run build
uv run python -m unittest discover -s tests -v
uv run python scripts/supwork_workflow_smoke.py --summary-only
uv run python scripts/google_calendar_smoke.py --dry-run
uv run python scripts/workato_webhook_smoke.py --dry-run
```

Commands depend on final stack, but the verification categories should remain.

## Acceptance Criteria

The MVP is demo-ready when:

- HR and interviewee accounts show the same workflow with role-shaped views.
- Login/auth works against the hosted backend.
- Evidence mapping is visible and constructive.
- Exa research has source URLs.
- Interview plan ties questions to evidence gaps.
- Approval card blocks unapproved side effects.
- Google Meet scheduling or Workato fallback works.
- Candidate schedule updates after approval.
- Post-interview addendum submission and HR acknowledgement work.
- Candidate-safe feedback requires approval.
- Audit log proves the flow.
- Hosted URL works.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Google OAuth blocks live scheduling | Use Workato Calendar fallback and fixture event. |
| Exa results are noisy | Cache strong demo sources and show source/freshness labels. |
| Workato callback is delayed | Show `automation_pending` and allow refresh. |
| AI provider fails | Use mock provider for golden path. |
| Internal notes leak to candidate | Visibility labels, API shaping, and safety checker. |
| UI feels recruiter-first | Start demo on the interviewee laptop and keep candidate timeline central. |
| Auth breaks in demo | Pre-seed accounts, keep sessions warm, and provide deterministic demo credentials. |
| Addendum includes sensitive content | Mark as sensitive, restrict to HR, and prevent AI from inferring protected characteristics. |
| Hosted backend cold starts | Pre-warm and keep health endpoint ready. |
| Too much scope | Prioritize one end-to-end workflow over broad feature count. |

## Open Decisions

1. Default demo region: recommend Singapore/APAC.
2. Google scheduling auth: OAuth refresh token for one demo organizer account, with Workato fallback.
3. Workato first recipe: recommend Gmail draft plus tracker row, or Google Meet fallback if Calendar direct blocks.
4. Email behavior: recommend Gmail draft for demo; sending only if approval and test account are safe.
5. Database: SQLite for hackathon demo unless hosted persistence requires Postgres.
6. Model provider: mock for golden path, live provider as enhancement.
7. Auth implementation: simple email/password or signed demo-session flow; avoid frontend-only role switching.

## Final Build Guidance

Cut anything that does not serve the golden path. The winning demo is not a full ATS; it is a clear proof that hiring can be more transparent for candidates and more governed for recruiters.




