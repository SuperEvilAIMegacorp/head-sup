# 07. Safety, Transparency, And Ethics

## Safety Thesis

sup'work makes hiring more humane by showing candidates useful process clarity while protecting legitimate internal privacy and preventing AI from making consequential decisions.

Transparency does not mean exposing everything. It means the candidate can understand what stage they are in, what evidence is being used, what has been approved, and what they can do next.

## Humane Transparency Contract

| Transparency layer | Candidate should see | Candidate should not see |
| --- | --- | --- |
| Process | Current stage, next owner, next expected action, scheduling status, and whether something is waiting on approval. | Internal workload notes, private reviewer coordination, or hidden operational metadata. |
| Evidence | Role requirements, candidate-provided evidence used, missing or unclear proof areas, and source labels. | Private interviewer deliberation, unsupported scores, or unreviewed AI speculation. |
| Addendum | Whether the candidate submitted post-interview context, what they submitted, whether HR acknowledged it, and whether it affected next steps. | Internal deliberation about the addendum or assumptions about sensitive circumstances. |
| Research | Candidate-safe company and role context with public source labels. | Exa raw search payloads, irrelevant public data, or anything about the candidate's private life. |
| Decisions | Whether a human has reviewed, approved, sent, scheduled, or released something. | A pretend explanation for decisions the system cannot actually justify. |
| Feedback | Approved, specific, constructive notes and next steps. | Raw transcript excerpts, internal debate, personality judgments, or protected-characteristic inferences. |
| Data use | What documents were uploaded, what artifacts exist, and what has been shared externally. | Secrets, provider traces, private tokens, and other candidates' data. |

Every candidate-facing explanation should answer:

- What information was used?
- Where did it come from?
- Who approved the action or message?
- What can the candidate do next?

If the system cannot answer these questions, it should show a limited status rather than inventing confidence.

## Non-Negotiable Rules

- AI never makes final hire, reject, advance, or selection decisions.
- AI never sends candidate communication directly.
- AI never creates, updates, or cancels calendar events directly.
- Workato recipes must reject unapproved side-effect payloads.
- Exa must not be used to investigate private candidate life.
- Protected characteristics must not be inferred, summarized, or used.
- Candidate-facing content must never include internal-only notes.
- Candidate addenda must be treated as voluntary candidate-supplied context, not verified evidence or an automatic decision override.
- Secrets and tokens remain server-side.
- Every external side effect must have approval and audit metadata.

## Approval Matrix

| Action | AI can draft | Human approval required | Candidate visible | Audit required |
| --- | --- | --- | --- | --- |
| CV evidence summary | Yes | Candidate consent before upload/analysis | Yes | Yes |
| Exa role/company research | Yes | No for internal research; yes before broad candidate-facing release | Partial | Yes |
| Interview questions | Yes | Recruiter review before use | Prep themes only | Yes |
| Candidate prep brief | Yes | Safety/visibility check | Yes | Yes |
| Gmail draft | Yes | Yes before creating external draft | If candidate-facing | Yes |
| Gmail send | No | Yes | Yes | Yes |
| Google Calendar / Meet event | No | Yes | Yes | Yes |
| Workato recipe with side effect | No | Yes | Depends on action | Yes |
| Candidate advancement | Recommendation only | Yes | Status only | Yes |
| Candidate rejection | Draft only | Yes | Yes after approved communication | Yes |
| Candidate feedback release | Yes | Yes | Yes | Yes |
| Candidate pre-interview add-on material | No | Candidate submits voluntarily | Yes | Yes |
| Post-interview addendum | No | Candidate submits voluntarily; HR acknowledgement required before next-step generation | Yes | Yes |

## Humane Feedback Rules

Candidate feedback should:

- Be specific and constructive.
- Explain what evidence was strong.
- Explain what evidence could be clarified.
- Distinguish between `observed evidence`, `interviewer interpretation`, and `recommended next step`.
- Include at least one actionable next step when feedback is released.
- Avoid personality judgments.
- Avoid unsupported claims.
- Avoid revealing internal deliberation.
- Avoid implying the candidate was evaluated by AI alone.

Candidate feedback should not:

- Use a numeric score as the primary message.
- Say or imply that the candidate was rejected by AI.
- Cite private recruiter notes directly.
- Include sensitive personal data that is not necessary for the next step.
- Present Exa public research as proof about the candidate.
- Include raw transcript excerpts unless explicitly approved and necessary.

## Candidate Rights And Agency

Candidates should be able to:

- See what documents they uploaded.
- See what role requirements were evaluated.
- See evidence labels and source references.
- Correct extracted CV evidence.
- Submit pre-interview add-on material for partial, gap, or unclear areas.
- Submit a post-interview addendum after an interview round.
- Add corrections, explanations, additional documents, or special consideration voluntarily.
- See whether HR acknowledged the addendum.
- See what external actions were taken, such as email sent or interview scheduled.
- Understand what content is withheld and why.

Candidates should not be forced to:

- Accept an AI-generated interpretation as final.
- Guess why a gap was marked.
- Receive unreviewed AI feedback.
- Share private information unrelated to the role.

## Post-Interview Addendum Safety

The post-interview addendum is a candidate agency feature. It lets candidates add context after an interview, especially when they feel they did not perform as well as they could have.

Allowed content:

- Clarifications or corrections.
- Additional documents.
- Portfolio or project links.
- Explanations of technical issues during the interview.
- Voluntary special consideration.
- Concise follow-up note.

Safety rules:

- The addendum is optional.
- Special consideration is voluntary and should not be requested aggressively.
- The UI should warn candidates not to include sensitive personal information unless they choose to.
- AI may summarize addenda for HR, but it must not infer protected characteristics.
- HR must acknowledge addenda before next-step generation if an addendum was submitted.
- Addendum content must be labeled `candidate-supplied` and `unvalidated` until reviewed.
- Addenda can inform follow-up or further questions, but cannot automatically change hiring stage.
- Candidate-submitted documents should be scanned for basic file safety before download or preview.

## Protected Characteristics

The system must not infer, use, summarize, or ask about protected characteristics, including:

- Age.
- Race or ethnicity.
- Religion.
- Disability.
- Gender identity.
- Sexual orientation.
- Marital or family status.
- Pregnancy.
- National origin.
- Health status.
- Other legally protected attributes based on jurisdiction.

If such information appears in a CV, notes, or voluntary addendum, the system should avoid using it for evaluation and should warn HR if generated content references it unnecessarily.

## Exa Safety

Allowed:

- Company research.
- Role market context.
- Public product context.
- Interviewer prep.
- Public documentation for role tools.

Not allowed:

- Searching the candidate's private life.
- Reputation checks.
- Social media profiling.
- Protected-characteristic inference.
- Treating public company data as candidate evidence.

## Visibility Labels

All generated or stored content should have one of:

```text
candidate_visible
recruiter_internal
interviewer_internal
system_audit
secret_redacted
```

Visibility labels must be enforced by API shaping, not only UI convention.

## Redaction Rules

Redact from candidate-facing content:

- Internal interviewer notes.
- Internal recruiter disagreement.
- Raw model prompts or traces.
- Provider stack traces.
- OAuth tokens, API keys, webhook URLs.
- Other candidates' data.
- Protected-characteristic references.
- Unsupported claims.

Redact from logs:

- Secrets.
- Tokens.
- Full email bodies where not needed.
- Raw CV text where not needed.
- Provider credentials.

## Transparency QA Checklist

Before a screen or generated message ships, it should pass:

- The candidate can tell what stage they are in.
- The candidate can tell what information was used.
- The candidate can tell whether content came from CV, public research, interviewer notes, or AI synthesis.
- The candidate can tell what they can do next.
- HR can tell what content is candidate-visible versus internal-only.
- HR can tell whether addendum content is candidate-supplied, sensitive, reviewed, or unreviewed.
- Any external side effect has an approval record.
- Any public claim has a source or is marked unavailable.
- Any withheld content has a simple boundary reason, such as `internal interviewer notes` or `private audit metadata`.

## Safety Review Checks

Generated content should be checked for:

- Unsupported candidate claims.
- Protected-characteristic references.
- Discriminatory or irrelevant questions.
- Internal-note leakage.
- Raw transcript leakage.
- Overconfident language.
- Guaranteed outcomes.
- Missing source labels.
- Side-effect requests without approval.
- Addendum summaries that infer protected traits or overstate candidate claims.

## Misuse Scenarios And Mitigations

| Misuse | Mitigation |
| --- | --- |
| Recruiter tries to auto-reject with AI. | Only recommendation/draft allowed; final state change requires human approval and audit. |
| Candidate-facing email includes internal notes. | Visibility checker blocks send and asks for revision. |
| Exa results include irrelevant private info. | Research filter excludes candidate profiling and labels Exa as public context only. |
| Workato webhook is called without approval. | Backend refuses action; Workato recipe also validates `humanApproved`. |
| Calendar event leaks internal notes. | Candidate-safe event description template only. |
| Model invents candidate evidence. | Evidence output requires source artifact and location; unsupported claims marked unavailable. |
| Callback payload attempts instructions. | Callback data stored as metadata only; never executed as instructions. |
| Candidate submits sensitive special consideration. | Mark as voluntary/sensitive, restrict to HR review, prevent AI from making inferences, and avoid unnecessary candidate-facing repetition. |

## Candidate-Safe Language

Prefer:

- `Evidence from your CV shows...`
- `This role asks for...`
- `This area may be worth clarifying...`
- `You can add context before the hiring team finalizes next steps...`
- `Your addendum was received and is awaiting HR review...`
- `HR approved this message...`
- `Public sources describe...`
- `Next step: ...`

Avoid:

- `The AI decided...`
- `You failed...`
- `Your score is...`
- `You were rejected because...`
- `We know from the internet that you...`
- `Guaranteed interview outcome...`




