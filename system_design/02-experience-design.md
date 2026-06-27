# 02. Experience Design

## UX Thesis

sup'work should feel like a shared process room with two doors: interviewee account and HR account. Both sides work from the same workflow, but each sees the right information for their role.

The interviewee account should reduce anxiety by making the process legible. The HR account should reduce operational mess by making evidence, approvals, addenda, and external actions explicit.

The product should not feel like a marketing site or a generic chatbot. It should feel like a polished workflow app built for repeated use.

## Information Architecture

```text
sup'work
  Interviewee account
    Home
    CV Evidence
    Role Brief
    Interview Prep
    Schedule
    Post-Interview Addendum
    Feedback
    Data & Consent

  HR account
    Pipeline
    Candidate Packet
    Research
    Interview Plan
    Scheduling
    Addendum Review
    Follow-Up
    Audit
```

The hosted demo should not rely on a visible view switch. It should use real authentication with two demo accounts:

```text
hr@demo.supwork.local
interviewee@demo.supwork.local
```

For the strongest presentation, run the HR account on one laptop and the interviewee account on another. Scheduling, addendum submission, approval, and audit updates should propagate through the hosted backend and shared database.

## Authentication UX

The login screen should be simple and demo-safe.

Required login behavior:

- Email/password or magic-demo credential login.
- Role-based routing after login.
- HR lands in Pipeline or Candidate Packet.
- Interviewee lands in Candidate Home.
- Both users see the same workflow ID with role-shaped data.
- Logout is visible.

Demo account shortcuts may be shown in non-production demo mode only:

```text
Continue as HR Demo
Continue as Interviewee Demo
```

Production direction should use proper authentication and role assignment, not a front-end-only role switch.

## Shared UX Object: The Transparency Timeline

Every workflow has a timeline visible to both sides with redacted details where needed. The timeline is not just an audit log; it is the candidate's map of the process.

```text
Candidate invited
CV and role evidence mapped
Public role/company research added
Recruiter review opened
Interview plan prepared
Interview schedule pending approval
Google Meet scheduled
Interview completed
Candidate-safe feedback pending approval
Follow-up sent
```

Candidate timeline cards should show:

- Current stage.
- Who owns the next step.
- What information was used.
- What has been sent or scheduled.
- Whether a human approved the action.
- What is private, and why.

Recruiter timeline cards should show:

- Workflow status.
- Evidence readiness.
- Research status.
- Pending approvals.
- Integration status.
- Audit metadata.

## Interviewee Account

### Candidate Home

Purpose: Give the candidate a calm, direct answer to "where am I and what can I do next?"

Primary content:

- Current stage.
- Next expected action.
- Upcoming interview date/time and Google Meet link.
- Evidence summary.
- Any pending candidate action.
- Candidate-safe messages.
- Data and consent shortcut.

Suggested layout:

- Top band: role, company, stage, next action.
- Main left: transparency timeline.
- Main right: upcoming schedule and action cards.
- Lower section: evidence summary and prep brief.

### CV Evidence

Purpose: Show how the candidate's CV maps to role requirements without turning the candidate into a score.

Evidence statuses:

| Status | Meaning | Candidate tone |
| --- | --- | --- |
| `covered` | CV clearly supports the requirement. | "Your CV already shows this." |
| `partial` | CV gives a signal but needs stronger proof. | "You have a signal here; add specifics." |
| `gap` | The role asks for this and the CV is silent. | "This is a proof area to strengthen." |
| `unclear` | Evidence may exist but needs clarification. | "This may be present, but it is not clear yet." |

Candidate-facing evidence cards should use a consistent structure:

```text
Requirement: Customer-facing AI deployment
Evidence found: CV page 2 mentions two enterprise rollout projects.
Status: Partial
Why it matters: The role asks for customer implementation experience.
What you can add: Metrics, customer type, post-launch ownership, or a project link.
Visibility: Candidate-visible, recruiter-visible
```

This pattern turns evidence gaps into agency. It avoids treating gaps as automated rejection reasons.

### Role Brief

Purpose: Give candidate-safe public context about the role and company.

Content:

- Company/product summary.
- Role themes.
- Public source links.
- Interview-relevant context.
- What the candidate should not over-index on.

Rules:

- Exa sources must be visible.
- Candidate-facing claims should be short and caveated.
- Public research is labeled separately from candidate evidence.

### Interview Prep

Purpose: Help candidates prepare for the actual conversation without exposing private recruiter notes.

Content:

- Likely interview themes.
- Practice questions.
- Evidence-to-answer mapping.
- Company and role context.
- "Proof to strengthen" suggestions.

Candidate prep should not reveal:

- Internal score.
- Internal debate.
- Exact private interviewer notes.
- Hiring-manager deliberation.

### Schedule

Purpose: Make interview logistics explicit.

Content:

- Confirmed time.
- Timezone.
- Duration.
- Attendees where appropriate.
- Google Meet link.
- Calendar status.
- Approval timestamp.

The schedule screen should make timezone errors hard to miss.

### Post-Interview Addendum

Purpose: Give the candidate a fair chance to add context after an interview, especially if they did not perform as well as they could have.

Allowed addendum types:

- Clarification: "I want to clarify an answer from the interview."
- Correction: "I misspoke or gave an incomplete answer."
- Additional evidence: project links, documents, portfolio, writing samples, or certificates.
- Special consideration: optional context such as technical issues, illness, accessibility needs, emergency circumstances, or other factors the candidate wants HR to consider.
- Follow-up note: concise post-interview note to the hiring team.

UX requirements:

- The addendum opens after an interview round is marked complete.
- The candidate sees a deadline or recommended submission window.
- The candidate can add text and upload documents.
- Sensitive or special-consideration content is clearly voluntary.
- The UI explains that addenda are reviewed by a human and are not automatic decision overrides.
- Submitted addenda are labeled `candidate-supplied` and `unvalidated` until reviewed.
- HR receives a review card before next-step or follow-up generation.

Candidate copy:

```text
Add anything you want the hiring team to consider before they finalize next steps. This can include a correction, extra evidence, special consideration, or a document you did not have ready during the interview.
```

### Feedback

Purpose: Give approved, constructive, candidate-safe feedback or next-step guidance.

Content:

- What landed well.
- What could be clarified.
- Recommended next step.
- Optional addendum or additional-material request.
- Whether the feedback was reviewed and approved.
- Whether HR reviewed a submitted addendum.

Feedback should never imply the candidate was evaluated solely by AI.

### Data & Consent

Purpose: Give the candidate visibility into data use.

Content:

- Uploaded artifacts.
- Candidate-supplied add-ons.
- Post-interview addenda.
- Candidate-visible summaries.
- External sharing receipts.
- Calendar/email actions.
- Consent status.

## HR Account

### Pipeline

Purpose: Show operational status across candidates.

Content:

- Candidate list.
- Current stage.
- Pending approvals.
- Upcoming interviews.
- Integration health.
- Recent activity.

### Candidate Packet

Purpose: Give a structured review surface for one candidate.

Content:

- Candidate identity and role.
- CV evidence map.
- Missing or unclear evidence.
- Candidate-visible summary.
- Internal notes.
- Artifacts.

The packet should visually separate:

- Candidate evidence.
- Public research.
- AI synthesis.
- Human notes.
- Candidate-safe copy.

### Research

Purpose: Use Exa to prepare public company, role, and interviewer context.

Content:

- Company overview.
- Recent public developments.
- Role market context.
- Interview talking points.
- Source URLs.
- Freshness metadata.

### Interview Plan

Purpose: Build a fair, focused interview.

Content:

- Interview objective.
- Questions tied to evidence gaps.
- Rationale for each question.
- Expected signal.
- Follow-up prompts.
- Safety warnings.

Questions should not ask about protected characteristics, private life, or unsupported assumptions.

### Scheduling

Purpose: Make external scheduling explicit and approval-gated.

Approval card content:

- Action type.
- Candidate name and email.
- Interviewer attendees.
- Start time.
- Timezone.
- Duration.
- Meeting provider.
- Candidate-facing description.
- Internal-only fields excluded.
- Risk warning.

### Addendum Review

Purpose: Ensure candidate-submitted post-interview context is considered before next-step communication.

Content:

- Addendum type.
- Candidate text.
- Attachments.
- Submitted timestamp.
- Sensitive or special-consideration flag.
- Reviewer acknowledgement.
- Notes on whether the addendum changes follow-up, interview interpretation, or next-step questions.

Rules:

- Addendum content is candidate-supplied and should not be treated as verified evidence unless reviewed.
- Special consideration should be handled by a human with care and without discriminatory inference.
- AI can summarize an addendum for HR, but the raw candidate submission remains available to HR.
- AI-generated summaries of special consideration must be factual and minimal.

### Follow-Up

Purpose: Prepare candidate-safe communication.

Content:

- Draft subject/body.
- Visibility checker result.
- Candidate-safe summary.
- Approval state.
- Gmail or Workato receipt.

### Audit

Purpose: Prove what happened.

Content:

- Agent runs.
- Exa research artifacts.
- Approval events.
- Google Calendar events.
- Workato recipe runs.
- Gmail metadata.
- Visibility checks.
- Errors and retries.

## UI Components

### Transparency Timeline Card

Fields:

- `eventType`
- `title`
- `summary`
- `actor`
- `timestamp`
- `candidateVisible`
- `approvalId`
- `source`
- `nextAction`

### Evidence Coverage Card

Fields:

- `requirement`
- `status`
- `candidateEvidence`
- `sourceArtifact`
- `sourceLocation`
- `whyItMatters`
- `candidateAction`
- `visibility`

### Research Source Card

Fields:

- `title`
- `url`
- `sourceType`
- `publishedDate`
- `retrievedAt`
- `summary`
- `usedFor`
- `candidateSafe`

### Approval Card

Fields:

- `actionType`
- `payloadSummary`
- `candidateFacingContent`
- `internalFieldsExcluded`
- `riskLevel`
- `provider`
- `approve`
- `reject`
- `edit`

### Addendum Review Card

Purpose: Ensure candidate-submitted post-interview context is considered before next-step communication.

Content:

- Addendum type.
- Candidate text.
- Attachments.
- Submitted timestamp.
- Sensitive or special-consideration flag.
- Reviewer acknowledgement.
- Notes on whether the addendum changes follow-up, interview interpretation, or next-step questions.

Rules:

- Addendum content is candidate-supplied and should not be treated as verified evidence unless reviewed.
- Special consideration should be handled by a human with care and without discriminatory inference.
- AI can summarize an addendum for HR, but the raw candidate submission remains available to HR.
- AI-generated summaries of special consideration must be factual and minimal.

### Feedback Release Card

Fields:

- `observedEvidence`
- `interviewerInterpretation`
- `candidateSafeFeedback`
- `recommendedNextStep`
- `excludedInternalNotes`
- `approvedBy`

## Visual Design Direction

The visual language should be quiet, dense, and trustworthy.

Use:

- Clear status chips.
- Compact tables.
- Timeline cards.
- Source-link affordances.
- Approval cards.
- Split panes where useful.
- 8px card/control radius unless an existing system dictates otherwise.

Avoid:

- Marketing hero sections.
- Decorative gradient-heavy layouts.
- Large generic chat surfaces as the main UI.
- One-note palettes.
- Candidate scores as hero numbers.
- Text overlap or mobile horizontal scroll.

## Copy Rules

Prefer:

- `evidence suggests`
- `proof to strengthen`
- `candidate-visible`
- `internal-only`
- `source-backed`
- `waiting for recruiter review`
- `approved by`
- `draft for approval`

Avoid:

- `AI decided`
- `failed`
- `rejected by AI`
- `score`
- `deficiency`
- `guaranteed`
- `perfect fit`
- `automated decision`

## Mobile Behavior

Mobile should prioritize:

- Current stage.
- Next action.
- Schedule.
- Candidate-safe evidence summary.
- Approval cards if recruiter is using mobile.

Rules:

- Single-column layout.
- Timeline cards stack vertically.
- Evidence tables collapse into cards.
- PDF viewer can collapse behind an `Open CV` action.
- Copilot or assistant UI must not cover primary action buttons.
- No horizontal scrolling.




