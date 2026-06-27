# 2026-06-27 Backend Lifecycle Dev Log

## Claim: backend-lifecycle-feedback-correctness
- Owner: nic-codex
- Started: 2026-06-27 14:20 +08:00
- Status: complete
- Goal: implement Workstream A lifecycle correctness for addenda, feedback release bodies, stage normalization, and focused tests.
- Scope:
  - `supwork_backend/schemas.py`
  - `supwork_backend/store.py`
  - `supwork_backend/main.py`
  - `tests/`
  - `nic_notes/dev_logs/2026-06-27-backend-lifecycle.md`
- Avoid:
  - frontend UI files
  - `system_design/*`
  - provider rewrites beyond lifecycle correctness
  - Microsoft Teams / Graph as a primary path
- Expected output:
  - backend-enforced round-complete addendum submission
  - fixture-safe attachment/link metadata persistence
  - persisted HR addendum review notes
  - released feedback storing exact approved/edited body
  - normalized backend stage naming without breaking tests
  - focused unittest coverage
- Current notes:
  - Existing planning/doc changes are present in the worktree and are treated as teammate/user work.
  - Previous backend and tests claims are logged as released; this workstream owns only the listed backend lifecycle files.
- Verification plan:
  - `python -m unittest discover -s tests -v`
  - `python -m supwork_backend.main --smoke`
- Parallel-safe work:
  - frontend workers can continue UI work outside backend contracts, but should consume the new addendum and feedback fields after this lands.

## Changes
- `supwork_backend/schemas.py`: added metadata-only addendum attachment/link request fields, addendum review request fields, and edited/approved feedback release fields.
- `supwork_backend/store.py`: enforced candidate-only addendum submission after a matching completed round, normalized `scheduled` to `interview_scheduled`, persisted addendum metadata and HR review notes, added candidate acknowledgement receipts, and stored approved feedback release bodies/version metadata.
- `supwork_backend/main.py`: passed addendum metadata and review notes through API routes, bound feedback release approvals to the exact approved body, and rejected Gmail drafts whose subject/body differ from the approved payload.
- `tests/test_backend_workflow.py`: added focused lifecycle tests for stage normalization, premature addendum rejection, metadata/review-note persistence, candidate-safe review-note hiding, and exact edited feedback body release.

## Verification
- `python -m unittest discover -s tests -v`: passed 9 tests.
- `python -m supwork_backend.main --smoke`: passed (`smoke ok`).

## Decisions
- Canonical backend workflow stage after scheduling is now `interview_scheduled`; round status remains `scheduled` for the scheduled round itself.
- Addendum attachment handling stores metadata only and strips accidental `content`/`bytes` fields. Actual file upload/storage remains a future artifact path.
- HR `reviewNotes` persist for recruiter views and audit context but remain hidden from candidate addendum projections.
- Feedback release approval now records the exact candidate-facing body in the approval payload; Gmail draft/send must match that body before release is persisted.

## Handoff / Next
- Status: complete.
- Remaining frontend contract notes:
  - Candidate addendum submit may send `attachments` and `links` arrays as metadata; no binary upload is supported by this endpoint.
  - Recruiter acknowledge may send `{ "reviewNote": "...", "reviewStatus": "acknowledged" }`; omitting the body still works.
  - Feedback release approval may send `editedBody` or `approvedBody`; subsequent Gmail draft/send must use the same subject/body returned in the approval payload.
  - Workflow stage after scheduling should be treated as `interview_scheduled`; schedule/round status remains `scheduled`.
- Released scope:
  - `supwork_backend/schemas.py`
  - `supwork_backend/store.py`
  - `supwork_backend/main.py`
  - `tests/`
  - `nic_notes/dev_logs/2026-06-27-backend-lifecycle.md`
