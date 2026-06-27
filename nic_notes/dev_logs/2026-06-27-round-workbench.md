# 2026-06-27 Round Workbench Dev Log

## Claim: round-workbench-and-candidate-prep
- Owner: Codex
- Started: 2026-06-27 14:25 SGT
- Status: complete
- Goal: make HR Interview Plan behave as a round workbench and make candidate Interview Prep round-aware and state-aware.
- Scope:
  - `frontend/src/pages/hr/InterviewPlan.tsx`
  - `frontend/src/pages/interviewee/InterviewPrep.tsx`
  - `frontend/src/components/rounds/`
  - `nic_notes/dev_logs/2026-06-27-round-workbench.md`
- Avoid:
  - backend lifecycle edits
  - audit/reset files
  - CV evidence page edits
  - `system_design/*`
  - `frontend/src/context/*` and `frontend/src/types/*` unless absolutely necessary
- Expected output:
  - HR round workbench with status rail, validation focus, evidence gaps, generated questions, notes/addendum context, and next action
  - candidate prep surface with before/scheduled/completed/addendum/feedback-pending states, answer-shape guidance, and proof areas
- Current notes:
  - use local shaping from existing workflow fields and preserve backend generate actions
  - keep candidate-facing copy constructive and non-deterministic
- Verification plan:
  - `npm run typecheck` from `frontend`
  - `npm run build` from `frontend` if practical
- Parallel-safe work:
  - backend lifecycle, audit/reset UI, evidence pages, and feedback/data-consent pages can proceed independently

## Changes
- `frontend/src/components/rounds/RoundStatusRail.tsx`: added shared round-state rail and state badge primitives.
- `frontend/src/components/rounds/EvidenceGapPanel.tsx`: added shared HR/candidate evidence-gap panel with separated copy.
- `frontend/src/components/rounds/AnswerShapeGuide.tsx`: added candidate-safe answer-shape guidance tied to proof areas.
- `frontend/src/pages/hr/InterviewPlan.tsx`: rebuilt as a round workbench with status rail, validation focus, evidence gaps, generated question bank, notes affordance, addendum context, safety boundary, and next action.
- `frontend/src/pages/interviewee/InterviewPrep.tsx`: rebuilt as a round-aware prep surface for pending, scheduled, completed, addendum, feedback-pending, and released-feedback states.

## Verification
- `npm run typecheck` from `frontend`: passed.
- `npm run build` from `frontend`: passed. Vite reported the existing non-blocking warning that the single app chunk is larger than 500 kB after minification.

## Decisions
- Kept all state shaping local to the owned pages and new `components/rounds/` files; did not edit shared context or types.
- Preserved the existing backend `generateInterviewPlan()` action and used fixture questions only as fallback display content.
- Kept candidate prep constructive and non-deterministic; recruiter-only notes and question rationale stay on the HR page.

## Handoff / Next
- Backend contract note: persistent interview notes are still not exposed as a typed frontend field, so the HR workbench provides an internal notes affordance and shows matching audit events when available.
- Backend contract note: richer round fields such as `validationFocus`, `manualNotes`, and `nextAction` would let these sections stop deriving state from current workflow fields.
- Released scope:
  - `frontend/src/pages/hr/InterviewPlan.tsx`
  - `frontend/src/pages/interviewee/InterviewPrep.tsx`
  - `frontend/src/components/rounds/`
