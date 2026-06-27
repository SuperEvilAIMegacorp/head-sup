# 06. Data And API

## Data Model Goals

The data model must support:

- Interviewee and HR views of the same workflow.
- Real HR and interviewee accounts for the hosted demo.
- Explicit visibility boundaries.
- Evidence provenance.
- Exa source persistence.
- Approval-gated side effects.
- Integration receipts.
- Auditability.
- Demo fixtures and live provider metadata.

## Core Entities

### `users`

Represents candidate, recruiter, interviewer, hiring manager, or admin identity.

Fields:

- `id`
- `email`
- `display_name`
- `role`
- `created_at`
- `updated_at`

Roles:

```text
interviewee
hr
interviewer
hiring_manager
admin
```

### `auth_sessions`

Server-side or token-backed login session.

Fields:

- `id`
- `user_id`
- `role`
- `session_token_hash`
- `expires_at`
- `created_at`
- `last_seen_at`

### `candidate_profiles`

Candidate-facing profile.

Fields:

- `id`
- `user_id`
- `name`
- `email`
- `consent_status`
- `preferences_json`
- `created_at`
- `updated_at`

### `roles`

Target job or interview role.

Fields:

- `id`
- `company`
- `title`
- `job_scope_text`
- `location`
- `seniority`
- `rubric_json`
- `created_at`
- `updated_at`

### `application_workflows`

Main workflow record linking candidate and role.

Fields:

- `id`
- `candidate_id`
- `role_id`
- `stage`
- `provider_mode`
- `status_summary`
- `created_by`
- `created_at`
- `updated_at`

### `evidence_artifacts`

Uploaded or generated artifacts.

Fields:

- `id`
- `workflow_id`
- `type`
- `source_uri`
- `visibility`
- `extracted_text`
- `hash`
- `metadata_json`
- `created_at`

Artifact types:

```text
cv
job_scope
rubric
candidate_addon
post_interview_addendum
addendum_attachment
interview_notes
transcript
candidate_safe_summary
```

### `evidence_mappings`

Role requirement mapped to candidate evidence.

Fields:

- `id`
- `workflow_id`
- `requirement`
- `status`
- `candidate_evidence`
- `source_artifact_id`
- `source_location_json`
- `why_it_matters`
- `candidate_action`
- `visibility`
- `created_at`
- `updated_at`

Statuses:

```text
covered
partial
gap
unclear
```

### `research_artifacts`

Exa-backed public research.

Fields:

- `id`
- `workflow_id`
- `research_type`
- `query`
- `provider`
- `source_urls_json`
- `summary_json`
- `visibility`
- `freshness`
- `created_at`

Research types:

```text
company
role_market
interview_brief
policy_context
```

### `grounding_sources`

Normalized source records.

Fields:

- `id`
- `provider`
- `query_hash`
- `url`
- `title`
- `snippet`
- `published_date`
- `retrieved_at`
- `source_type`
- `citation_label`
- `content_hash`
- `created_at`

### `interview_plans`

Generated interview plan.

Fields:

- `id`
- `workflow_id`
- `objective`
- `questions_json`
- `candidate_prep_themes_json`
- `safety_status`
- `created_by_agent_run_id`
- `created_at`

### `interview_rounds`

Scheduled interview metadata.

Fields:

- `id`
- `workflow_id`
- `round_number`
- `scheduled_start`
- `scheduled_end`
- `timezone`
- `meeting_provider`
- `calendar_event_id`
- `calendar_html_link`
- `meeting_join_url`
- `notes_status`
- `round_status`
- `approval_id`
- `trace_id`
- `created_at`
- `updated_at`

### `candidate_addenda`

Candidate-submitted post-interview context.

Fields:

- `id`
- `workflow_id`
- `round_id`
- `candidate_id`
- `addendum_type`
- `body`
- `sensitive_flag`
- `visibility`
- `status`
- `submitted_at`
- `reviewed_by`
- `reviewed_at`
- `review_notes`
- `created_at`
- `updated_at`

Addendum types:

```text
clarification
correction
additional_document
special_consideration
follow_up_note
other
```

Statuses:

```text
submitted
acknowledged
needs_follow_up
incorporated
closed
```

Rules:

- Addenda are candidate-supplied and unvalidated until HR review.
- Special consideration is voluntary and should be handled by a human.
- Addenda can inform follow-up or next-step questions, but cannot automatically advance or reject a candidate.

### `addendum_attachments`

Files attached to a post-interview addendum.

Fields:

- `id`
- `addendum_id`
- `artifact_id`
- `filename`
- `content_type`
- `size_bytes`
- `created_at`

### `communication_drafts`

Candidate-safe message drafts.

Fields:

- `id`
- `workflow_id`
- `channel`
- `subject`
- `body`
- `visibility_check_status`
- `approval_id`
- `external_message_id`
- `thread_id`
- `status`
- `created_at`
- `updated_at`

### `approval_requests`

Proposed external or consequential actions.

Fields:

- `id`
- `workflow_id`
- `action_type`
- `proposed_payload_json`
- `risk_level`
- `status`
- `approved_by`
- `approved_at`
- `rejected_by`
- `rejected_at`
- `created_at`

Statuses:

```text
pending
approved
rejected
expired
executed
failed
```

### `integration_events`

Provider operation record.

Fields:

- `id`
- `workflow_id`
- `provider`
- `operation`
- `external_id`
- `request_summary_json`
- `response_summary_json`
- `status`
- `trace_id`
- `created_at`

### `audit_events`

Immutable workflow history.

Fields:

- `id`
- `workflow_id`
- `event_type`
- `actor_type`
- `actor_id`
- `summary`
- `payload_json`
- `visibility`
- `trace_id`
- `created_at`

### `candidate_receipts`

Candidate-visible summary of important actions.

Fields:

- `id`
- `workflow_id`
- `receipt_type`
- `summary`
- `shared_artifacts_json`
- `external_actions_json`
- `created_at`

## Visibility Model

Visibility values:

```text
candidate_visible
recruiter_internal
interviewer_internal
system_audit
secret_redacted
```

Rules:

- Candidate APIs return only candidate-visible records and allowed redacted statuses.
- Recruiter APIs return recruiter-visible and internal records based on role.
- Internal notes are never included in candidate API payloads by default.
- Public research is labeled separately from candidate evidence.
- Visibility is stored as data, not inferred from prose.

## View Models

### CandidateWorkflowView

```json
{
  "workflowId": "wf_demo",
  "candidate": {},
  "role": {},
  "stage": "scheduled",
  "timeline": [],
  "evidenceSummary": [],
  "roleBrief": {},
  "schedule": {},
  "addendumWindow": {},
  "submittedAddenda": [],
  "feedback": {},
  "receipts": []
}
```

### RecruiterWorkflowView

```json
{
  "workflowId": "wf_demo",
  "candidate": {},
  "role": {},
  "stage": "scheduled",
  "evidenceMappings": [],
  "researchArtifacts": [],
  "interviewPlan": {},
  "candidateAddenda": [],
  "approvals": [],
  "integrationEvents": [],
  "auditEvents": []
}
```

## API Surface

### Auth APIs

```text
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

### Candidate APIs

```text
POST /api/candidate/workflows
GET /api/candidate/workflows/{workflowId}
POST /api/candidate/workflows/{workflowId}/artifacts
GET /api/candidate/workflows/{workflowId}/evidence
GET /api/candidate/workflows/{workflowId}/role-brief
GET /api/candidate/workflows/{workflowId}/timeline
GET /api/candidate/workflows/{workflowId}/schedule
GET /api/candidate/workflows/{workflowId}/feedback
POST /api/candidate/workflows/{workflowId}/addon
GET /api/candidate/workflows/{workflowId}/rounds/{roundId}/addendum
POST /api/candidate/workflows/{workflowId}/rounds/{roundId}/addendum
POST /api/candidate/workflows/{workflowId}/rounds/{roundId}/addendum/{addendumId}/attachments
```

### Recruiter APIs

```text
GET /api/recruiter/workflows
GET /api/recruiter/workflows/{workflowId}
POST /api/recruiter/workflows/{workflowId}/screen
POST /api/recruiter/workflows/{workflowId}/questions
POST /api/recruiter/workflows/{workflowId}/next-step
POST /api/recruiter/workflows/{workflowId}/candidate-safe-summary
POST /api/recruiter/workflows/{workflowId}/notes
GET /api/recruiter/workflows/{workflowId}/addenda
POST /api/recruiter/workflows/{workflowId}/addenda/{addendumId}/acknowledge
```

### Research APIs

```text
POST /api/research/company
POST /api/research/role-market
POST /api/research/interview-brief
GET /api/workflows/{workflowId}/research
```

### Approval APIs

```text
POST /api/approvals
GET /api/approvals
GET /api/approvals/{approvalId}
POST /api/approvals/{approvalId}/approve
POST /api/approvals/{approvalId}/reject
```

### Integration APIs

```text
POST /api/integrations/google-calendar/create-approved
POST /api/integrations/google-calendar/update-approved
POST /api/integrations/google-calendar/cancel-approved
POST /api/integrations/gmail/draft-approved
POST /api/integrations/gmail/send-approved
POST /api/integrations/workato/actions
POST /api/integrations/workato/callbacks
GET /api/provider-status
GET /api/audit-log
```

### Health APIs

```text
GET /api/health
GET /api/provider-status
```

## Approval Payload Types

```text
schedule_interview
reschedule_interview
cancel_interview
send_candidate_follow_up
create_gmail_draft
release_candidate_feedback
request_candidate_addon
review_candidate_addendum
advance_candidate
close_workflow
workato_action
```

## Audit Event Taxonomy

Workflow:

```text
workflow.created
workflow.stage_changed
workflow.closed
```

Artifacts:

```text
artifact.uploaded.cv
artifact.uploaded.job_scope
artifact.uploaded.candidate_addon
artifact.uploaded.addendum_attachment
artifact.uploaded.notes
```

Agents:

```text
agent.evidence.started
agent.evidence.completed
agent.research.completed
agent.questions.generated
agent.safety.completed
agent.feedback.generated
```

Research:

```text
exa.search.company.completed
exa.search.role_market.completed
exa.search.interview_brief.completed
research.source.stored
```

Approvals:

```text
approval.created
approval.approved
approval.rejected
approval.executed
approval.failed
```

Integrations:

```text
google_calendar.event.create_requested
google_calendar.event.created
google_calendar.event.failed
google_meet.link.created
workato.recipe.requested
workato.callback.verified
workato.recipe.completed
gmail.draft.created
gmail.message.sent
```

Candidate-facing:

```text
candidate.timeline.updated
candidate.feedback.released
candidate.receipt.created
candidate.addon_submitted
candidate.addendum_submitted
candidate.addendum_acknowledged
```

## Data Lifecycle

1. HR and interviewee authenticate into role-based sessions.
2. Candidate consents and uploads CV.
3. System extracts text and stores artifact hash.
4. Evidence mapping is generated and stored.
5. HR research and notes are stored with visibility labels.
6. External actions are approved and executed.
7. Interview completes and addendum window opens.
8. Candidate may submit addendum text and attachments.
9. HR acknowledges addendum before feedback/follow-up.
10. Candidate receipts summarize external sharing and addendum status.
11. Workflow closes.
12. Demo data can be reset or reseeded.

## Privacy Rules

- Do not commit real CVs, transcripts, tokens, or local databases.
- Store only the metadata needed for demo and audit.
- Redact secrets from logs.
- Do not expose raw provider responses to candidates.
- Do not expose other candidates' data across workflows.


