# 10. Feature Recovery Plan

## Purpose

This document turns the TalentFlow IQ audit into an implementation plan for sup'work.

The audit showed that sup'work did not just lose a few fields. It lost a deeper workflow layer:

- agent-filled job, CV, round, feedback, and trace contracts
- candidate-safe and recruiter-only projections of the same workflow
- PDF/CV evidence inspection with source provenance
- an R1/R2/R3 round workbench with before, during, and after-interview states
- a visual evidence trail from resume gap to candidate addendum to interview validation
- Ask IQ-style action cards that could update workflow state after human approval

sup'work already has the right product direction and a working two-role demo shell. The recovery goal is to make that shell feel live, dynamic, humane, and source-backed instead of static.

## Current Sup'work Baseline

The current implementation supports:

- HR and interviewee login accounts.
- Role-shaped frontend routes for both users.
- Backend-aware workflow state with fixture fallback and polling.
- Recruiter and candidate workflow view models.
- Exa-backed or fixture-backed research artifacts.
- Evidence analysis and interview-plan generation endpoints.
- Approval-gated Google Calendar / Google Meet scheduling.
- Round completion to open post-interview addendum.
- Candidate addendum submission and HR acknowledgement.
- Feedback draft and release approval flow.
- Gmail draft/send fixture path.
- Audit events and agent trace endpoint.
- Demo reset endpoint.

Known weaknesses:

- Several frontend pages still render static, hard-coded, or local-only fields.
- Candidate feedback screen detects release events but does not render the backend-approved feedback body.
- HR addendum review notes are local-only.
- Addendum attachments are UI-only.
- Backend does not enforce that an interview round is complete before addendum submission.
- HR audit does not show agent trace details even though the backend exposes them.
- Stage naming is inconsistent between backend and frontend status chips.
- No candidate Data & Consent page.
- No real CV upload, artifact storage, or PDF source viewer.
- No visual evidence timeline or shared evidence matrix.
- No Ask IQ / action-card copilot surface.
- No Supabase-backed persistence or realtime path yet.
- Workato provider is documented but disabled in runtime status.

## Recovery Principles

Keep the build seeker-first.

The candidate should always know:

- what stage they are in
- what evidence is being used
- where that evidence came from
- what is missing or unclear
- what they can add, correct, or explain
- which messages and actions were approved by a human

The recruiter should always know:

- what is evidence-backed versus inferred
- what is candidate-visible versus internal
- what requires approval before an external action
- what source, model, provider, or fixture produced a field
- what changed after candidate addendum or interview notes

Do not revive TalentFlow IQ blindly:

- Keep Google Calendar / Google Meet as the primary meeting path.
- Treat Teams / Microsoft Graph as reference-only.
- Keep the product as a transparency and coordination layer, not an automated hiring decision engine.
- Avoid score-first UX. Evidence status, source labels, and next actions matter more than numeric ranking.
- Sensitive addendum content can be received and acknowledged without being summarized into risky protected-class inferences.

## Priority Tiers

### P0: Demo-Critical Recovery

These make the live two-laptop demo credible.

1. Fix backend lifecycle correctness.
   - Enforce round-complete before addendum submission.
   - Persist HR addendum review notes.
   - Persist edited feedback/follow-up text instead of approving a hard-coded draft.
   - Normalize stage labels between backend and frontend.
   - Seed at least one round object and enough trace/audit events to make a reset state feel complete.

2. Surface trace, provider, and reset controls in HR UI.
   - HR Audit should render agent runs, tool calls, approvals, integration receipts, and provider mode.
   - Add a visible demo reset control for rehearsal.
   - Show when data is live, fixture, or model-generated.

3. Restore the round workbench.
   - HR needs a single place for briefing, evidence gaps, interview questions, seeded/manual notes, addendum context, and next action.
   - Candidate needs safe prep before the interview and a clear addendum window after completion.
   - The round workbench should make the demo feel like a real hiring process, not separate static screens.

4. Restore the evidence trail.
   - Candidate and HR should see how a requirement maps to CV evidence, missing proof, addendum evidence, and interview validation.
   - Use cards and timelines first. Exact PDF overlays can come later.

5. Render candidate-safe feedback from backend state.
   - Candidate must see the exact approved message, not a hard-coded release state.
   - Feedback should explicitly be framed as follow-up or practice feedback, not an automated decision.

### P1: High-Value Dynamic Recovery

These deepen the demo after P0 is stable.

1. CV/job upload and agent-filled workflow generation.
   - Recover the old upload flow in a sup'work shape: CV PDF, job scope, candidate name, role brief, evidence mappings.
   - Store source metadata and generated artifacts.

2. PDF/evidence source viewer.
   - Show CV filename, page/source line, extracted excerpt, rationale, and evidence status.
   - Add visual source preview before exact coordinate overlays.

3. Candidate pre-interview correction/add-on.
   - Separate pre-interview evidence corrections from post-interview addendum.
   - Let candidates clarify CV evidence or add links before HR finalizes questions.

4. Ask IQ action bar.
   - Screen-aware assistant for HR first.
   - Suggested actions: generate questions, draft schedule, summarize addendum, draft follow-up, explain audit trail.
   - External actions must become approval cards before execution.

5. Multi-candidate demo matrix.
   - Recover one HR pool view with at least two seeded candidates and one active role.
   - Keep the golden path focused on one candidate, but show this can scale.

6. Workato receipts.
   - Add approved automation receipt shape for tracker row, reminders, or Gmail draft.
   - Frontend should never call Workato directly.

### P2: Post-Demo Depth

These are valuable but should not block the hackathon demo.

- Exact PDF highlight overlays with page bounding boxes.
- Live transcript ingestion.
- Rich multi-round R1/R2/R3 progression.
- Supabase realtime updates.
- Durable Supabase repository replacing the in-memory store.
- Full orchestrator chat that can mutate workflow state.
- Real multi-role organization administration.
- Advanced privacy controls for data retention/export/delete.

## Feature Inventory And Required Recovery

### 1. Global Journey Shell

Old capability:

- Hiring/applicant view switch, flow tabs, progress slider, reset flow, provider/source/status metadata, current step, next action.

Current sup'work:

- Real login accounts and role routing exist.
- Shell navigation exists.
- Workflow polling exists.
- Reset endpoint exists, but reset is not visible in UI.

Recovery:

- Add a compact workflow status strip on both roles: candidate, role, current stage, next human action, provider mode, last updated.
- Add HR-only reset control with confirmation copy for demo rehearsal.
- Show fixture/live provider badges where actions are performed.

Acceptance:

- Both laptops show the same stage after HR acts.
- HR can reset the workflow without terminal access.
- Provider state is visible without exposing secrets.

### 2. HR Pipeline And Pool

Old capability:

- Open requisition, role bullets, skill tags, candidate packet list, selected CV packet, CV source, fit signal, generated role brief, upload-to-analysis path, scheduling calendar.

Current sup'work:

- HR Pipeline shows one active workflow and counts.
- Some counts are hard-coded.
- No upload path or multi-candidate matrix.

Recovery:

- P0: remove hard-coded counts and compute from workflow data.
- P1: add a small demo matrix with active role and two candidates.
- P1: add upload entry point for CV/job scope, even if first backed by fixture analysis.

Acceptance:

- HR sees a credible pipeline, not only one static row.
- Counts match receipts, addenda, approvals, and research artifacts.

### 3. CV Evidence Analysis

Old capability:

- PDF evidence viewer, current-title/provider chips, evidence score, strong/partial/missing counts, grouped role rubric, highlights, source page/span/rationale, candidate-safe wording.

Current sup'work:

- Candidate CV Evidence page shows evidence cards and source location.
- HR Candidate Packet shows a broader evidence map.
- No PDF viewer, no upload, no grouped rubric, and some content is still generic.

Recovery:

- P0: add a shared evidence trail component that maps requirement -> source evidence -> gap -> candidate action -> HR status.
- P0: make candidate copy explicitly constructive and candidate-safe.
- P1: add source preview cards with CV filename/page/excerpt.
- P1/P2: add PDF preview and later exact highlights.

Acceptance:

- Candidate can answer what evidence was used and what proof would help.
- HR can distinguish strong, partial, missing, candidate-supplied, and interview-validated evidence.

### 4. Role Brief And Exa Research

Old capability:

- Job profile fields: title, department, full job text, overview, job points, must-have/important/helpful tags, criteria source text, keyword hints, interview loop, interviewer role needs.

Current sup'work:

- Role Brief shows research source cards.
- Some role-context prose is static.
- Exa is already backend-mediated.

Recovery:

- Add role-profile fields to the backend view models and seed.
- Candidate Role Brief should cite source-backed company/role claims.
- HR Research should show source date/URL/provider and whether the artifact is live or cached.

Acceptance:

- No current-market/company claim appears without a source card.
- Candidate sees role expectations without internal recruiter-only notes.

### 5. Scheduling

Old capability:

- Schedule intent, target round, interview type, duration, timezone, suggested slots, selected slot, postpone reason, interviewer emails, candidate email, subject, candidate-safe body, internal interviewer brief, approval card, event metadata.

Current sup'work:

- Approval-gated Google Calendar / Google Meet scheduling exists.
- Candidate schedule updates.
- There is no rich calendar availability UI yet.

Recovery:

- P0: keep direct Google Meet scheduling stable.
- P1: add suggested slot display and internal interviewer brief.
- P1: add reschedule/cancel approval cards if time allows.

Acceptance:

- HR sees the exact meeting payload before approving.
- Candidate sees only candidate-safe schedule details and Meet link.

### 6. Interview Round Workbench

Old capability:

- R1/R2/R3 pages with hiring tabs for Briefing, Questions, Transcript, Addendum.
- Applicant tabs for Briefing, Prep, Addendum.
- Round status rail, next action, validation focus, question bank, transcript excerpts, coding/system-design prompts, prep answer shape, Q&A prompts, addendum form.

Current sup'work:

- Interview Plan generates questions.
- Scheduling can mark round complete.
- Candidate Interview Prep has static themes plus evidence gaps.
- Addendum exists as a separate page.

Recovery:

- Create a round workbench model in the UI using current backend fields first.
- HR page sections:
  - status rail
  - validation focus
  - evidence gaps
  - generated questions
  - manual/seeded interview notes
  - addendum context
  - next action
- Candidate page sections:
  - safe prep themes
  - evidence to prepare
  - answer shape
  - schedule state
  - addendum window state

Acceptance:

- The demo can be roleplayed as before interview -> schedule -> interview complete -> addendum -> follow-up.
- Interview notes and addendum context influence the feedback draft or are clearly shown as pending.

### 7. Candidate Addendum And Evidence Add-Ons

Old capability:

- Candidate addendum with clarification, category, title, details, link type, URL, candidate-supplied evidence, validation state.
- Separate evidence showcase before/around interview.

Current sup'work:

- Post-interview addendum exists.
- Attachments are UI-only.
- Backend does not enforce round completion.
- HR review notes are local-only.

Recovery:

- P0: enforce post-interview addendum timing in backend.
- P0: persist HR review notes and acknowledgement.
- P0: add attachment metadata fields to API/store even if files are not uploaded yet.
- P1: add pre-interview correction/add-on flow.
- P1: add validation status for candidate-supplied evidence.

Acceptance:

- Candidate cannot submit a post-interview addendum before round completion through the API.
- HR notes survive refresh.
- Candidate sees receipt and acknowledgement without internal notes.

### 8. Review And Feedback

Old capability:

- Hiring review summary, reasons for, reasons against, decision actions, applicant-safe assessment, received materials, final decision note, feedback draft/release status.

Current sup'work:

- Feedback draft/release endpoints exist.
- Follow-Up page has editable text, but edits are not reliably submitted.
- Candidate feedback page uses release events but hard-coded message body.

Recovery:

- P0: approve and release the actual edited draft text.
- P0: candidate Feedback renders backend `feedback`.
- P0: show received materials and what was considered in candidate-safe terms.
- P1: add draft version history.

Acceptance:

- The exact HR-approved message appears to candidate after release.
- Internal notes and sensitive addendum content do not leak.

### 9. Audit, Trace, And Provider Status

Old capability:

- Agent runs, tool calls, human approvals, ATS artifact payloads, audit events, provider/fallback status.

Current sup'work:

- Audit events exist.
- Agent trace endpoint exists.
- HR Audit page does not consume trace detail.

Recovery:

- P0: HR Audit renders agent runs with inputs/outputs summary, provider mode, trace IDs, and related approval/tool/audit events.
- P0: show fixture/live provider status for Exa, Google Calendar, Gmail, model provider, Supabase, and Workato disabled state.
- P1: add downloadable or copyable audit summary for pitch/demo.

Acceptance:

- Judge can see what the AI generated, what the human approved, and which provider/tool executed.
- No secrets or private tokens are displayed.

### 10. Ask IQ / Action Cards

Old capability:

- Screen-aware chat with context line, message history, suggested actions, citations, scheduling action cards, workflow updates after approval.

Current sup'work:

- Backend model chat exists, but no full copilot UI.
- Actions are page-specific buttons.

Recovery:

- P1: add HR-side action bar before full chat.
- Suggested actions:
  - explain candidate evidence trail
  - generate/refine interview questions
  - draft schedule approval
  - summarize addendum for review
  - draft candidate-safe follow-up
  - explain audit trail
- P2: full chat history and workflow mutation.

Acceptance:

- Assistant never performs external actions directly.
- Suggested external actions become approval cards.

### 11. Data And Consent

Old capability:

- Candidate-safe projection was a first-class model.

Current sup'work:

- Candidate-facing pages use shaped views.
- Planned Data & Consent page is missing.

Recovery:

- Add candidate Data & Consent page:
  - what data is used
  - what HR can see
  - what the candidate can add/correct
  - what automation requires approval
  - retention/demo notice
- Add HR visibility labels where a field is internal-only or candidate-visible.

Acceptance:

- Candidate has a dedicated place to inspect data use and rights.
- UX reinforces that sup'work is humane and transparent, not surveillance.

## Data And API Recovery Plan

Add or extend these concepts in the sup'work data model.

### Job Profile

Fields:

- `title`
- `department`
- `sourcePath`
- `sourceType`
- `jobText`
- `overview`
- `jobPoints`
- `criteria`
- `criterionPriority`
- `criteriaSourceText`
- `keywordHints`
- `defaultInterviewLoop`
- `interviewerRoleNeeds`

Use:

- HR packet
- candidate role brief after redaction
- question generation
- Exa role-market research grounding

### Candidate Packet

Fields:

- `candidateId`
- `name`
- `currentTitle`
- `cvFilename`
- `cvSourcePath`
- `sourceType`
- `candidateSafeSummary`
- `currentStage`
- `recommendedNextRound`
- `evidenceGaps`
- `schedulingReadiness`

Use:

- HR pool/pipeline
- candidate home
- CV evidence cards

### CV Analysis

Fields:

- `highlights`
- `highlight.sourcePath`
- `highlight.page`
- `highlight.excerpt`
- `highlight.rationale`
- `highlight.bounds` for later PDF overlays
- `rubricSignals`
- `coverageCounts`
- `candidateSafeWording`
- `approvalRequired`

Use:

- candidate CV Evidence
- HR Candidate Packet
- interview planning

### Round Summary

Fields:

- `roundId`
- `roundNumber`
- `roundType`
- `status`
- `phasePanels`
- `validationFocus`
- `questionBank`
- `candidatePrep`
- `manualNotes`
- `transcriptEvidence`
- `candidateAddenda`
- `nextAction`

Use:

- HR round workbench
- candidate interview prep
- feedback drafting

### Addendum

Fields:

- `id`
- `roundId`
- `type`
- `title`
- `body`
- `specialConsideration`
- `sensitive`
- `attachments`
- `links`
- `submittedAt`
- `reviewStatus`
- `reviewNote`
- `acknowledgedAt`
- `candidateVisibleReceipt`

Use:

- post-interview addendum
- HR addendum review
- feedback safety checks

### Feedback

Fields:

- `draftId`
- `generatedBody`
- `editedBody`
- `approvedBody`
- `safetyStatus`
- `releaseStatus`
- `releaseChannel`
- `releasedAt`
- `receipt`
- `sourceMaterialSummary`

Use:

- HR follow-up
- candidate feedback
- audit

### Trace

Fields:

- `agentRunId`
- `workflowId`
- `operation`
- `provider`
- `mode`
- `inputSummary`
- `outputSummary`
- `citations`
- `relatedApprovalId`
- `relatedToolCallId`
- `createdAt`
- `visibleToCandidate`

Use:

- HR audit
- candidate receipts when safe
- demo credibility

## Proposed Endpoint Changes

Already exists and should be surfaced:

- `POST /api/demo/reset`
- `GET /api/workflows/{workflow_id}/agent-trace`
- `POST /api/recruiter/workflows/{workflow_id}/analyze-evidence`
- `POST /api/recruiter/workflows/{workflow_id}/rounds/{round_id}/complete`
- `POST /api/recruiter/workflows/{workflow_id}/feedback-draft`
- `POST /api/recruiter/workflows/{workflow_id}/feedback-release-approval`

P0 additions or extensions:

- Extend addendum submission request with attachment/link metadata.
- Reject candidate addendum submissions unless a relevant round is complete.
- Extend HR addendum acknowledgement with persisted review note.
- Extend feedback release request with edited body or approved body.
- Add or expose normalized stage constants to prevent `scheduled` versus `interview_scheduled` drift.
- Add seed data for one active round, fixture agent runs, fixture tool calls, and fixture approvals.

P1 additions:

- `POST /api/recruiter/workflows/{workflow_id}/rounds/{round_id}/notes`
- `POST /api/candidate/workflows/{workflow_id}/evidence-addenda`
- `POST /api/recruiter/workflows/{workflow_id}/upload-analysis`
- `GET /api/recruiter/demo-matrix`
- `POST /api/orchestrator/action-suggestions`
- Workato receipt/callback endpoints with HMAC validation.

## Frontend Recovery Plan

### Candidate Pages

Home:

- Add workflow strip with current stage, next action, last update, provider mode.
- Show receipt count from real receipts, not static text.

CV Evidence:

- Add evidence trail/matrix.
- Add source preview fields.
- Add candidate pre-interview correction affordance.

Role Brief:

- Replace static role copy with backend role profile and source-backed Exa claims.
- Keep recruiter-only assumptions out of candidate copy.

Interview Prep:

- Reshape into round-aware prep with before-interview and after-interview states.
- Show answer-shape guidance and evidence to prepare.

Schedule:

- Show selected slot, duration, timezone, organizer, Meet link, candidate-safe body.
- Add clear state for pending approval, scheduled, completed.

Post-Interview Addendum:

- Persist attachment/link metadata.
- Show backend-enforced availability state.
- Show acknowledgement receipt.

Feedback:

- Render backend-approved feedback body.
- Show material receipt summary and safety boundary.

Data & Consent:

- Add new page and nav item.
- Explain data used, visibility, correction/addendum rights, approvals, and demo retention.

### HR Pages

Pipeline:

- Compute counts from workflow.
- Normalize status badges.
- Add demo reset control or link to audit reset control.

Candidate Packet:

- Add evidence trail/matrix.
- Show source and visibility labels.
- Make internal note either persisted or clearly local draft.

Research:

- Show live/cached source status and source URLs.
- Tie findings to role brief and interview plan.

Interview Plan / Round Workbench:

- Make this the main round workbench.
- Show briefing, questions, evidence gaps, manual notes, addendum context, next action.

Scheduling:

- Show exact approval payload and interviewer brief.
- Keep Google Meet primary.

Addendum Review:

- Persist review note.
- Show sensitive handling boundary.
- Acknowledgement should update candidate receipt.

Follow-Up:

- Submit edited draft body.
- Show draft/source/safety status and release approval.

Audit:

- Render trace endpoint.
- Group events by agent, approval, tool, integration, candidate action.
- Show provider status and demo reset.

## Implementation Workstreams

### Workstream A: Backend Lifecycle And Feedback Correctness

Owns:

- `supwork_backend/schemas.py`
- `supwork_backend/store.py`
- `supwork_backend/main.py`
- `tests/`
- own dev log file

Goals:

- Enforce round completion before candidate addendum.
- Persist HR review note on addendum acknowledgement.
- Accept and store attachment/link metadata on addendum.
- Accept edited/approved feedback body.
- Normalize stage naming.
- Add tests for each lifecycle rule.

Avoid:

- frontend UI implementation
- broad provider rewrites

Verification:

- `python -m unittest discover -s tests -v`
- `python -m supwork_backend.main --smoke`

### Workstream B: HR Audit, Trace, Provider, And Reset UI

Owns:

- `frontend/src/pages/hr/Audit.tsx`
- `frontend/src/pages/hr/Pipeline.tsx` if needed for reset/status chip
- new frontend components under `frontend/src/components/audit/`
- own dev log file

Goals:

- Fetch and render agent trace.
- Group audit by AI run, human approval, provider/tool call, candidate action.
- Add visible reset control.
- Normalize stage display if possible without type conflicts.

Avoid:

- backend endpoint changes
- candidate evidence pages
- round workbench pages

Verification:

- `npm run typecheck`
- `npm run build`

### Workstream C: Evidence Trail And CV Source UX

Owns:

- `frontend/src/pages/interviewee/CVEvidence.tsx`
- `frontend/src/pages/hr/CandidatePacket.tsx`
- new frontend components under `frontend/src/components/evidence/`
- own dev log file

Goals:

- Add shared evidence trail/matrix.
- Show source preview, evidence status, gap, candidate action, HR validation state.
- Keep candidate copy humane and constructive.

Avoid:

- backend API changes
- HR audit/reset files
- interview round workbench files

Verification:

- `npm run typecheck`
- `npm run build`

### Workstream D: Round Workbench And Candidate Prep

Owns:

- `frontend/src/pages/hr/InterviewPlan.tsx`
- `frontend/src/pages/interviewee/InterviewPrep.tsx`
- new frontend components under `frontend/src/components/rounds/`
- own dev log file

Goals:

- Make HR Interview Plan behave as the round workbench.
- Add sections for validation focus, evidence gaps, questions, manual notes, addendum context, and next action.
- Make candidate prep round-aware and state-aware.

Avoid:

- backend lifecycle edits
- audit/reset files
- CV evidence page edits

Verification:

- `npm run typecheck`
- `npm run build`

### Workstream E: Data & Consent And Candidate Feedback Surface

Owns:

- `frontend/src/pages/interviewee/Feedback.tsx`
- new `frontend/src/pages/interviewee/DataConsent.tsx`
- route/nav additions needed for the new page
- own dev log file

Goals:

- Render backend-approved feedback body.
- Add candidate Data & Consent page.
- Add clear visibility, correction, addendum, approval, and retention explanations.

Avoid:

- HR audit pages
- backend lifecycle edits unless Workstream A exposes new fields first

Verification:

- `npm run typecheck`
- `npm run build`

## Recommended Execution Order

1. Workstream A first or in parallel with UI-only work because it fixes lifecycle truth.
2. Workstream B in parallel because the trace endpoint already exists.
3. Workstream C and D in parallel if they use new components and avoid shared type changes.
4. Workstream E can start with frontend-only copy and wire deeper fields after A lands.
5. Run full backend tests, frontend typecheck, and frontend build after integration.

## Demo Acceptance Checklist

The recovery work is successful when the demo can show:

- HR and interviewee accounts on two laptops sharing one backend workflow.
- HR generates or refreshes evidence/interview plan.
- Candidate can see evidence sources, gaps, and constructive next actions.
- HR approves Google Meet scheduling.
- Candidate sees schedule and prep.
- HR marks interview complete.
- Candidate submits an addendum with a link or attachment metadata.
- HR sees, notes, and acknowledges the addendum.
- HR approves an edited candidate-safe follow-up.
- Candidate sees the exact approved feedback.
- HR Audit shows AI generation, human approval, Google/Gmail fixture or live provider action, candidate addendum, and trace details.
- Demo reset returns the workflow to a clean start state.

## Risks

| Risk | Mitigation |
| --- | --- |
| Too many features spread the demo thin | Prioritize P0 and make every screen contribute to the golden path. |
| Candidate view becomes recruiter-centric | Start demo on candidate Home and keep every field candidate-safe by default. |
| Sensitive addendum content leaks into generated feedback | Treat special consideration as restricted context and require explicit approval before any mention. |
| UI workers conflict on shared context/types | Prefer component-local shaping; coordinate before editing `frontend/src/types/` or context files. |
| Backend changes break fixture fallback | Add lifecycle tests and keep fixture mode deterministic. |
| Provider setup fails on demo day | Show fixture/live mode clearly and keep approval receipts visible. |

## Definition Of Done

P0 is done when:

- backend lifecycle tests pass
- frontend typecheck and build pass
- candidate feedback renders backend-approved body
- addendum lifecycle is enforced and acknowledged
- HR audit renders agent trace and reset
- evidence trail is visible to both roles
- round workbench supports the live roleplay path
- no candidate page exposes internal-only notes

