# 2026-06-27 Data Consent Feedback Dev Log

## Claim: data-consent-feedback
- Owner: nic-codex
- Started: 2026-06-27 14:30 +08:00
- Status: ready-for-review
- Goal: implement Workstream E so candidate feedback renders approved backend copy and candidates have a Data & Consent surface.
- Scope:
  - `frontend/src/pages/interviewee/Feedback.tsx`
  - `frontend/src/pages/interviewee/DataConsent.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `nic_notes/dev_logs/2026-06-27-data-consent-feedback.md`
- Avoid:
  - HR audit pages
  - backend lifecycle files
  - CV evidence and round workbench pages
  - `system_design/*`
  - `frontend/src/context/*`
  - `frontend/src/types/*`
- Expected output:
  - candidate feedback page prefers backend-approved feedback body when available
  - candidate-safe framing for follow-up and practice feedback
  - Data & Consent page and interviewee nav/route entry
- Current notes:
  - Backend lifecycle work is active separately; consume existing frontend workflow fields only.
  - Treat existing worktree changes in docs and backend logs as teammate/user work.
- Verification plan:
  - `npm run typecheck`
  - `npm run build` if practical
- Parallel-safe work:
  - HR audit/reset, backend lifecycle, evidence trail, and round workbench workers can continue in their claimed files.

## Changes
- `frontend/src/pages/interviewee/Feedback.tsx`: fetches candidate workflow feedback directly from the backend when a backend session exists, renders released `feedback.body`, removes hard-coded released feedback sections, and adds candidate-safe material/addendum/safety boundaries.
- `frontend/src/pages/interviewee/DataConsent.tsx`: added candidate Data & Consent page covering data used, HR visibility, correction/addendum options, approval gates, provider/automation receipts, and demo retention.
- `frontend/src/App.tsx`: added `/interviewee/data-consent` route.
- `frontend/src/components/layout/Sidebar.tsx`: added interviewee nav entry for Data & Consent.

## Verification
- `npm run typecheck` from `frontend`: passed.
- `npm run build` from `frontend`: passed; Vite reported the existing non-blocking chunk-size warning for the single app bundle.

## Decisions
- Read backend-approved feedback from `GET /api/candidate/workflows/wf_demo` instead of editing `frontend/src/context/*` or `frontend/src/types/*`.
- Do not fabricate a released feedback body when the workflow only has a release event; show a sync/contract notice until `feedback.body` is present.
- Data & Consent uses candidate-visible evidence/source counts and status summaries, not internal notes or sensitive addendum body content.

## Handoff / Next
- Remaining contract note: candidate feedback expects backend candidate workflow `feedback.body`, `feedback.status`, and optional `feedback.subject`.
- Earlier verification was briefly blocked while Workstream D rewrote `frontend/src/pages/interviewee/InterviewPrep.tsx`; rerun passed after that file was restored.
- Released scope:
  - `frontend/src/pages/interviewee/Feedback.tsx`
  - `frontend/src/pages/interviewee/DataConsent.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/components/layout/Sidebar.tsx`
