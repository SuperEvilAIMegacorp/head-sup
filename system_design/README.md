# sup'work System Design

Canonical system design package for the Sup 2026 hackathon build and live demo.

sup'work is a seeker-first, two-sided hiring transparency platform. It gives candidates a clear evidence trail, interview process visibility, and candidate-safe feedback while giving recruiters approval-gated AI tools for research, interviews, scheduling, follow-up, and auditability.

This folder replaces the earlier single-document design. Each file is standalone enough for a workstream owner to use without referring back to `jy_notes/`, `nic_notes/`, or the old codebase.

## Document Map

| File                                | Purpose                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `01-product-strategy.md`            | Product thesis, hackathon fit, users, value proposition, scope, and judging strategy.                     |
| `02-experience-design.md`           | Interviewee and HR UX, information architecture, screen design, copy rules, and transparency UI patterns. |
| `03-workflows-and-demo-journeys.md` | End-to-end workflow states, live demo journey, interviewee/HR flows, and approval moments.                |
| `04-system-architecture.md`         | Frontend, backend, agent, provider, deployment, observability, and service-boundary architecture.         |
| `05-integrations.md`                | Exa, Google Calendar/Meet, Gmail, Workato, and model-provider integration design.                         |
| `06-data-and-api.md`                | Data model, visibility model, API surface, view models, audit events, and lifecycle rules.                |
| `07-safety-transparency-ethics.md`  | Humane transparency contract, feedback rules, approval matrix, privacy, and misuse prevention.            |
| `08-hosting-demo-delivery.md`       | Hosted demo plan, environment setup, fallback strategy, golden path, preflight, and submission assets.    |
| `09-implementation-roadmap.md`      | Build phases, workstream split, tests, acceptance criteria, risks, and open decisions.                    |

## North Star

Job seeking is stressful because the process is hidden. sup'work makes the process inspectable, source-backed, and human-controlled.

The candidate should always be able to answer:

- What stage am I in?
- What information is being used?
- Where did it come from?
- Who approved any message, schedule, or next step?
- What can I do next?

The HR user should always be able to answer:

- What evidence supports this candidate's fit?
- What evidence is missing or unclear?
- What public role or company context matters?
- What will the candidate see?
- What external action is being approved?
- What happened, when, and through which provider?

## Product Position

sup'work is not an AI hiring decision engine. It is a transparency and coordination layer around the hiring process.

It intentionally avoids:

- Automated rejection or advancement.
- Candidate scoring as the primary product object.
- Secret candidate surveillance.
- Hidden communication or calendar automation.
- Raw internal-note exposure to candidates.
- Job-placement guarantees.

It intentionally emphasizes:

- Candidate agency.
- Evidence provenance.
- Constructive gap language.
- Human approval.
- Source-backed public research.
- Candidate-visible receipts.
- Hosted live proof.

## Core Build Choice

The live demo must include both sides of the workflow through real authenticated accounts, not a demo-only toggle:

- **Interviewee account**: transparent role evidence, status timeline, interview schedule, prep brief, post-interview addendum, and approved feedback.
- **HR account**: evidence review, Exa research, interview planning, approval cards, Google Meet scheduling, Workato receipts, candidate addendum review, and audit.

The design leans toward job seekers because the hackathon goal is to make job seeking more transparent and humane. The recruiter side exists to make that transparency real in an operational hiring workflow.

For the strongest hosted demo, run the interviewee account on one laptop and the HR account on another. Both accounts connect to the same hosted backend and database so scheduling, addendum submission, approvals, receipts, and audit events update live across both sessions.

## Sponsor Technology Strategy

| Sponsor/tool                      | Role in sup'work                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Exa                               | Public company, role, market, and interviewer-prep research with source URLs.                                         |
| Workato                           | Approved cross-app automation for Gmail drafts/sends, tracker updates, notifications, and optional Calendar fallback. |
| OpenAI / Foundry / model provider | Evidence synthesis, question generation, candidate-safe summaries, and workflow assistant responses.                  |
| Codex                             | Development acceleration and implementation workflow.                                                                 |

The sponsor tools are central to the product, not decorative. Exa grounds the research layer, Workato performs approved actions, and the model coordinates reasoning inside strict safety boundaries.

## Golden Demo In One Paragraph

A judge opens the hosted sup'work site on two laptops. One session logs in as the interviewee and shows a transparent timeline plus CV evidence against a target role. The second session logs in as HR, runs Exa company and role research, generates interview questions tied to evidence gaps, creates an approval card, and schedules a real Google Meet interview. The interviewee account updates with the confirmed schedule and prep brief. After the interview, the interviewee submits a post-interview addendum with clarifications, special consideration, or additional documents. HR reviews the addendum, adds seeded/manual interview notes, approves a candidate-safe follow-up or Workato/Gmail draft, and shows an audit log proving the AI, Exa, approval, Google, Workato, addendum, and communication events.

## To run the backend

uvicorn supwork_backend.main:app --host 127.0.0.1 --port 8787
