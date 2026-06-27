# 01. Product Strategy

## Executive Summary

sup'work is a live, two-sided Future of Work product for transparent, humane job seeking.

For candidates, sup'work turns an opaque hiring process into a clear evidence trail: what the role asks for, what their CV proves, what is missing or unclear, what public company and role context matters, when the interview is happening, what was approved, what they can add after an interview, and what they can do next.

For recruiters and hiring teams, sup'work turns fragmented hiring work across resumes, job descriptions, research, calendars, interview notes, Gmail, and workflow tools into an approval-gated system. It helps teams prepare better interviews and communicate more clearly without letting AI make hiring decisions.

The product is candidate-first, but not candidate-only. Candidate transparency only matters if the recruiter side can actually operate the process.

## Hackathon Fit

sup'work directly targets the Sup 2026 `Future of Work` challenge: helping people navigate a volatile job market and access better career opportunities.

It also supports:

- `AI-Native Organizations`: hiring teams move from scattered manual workflows to agent-assisted operations with approvals and audit.
- `Security, Resilience & Defense`: external actions, secrets, visibility, and candidate data are protected by clear boundaries.

## Judging Criteria Strategy

| Criterion | Weight | sup'work response |
| --- | ---: | --- |
| Proof of Work - Functionality | 25% | Hosted HR and interviewee accounts, evidence mapping, Exa research, approval-gated Google Meet scheduling, post-interview addendum, Workato/Gmail receipt, and audit trail. |
| Problem Fit & Market Value | 25% | Job seekers need clarity and agency; recruiters need structured, faster, safer coordination. The product solves both sides of a real hiring workflow. |
| Design, Craft & Taste | 20% | The UX is a calm operating workspace with explicit visibility boundaries, source labels, approval cards, and constructive candidate language. |
| Innovation & Creative Use of Sponsor Technology | 30% | Exa is the public research layer, Workato is the approved automation layer, and AI agents coordinate reasoning without autonomous decisions. |

## One-Sentence Pitch

sup'work is a seeker-first hiring workspace that gives candidates transparent evidence, preparation, and process visibility while giving recruiters approval-gated AI tools for research, interviews, scheduling, and follow-up.

## Product Promise

sup'work does not promise a job, a hire, or a perfect match. It promises a clearer process:

- Candidates understand what evidence is being considered.
- Recruiters see structured, source-linked context instead of scattered notes.
- Interviewers receive focused, fair, evidence-based questions.
- Candidate-facing content is safe, reviewed, and constructive.
- Candidates can add post-interview context, corrections, special consideration, or documents before follow-up.
- External actions happen only after human approval.
- Every important step leaves an audit trail.

## Why This Is Humane

Most hiring software optimizes for employer throughput. sup'work optimizes for shared clarity.

That means:

- The candidate is not reduced to a score.
- The recruiter is not replaced by an agent.
- The interviewer is given better context without being scripted by AI.
- Candidate feedback is constructive, not performative.
- Transparency is useful process clarity, not raw internal-note exposure.

## Core Users

| User | Primary need | Product value |
| --- | --- | --- |
| Candidate / job seeker | Understand role fit, prepare for interviews, track process status, and receive clear communication. | Less uncertainty, better preparation, more agency. |
| Recruiter | Move candidates through intake, screening, scheduling, interviews, and follow-up without losing context. | Faster coordination, better evidence discipline, safer candidate communication. |
| Hiring manager | Review role-linked evidence and interview signals without reading every raw artifact. | Faster review with clearer reasoning. |
| Interviewer | Receive focused questions tied to unresolved evidence gaps and public company/role context. | More consistent, relevant interviews. |
| Admin / demo operator | Configure providers, secrets, hosting, and fallbacks. | Reliable live demo and controlled operations. |

## Market Problem

Candidates often experience hiring as a black box:

- They do not know what the employer is evaluating.
- They do not know whether their CV evidence was understood.
- They do not know what is pending.
- They receive generic or delayed communication.
- They are rarely given actionable, safe feedback.

Recruiters also operate inside a messy process:

- CVs, job descriptions, notes, emails, calendars, and interview prep are scattered.
- Public company and role context is manually collected or skipped.
- Scheduling and follow-up are repetitive but risky to automate blindly.
- Internal notes can accidentally leak into candidate-facing communication.
- Audit history is weak, especially for AI-generated content.

sup'work addresses the shared cause: the process lacks a structured, visible, governed workflow.

## Strategic Differentiation

sup'work is not:

- A generic ATS.
- A resume scoring app.
- A job board.
- A chatbot sitting beside a hiring workflow.
- A tool that replaces recruiter judgment.

sup'work is:

- A transparency layer for the candidate.
- A coordination layer for the recruiter.
- A source-backed research layer for interview prep.
- An approval-gated action layer for calendar, Gmail, and Workato automation.
- An audit layer that proves what happened.

## Product Principles

1. Candidate-first, two-sided workflow.
   The candidate experience is the center. The recruiter view exists to make candidate transparency operational.

2. Evidence before judgment.
   sup'work maps role requirements to candidate-provided evidence and marks gaps constructively. It does not produce final hiring decisions.

3. Public research is not candidate proof.
   Exa research provides company, role, and market context. It must not be treated as evidence about the candidate.

4. Approval before side effects.
   AI may draft, summarize, and propose. Humans approve before sending email, creating meetings, advancing/rejecting candidates, syncing external systems, or releasing feedback.

5. Visibility boundaries are first-class.
   Candidate-visible content, recruiter-only notes, interviewer prep, raw transcript content, public research, and audit metadata are technically and visually separated.

6. Hosted demo must work live.
   The hackathon build must show a hosted frontend, hosted backend, and at least one real approved external action.

## MVP Scope

### Must Have

- Real role-based login for HR and interviewee demo accounts.
- Interviewee and HR views for the same workflow.
- CV and job-scope intake.
- Evidence mapping with constructive candidate language.
- Exa company and role research brief with source URLs.
- Interview question generation tied to evidence gaps.
- Approval card UI.
- Google Meet scheduling path or Workato fallback.
- Candidate-safe communication draft.
- Post-interview addendum submission and HR review.
- Audit log.
- Hosted live demo URL.

### Should Have

- Gmail draft through Workato or Gmail API.
- Provider status panel.
- Candidate transparency timeline.
- Candidate-safe prep brief.
- Manual or seeded notes feedback generation.
- Workato callback and receipt display.

### Could Have

- Candidate addendum attachments and additional evidence upload.
- Application tracker sync.
- Supabase Postgres persistence with Auth and Storage for the hosted demo.
- Admin integration setup screen.
- Analytics for evidence coverage.

## Non-Goals For The Hackathon

- Full ATS replacement.
- Automated hiring decisions.
- Production-grade role-based access control across many tenants.
- Live Google Meet transcript ingestion as the golden path.
- Salary or labor-market claims without source-backed grounding.
- Candidate web surveillance.
- Deep package renaming if it slows the demo.

## Success Criteria

sup'work wins if judges can see:

- A real hosted product, not just a local prototype.
- Real HR and interviewee sessions that make hiring more transparent and humane across two live accounts.
- An HR-side workflow that improves speed without removing human judgment.
- Exa used centrally for public role, company, and interviewer research.
- A real Google Meet scheduling or Workato automation action after approval.
- Clear separation between candidate evidence, public research, AI interpretation, and internal notes.
- A convincing audit trail proving what happened and who approved it.




