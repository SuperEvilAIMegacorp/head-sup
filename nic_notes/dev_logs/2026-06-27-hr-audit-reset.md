# 2026-06-27 HR Audit Reset Dev Log

## Claim: hr-audit-trace-reset-ui
- Owner: nic-codex
- Started: 2026-06-27 14:20 +08:00
- Status: active
- Goal: implement Workstream B by surfacing HR agent trace/provider/reset UI and local pipeline status/count fixes.
- Scope:
  - `frontend/src/pages/hr/Audit.tsx`
  - `frontend/src/pages/hr/Pipeline.tsx`
  - `frontend/src/components/audit/`
  - `nic_notes/dev_logs/2026-06-27-hr-audit-reset.md`
- Avoid:
  - backend endpoint changes
  - candidate evidence pages
  - round workbench pages
  - `system_design/*`
  - `frontend/src/context/*` and `frontend/src/types/*` unless absolutely necessary
- Expected output:
  - HR audit renders agent trace details, provider state, grouped event hints, and cautious demo reset control
  - pipeline status/count display is normalized locally if needed
- Current notes:
  - Existing backend exposes `/api/workflows/{workflow_id}/agent-trace` and `/api/demo/reset`; frontend API client should be consumed if available.
  - Workato is expected to remain visible as disabled/fallback, not called directly from frontend.
- Verification plan:
  - `npm run typecheck` from `frontend`
  - `npm run build` from `frontend` if practical
- Parallel-safe work:
  - backend lifecycle changes can continue outside this frontend scope
  - candidate evidence, round workbench, and feedback workstreams can proceed independently

## Changes
- `frontend/src/pages/hr/Audit.tsx`: replaced the simple audit list with backend-aware trace, provider status, reset, grouped event counters, and filtered audit event display.
- `frontend/src/components/audit/AgentTracePanel.tsx`: added agent-run trace rendering with operation/provider/mode/input/output summaries and related approval/tool/audit hints.
- `frontend/src/components/audit/ProviderStatusPanel.tsx`: added fixture/live/provider readiness display for model, Exa, Google Calendar, Gmail, Workato, database, auth, and storage without secrets.
- `frontend/src/components/audit/DemoResetControl.tsx`: added cautious two-click HR demo reset control.
- `frontend/src/pages/hr/Pipeline.tsx`: normalized `scheduled` and `interview_scheduled` stage display, removed hard-coded receipt count, and made next-interview display safe when no round exists.

## Verification
- `npm run typecheck` from `frontend`: passed.
- `npm run build` from `frontend`: passed; Vite reported the existing non-blocking single-chunk size warning.
- Earlier verification attempt briefly failed because `src/App.tsx` could not resolve `src/pages/interviewee/InterviewPrep.tsx` while another workstream was updating that path; rerun passed after the file was present again.

## Decisions
- Kept trace/provider payload shaping local to audit components to avoid shared type/context edits.
- Reset stays HR/backend-token gated and refetches workflow, trace, and provider status after completion.
- Workato is visible as disabled/direct-Google path rather than callable from frontend.

## Handoff / Next
- Status: complete.
- Remaining integration note: agent trace is only populated after backend actions such as evidence analysis, research, interview-plan generation, or feedback drafting.
- Released scope:
  - `frontend/src/pages/hr/Audit.tsx`
  - `frontend/src/pages/hr/Pipeline.tsx`
  - `frontend/src/components/audit/`
