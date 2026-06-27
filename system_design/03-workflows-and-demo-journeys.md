# 03. Workflows And Demo Journeys

## Workflow Objective

sup'work coordinates the hiring process from candidate intake to post-interview follow-up while making the candidate experience more transparent and humane.

Core workflow:

```text
Candidate intake
  -> CV and role evidence mapping
  -> Exa-powered public role/company research
  -> recruiter evidence review
  -> interview question generation
  -> human-approved scheduling
  -> Google Calendar / Meet or Workato execution
  -> interview notes captured
  -> candidate post-interview addendum window
  -> candidate-safe feedback and next-step draft
  -> human-approved communication
  -> candidate-visible receipt and audit trail
```

## Actors

| Actor | Role |
| --- | --- |
| Candidate / interviewee | Uploads CV, reviews evidence, sees timeline, attends interview, submits optional post-interview addendum, receives approved feedback or next-step communication. |
| Recruiter | Owns workflow, reviews AI output, approves scheduling and communication. |
| Hiring manager | Reviews evidence and interview signals, approves progression where appropriate. |
| Interviewer | Uses interview brief, conducts interview, adds notes. |
| AI orchestrator | Explains workflow status, drafts outputs, proposes next actions. |
| Exa | Retrieves public web context for company, role, market, and interview prep. |
| Workato | Executes approved cross-app automation. |
| Backend API | Enforces state, approvals, visibility, validation, persistence, and audit. |

## Workflow States

```text
created
  -> intake_ready
  -> evidence_mapped
  -> research_enriched
  -> recruiter_review
  -> interview_planning
  -> schedule_pending_approval
  -> scheduled
  -> interview_completed
  -> addendum_window_open
  -> notes_ready
  -> follow_up_pending_approval
  -> follow_up_sent
  -> closed
```

Rules:

- AI can suggest state transitions but cannot finalize consequential transitions.
- Scheduling, rejection, advancement, candidate feedback, and external communication require human approval.
- Candidate-facing visibility is computed explicitly, not inferred from text.
- Every external side effect creates an audit event.
- The candidate timeline may show redacted status for internal-only steps.

## State Transition Details

| From | To | Trigger | Approval needed | Candidate-visible |
| --- | --- | --- | --- | --- |
| `created` | `intake_ready` | Candidate or recruiter creates workflow and adds core artifacts. | Candidate consent for upload. | Yes |
| `intake_ready` | `evidence_mapped` | Evidence agent maps CV to role requirements. | No external action. | Yes |
| `evidence_mapped` | `research_enriched` | Recruiter runs Exa research. | No, unless published to candidate. | Partial |
| `research_enriched` | `recruiter_review` | Recruiter opens review. | No. | Status only |
| `recruiter_review` | `interview_planning` | Recruiter requests interview plan. | Review before use. | Prep themes only |
| `interview_planning` | `schedule_pending_approval` | Scheduling payload drafted. | Yes before event creation. | Status only |
| `schedule_pending_approval` | `scheduled` | Google/Workato scheduling succeeds. | Already approved. | Yes |
| `scheduled` | `interview_completed` | Interview marked complete. | No. | Yes |
| `interview_completed` | `addendum_window_open` | Interview round closes and candidate may submit addendum. | No; candidate owns submission. | Yes |
| `addendum_window_open` | `notes_ready` | Notes/addendum window closes or addendum is submitted. | No release yet. | Status and submitted receipt |
| `notes_ready` | `follow_up_pending_approval` | Draft feedback or follow-up generated. | Yes before release/send. | Status only |
| `follow_up_pending_approval` | `follow_up_sent` | Approved message sent or draft created. | Yes. | Yes |
| `follow_up_sent` | `closed` | Workflow closed by human. | Yes for candidate communication. | Yes |

## End-To-End Workflow

### 1. Candidate Intake

Candidate actions:

- Opens hosted candidate portal.
- Uploads CV or selects seeded demo CV.
- Confirms consent for evidence extraction.
- Reviews what the system will and will not share.

Recruiter actions:

- Creates or opens candidate workflow.
- Adds job description, role scope, and optional rubric.
- Invites candidate if candidate did not start the workflow.

System output:

- Candidate profile.
- Role profile.
- Uploaded artifacts.
- Initial candidate timeline.
- Audit events for creation and upload.

### 2. Evidence Mapping

System actions:

- Extracts role requirements from job scope.
- Extracts candidate evidence from CV.
- Maps requirements to statuses: `covered`, `partial`, `gap`, `unclear`.
- Creates candidate-safe summary.
- Creates recruiter-internal evidence notes.

Candidate sees:

- Evidence coverage.
- Source labels.
- Constructive add-on suggestions.

Recruiter sees:

- Evidence map.
- Gaps to validate.
- Interview validation needs.
- Internal note area.

### 3. Exa Research Enrichment

Recruiter action:

- Clicks `Research role and company`.
- Or asks assistant for interviewer context.

System actions:

- Calls Exa for company and role context.
- Stores source URLs and summaries.
- Generates recruiter research brief.
- Generates candidate-safe role brief if needed.

Candidate sees:

- Candidate-safe company and role context with source labels.

Recruiter sees:

- Full research brief.
- Interviewer talking points.
- Source URLs.
- Freshness metadata.

### 4. Recruiter Review

Recruiter actions:

- Reviews evidence.
- Reviews Exa context.
- Decides whether to proceed to interview planning, request more information, or close.

System behavior:

- Labels uncertainty.
- Refuses to auto-advance or auto-reject.
- Generates approval cards for external actions.

Candidate sees:

- Status such as `Recruiter review in progress`.
- Add-on request if recruiter chooses to ask for more evidence.

### 5. Interview Planning

Recruiter action:

- Clicks `Generate interview plan`.

System actions:

- Generates questions tied to evidence gaps.
- Adds rationale and expected signal.
- Runs safety checks.
- Creates candidate-safe prep themes.

Candidate sees:

- High-level prep brief.
- Practice themes.

Recruiter sees:

- Question list.
- Evidence rationale.
- Follow-up prompts.
- Red flags to validate.

### 6. Real Interview Scheduling

Recruiter action:

- Requests scheduling.
- Reviews exact payload.
- Approves.

System actions:

- Creates Google Calendar event with Google Meet link or triggers Workato fallback.
- Stores event metadata.
- Updates candidate schedule.
- Logs approval and integration events.

Candidate sees:

- Confirmed time.
- Timezone.
- Google Meet link.
- Candidate-safe event description.

### 7. Post-Interview Addendum

Candidate action:

- Opens the interviewee account after the interview round.
- Submits optional text, attachments, corrections, explanations, or special consideration.
- Confirms whether the addendum includes sensitive context.

Allowed addendum examples:

- "I want to clarify my answer about deployment metrics."
- "The connection dropped during the system-design question."
- "I have attached the project write-up I mentioned."
- "I was unwell during the interview and want that noted as special consideration."

System actions:

- Stores addendum as candidate-supplied context.
- Labels it as `unvalidated` until HR review.
- Stores attachments as candidate-supplied artifacts.
- Notifies HR.
- Adds a candidate-visible receipt.
- Makes the addendum available before next-step generation.

HR action:

- Reviews the addendum.
- Marks it acknowledged.
- Decides whether it affects follow-up, next-step questions, or request for more material.

Safety rules:

- Sensitive special consideration is voluntary.
- AI may summarize addenda but must not infer protected characteristics.
- The addendum cannot automatically change hiring stage.
- HR remains responsible for the final next step.

### 8. Interview Notes And Feedback

Interviewer action:

- Adds notes after interview.
- Optionally uploads transcript text.

System actions:

- Stores notes as internal-only.
- Reads candidate addendum if submitted and HR-visible.
- Generates structured feedback draft.
- Separates observed evidence, interpretation, and next step.
- Requires approval before candidate release.

Candidate sees:

- Approved candidate-safe feedback only.
- Next step.
- Optional request for addendum follow-up or additional material.

### 9. Follow-Up And Closure

Recruiter action:

- Reviews follow-up draft.
- Edits if needed.
- Approves Gmail send, Gmail draft, or Workato action.

System actions:

- Executes approved action.
- Stores provider metadata.
- Updates candidate timeline.
- Creates candidate-visible receipt.

Closure paths:

```text
hired
not_selected
withdrawn
archived
```

AI cannot close the workflow by itself.

## Swimlane Summary

```text
Candidate
  Upload CV
  Review evidence
  See role brief
  Attend interview
  Submit optional addendum
  Receive approved feedback

Recruiter
  Add role scope
  Review evidence
  Run Exa research
  Approve scheduling
  Approve follow-up

Backend
  Store artifacts
  Run agents
  Enforce approvals
  Shape visibility
  Call integrations
  Store audit events

AI Agents
  Extract evidence
  Identify gaps
  Generate questions
  Draft messages
  Check safety

Exa
  Search public company and role context
  Return sources and summaries

Google / Workato / Gmail
  Create meeting
  Send or draft messages
  Return external metadata
```

## Hosted Demo Golden Path

1. Open hosted sup'work on two laptops.
2. On laptop A, log in as the interviewee.
3. On laptop B, log in as HR.
4. Interviewee account shows the transparency timeline.
5. Interviewee account shows CV evidence mapped to role requirements.
6. HR account opens the same candidate packet.
7. HR runs Exa company and role research.
8. HR shows source-backed context.
9. HR generates interview questions tied to gaps.
10. HR asks to schedule a real candidate interview.
11. HR sees approval card with candidate, interviewer, time, timezone, and provider.
12. HR approves scheduling.
13. HR sees Google Calendar event ID and Google Meet link.
14. Interviewee account live-updates with confirmed interview and prep brief.
15. HR marks interview complete or adds seeded/manual interview notes.
16. Interviewee account submits a post-interview addendum with clarification or document.
17. HR account receives and acknowledges the addendum.
18. HR generates candidate-safe feedback and follow-up.
19. HR approves Gmail draft/send or Workato action.
20. Both accounts show updated timeline and receipt.
21. HR shows audit log with AI, Exa, approval, Google/Meet, addendum, Workato/Gmail events.

## Demo Personas And Data

### Candidate

Use a fictional candidate profile:

- Name: Maya Tan
- Target role: AI Solutions Engineer
- Region: Singapore/APAC
- Strengths: Python, React, LLM evaluation, customer deployment, agent workflow
- Proof to strengthen: deployment metrics, post-launch ownership, enterprise stakeholder examples

### Recruiter

Use a fictional recruiter:

- Name: Alex Lee
- Company: Example AI
- Role: AI Solutions Engineer
- Need: evaluate customer-facing AI deployment ability and schedule a first-round interview

### Interviewer

Use a fictional interviewer:

- Name: Priya Shah
- Focus: customer deployment, technical depth, communication, post-launch ownership

## Demo Data Requirements

- One candidate profile.
- One resume PDF or text fixture.
- One target role/job description.
- One evidence map.
- One Exa company brief with sources.
- One Exa role brief with sources.
- One interview plan.
- One scheduling approval.
- One Google Meet scheduled event, live or realistic fallback.
- One post-interview addendum fixture or live submission.
- One seeded interview-notes fixture.
- One candidate-safe feedback draft.
- One Workato or Gmail receipt.
- One audit log showing the full chain.

## Live Versus Fixture Strategy

Minimum live:

- Hosted frontend.
- Hosted backend.
- One real approved external action.

Preferred live:

- Exa research call.
- Google Calendar event with Meet link.
- Workato Gmail draft or tracker row.

Fixture fallback:

- Cached Exa sources.
- Mock event metadata.
- Mock Workato receipt.
- Seeded notes for feedback.

The demo should not depend on live Google Meet transcript retrieval.




