# 2026-06-27 Live Round Components Dev Log

## Claim: live-round-components
- Owner: nic-codex
- Started: 2026-06-27 14:44 SGT
- Status: complete
- Goal: create prop-driven presentational React components for reusable R1/R2/R3 live round workspaces.
- Scope:
  - `frontend/src/components/rounds/live/`
  - `nic_notes/dev_logs/2026-06-27-live-round-components.md`
- Avoid:
  - existing frontend files outside `frontend/src/components/rounds/live/`
  - pages, context, shared types, API clients, package files, and `system_design/`
- Expected output:
  - round selector/status strip
  - HR round detail component
  - candidate round detail component
  - local prop types and index exports
- Current notes:
  - components must not call backend or context directly
  - use existing UI primitives and `lucide-react`
  - keep candidate copy constructive and candidate-safe
- Verification plan:
  - `npm run typecheck` from `frontend` if practical
- Parallel-safe work:
  - page wiring, API contracts, backend round templates, audit/evidence work can continue independently

## Changes
- `frontend/src/components/rounds/live/RoundSelectorStatusStrip.tsx`: added prop-driven R1/R2/R3 selector/status strip with local round status types.
- `frontend/src/components/rounds/live/HrRoundDetail.tsx`: added HR-facing round detail surface for briefing, validation focus, question bank, transcript/manual evidence, addendum summary, and next action.
- `frontend/src/components/rounds/live/CandidateRoundDetail.tsx`: added candidate-safe round detail surface for briefing, prep themes, schedule/status, addendum availability/receipt, and next action.
- `frontend/src/components/rounds/live/index.ts`: added barrel exports for components and local prop types.

## Verification
- `npm run typecheck` from `frontend`: failed on existing out-of-scope `src/api/supworkClient.ts(260,7)` body typing error (`{} | null | undefined` is not assignable to `BodyInit | null | undefined`). No new live component errors were reported.

## Decisions
- Kept all props and exported types local to the new component files.
- Did not import shared workflow/types or call context/API hooks.
- Kept the selector usable with or without `onSelectRound`; locked/disabled rounds are still non-interactive.

## Handoff / Next
- Ready for page owners to import and map existing workflow state into the local prop shapes.
- Released scope:
  - `frontend/src/components/rounds/live/`
  - `nic_notes/dev_logs/2026-06-27-live-round-components.md`
