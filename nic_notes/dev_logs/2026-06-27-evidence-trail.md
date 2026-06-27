# 2026-06-27 Evidence Trail Dev Log

## Claim: evidence-trail-and-cv-source-ux
- Owner: Newton / Codex
- Started: 2026-06-27 14:20 +08:00
- Status: complete
- Goal: add shared evidence-trail UX for candidate CV evidence and HR candidate packet without backend contract changes.
- Scope:
  - `frontend/src/pages/interviewee/CVEvidence.tsx`
  - `frontend/src/pages/hr/CandidatePacket.tsx`
  - `frontend/src/components/evidence/`
  - `nic_notes/dev_logs/2026-06-27-evidence-trail.md`
- Avoid:
  - backend API changes
  - HR audit/reset files
  - interview round workbench files
  - `system_design/*`
  - `frontend/src/context/*` and `frontend/src/types/*` unless absolutely necessary
- Expected output:
  - shared evidence trail or matrix component
  - source preview fields with fixture-safe fallbacks
  - candidate-safe and HR-specific evidence status language
- Current notes:
  - use existing workflow fields and local shaping rather than extending contracts
  - existing uncommitted system-design and general dev-log changes are treated as teammate work
- Verification plan:
  - `npm run typecheck` from `frontend`
  - `npm run build` from `frontend` if practical
- Parallel-safe work:
  - backend lifecycle, HR audit/reset, round workbench, and feedback/data-consent workstreams can continue in their claimed files

## Changes
- `frontend/src/components/evidence/EvidenceTrailMatrix.tsx`: added shared candidate/HR evidence trail matrix with requirement, source preview, gap/status, candidate action, candidate-supplied signal, interview-validation signal, and fixture-safe CV filename/location/excerpt/rationale fallbacks.
- `frontend/src/pages/interviewee/CVEvidence.tsx`: replaced local selected-card evidence UI with the shared trail, candidate-safe copy, candidate-visible filtering, and add-context action.
- `frontend/src/pages/hr/CandidatePacket.tsx`: replaced per-card evidence rendering with the shared HR trail that separates candidate-visible/internal evidence and summarizes strong, partial, missing, candidate-supplied, and interview-validation states.

## Verification
- `npm run typecheck` from `frontend`: failed on out-of-scope current worktree issue: `src/App.tsx` imports missing `@/pages/interviewee/InterviewPrep`.
- `npm run build` from `frontend`: failed on out-of-scope current worktree issue: Vite could not load `src/pages/interviewee/InterviewPrep` from `src/App.tsx`.

## Decisions
- Kept all data shaping local to the new evidence component and existing page files; did not edit backend APIs, shared context, or shared types.
- Treated candidate addenda and completed interview rounds as workflow-level signals because current data does not map them to individual evidence requirements.
- Used constructive copy: `evidence suggests`, `proof to strengthen`, `candidate-visible`, and `source-backed`.

## Handoff / Next
- Remaining data-contract note: richer CV source metadata such as real filename, page number, excerpt, rationale, and requirement-level addendum/interview-validation links should be exposed by the backend when available. The current UI uses existing `sourceLocation`, `evidence`, and `whyItMatters` with safe fallbacks.
- Released scope: `frontend/src/pages/interviewee/CVEvidence.tsx`, `frontend/src/pages/hr/CandidatePacket.tsx`, `frontend/src/components/evidence/`, `nic_notes/dev_logs/2026-06-27-evidence-trail.md`
