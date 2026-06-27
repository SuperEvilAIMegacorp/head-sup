# Agent-To-Agent Development Protocol

This file defines how two Codex agents should collaborate on this project without overwriting each other, creating race conditions, or mixing unrelated changes.

## Core Rule

Only one agent should own a file at a time.

Before editing, an agent must declare the files or directories it intends to touch. The other agent must avoid those paths until ownership is released or explicitly transferred.

## Workspace Ownership Log

Use this section as the lightweight lock table. Update it before starting work and again after finishing.

| Owner | Task | Files / directories owned | Status | Started | Released |
| --- | --- | --- | --- | --- | --- |
| Unassigned | None | None | available | - | - |

Status values:

- `planned`: agent intends to work here but has not edited yet.
- `active`: agent is currently reading or editing these files.
- `blocked`: agent cannot continue without input.
- `released`: agent is done and other agents may edit these files.

Example entry:

| Owner | Task | Files / directories owned | Status | Started | Released |
| --- | --- | --- | --- | --- | --- |
| Agent A | Add Exa backend wrapper | `backend/integrations/exa.py`, `tests/test_exa.py` | active | 2026-06-27 10:45 SGT | - |

## Before Starting Work

Each agent should:

1. Run `git status --short`.
2. Read this file.
3. Check the ownership log for active or planned file ownership.
4. Add or update a row claiming the files it will edit.
5. Pull in enough context by reading files before patching.
6. Avoid editing files with unrelated user or partner changes unless the task requires it.

Recommended status message to partner:

```text
I am taking ownership of <paths> for <task>. I will release them when done.
```

## During Work

Agents should keep edits small and path-scoped.

Rules:

- Do not edit a file owned by the other agent.
- Do not run broad formatters across the whole repo unless both agents agree.
- Do not rename or move shared directories while another agent is active.
- Do not delete files unless the task explicitly requires it and ownership is clear.
- Do not combine unrelated cleanup with feature work.
- Prefer adding new files over modifying shared files when planning or documenting.
- If generated files appear, mention them in the ownership log or final handoff.

## File Ownership Guidelines

Recommended split for this project:

| Area | Suggested owner |
| --- | --- |
| Product docs and hackathon submission | One agent at a time |
| Frontend React/Vite UI | Frontend agent |
| Backend API and persistence | Backend agent |
| Google Workspace integration | Backend/integrations agent |
| Workato recipes and callbacks | Backend/integrations agent |
| Exa research integration | Backend/AI agent |
| Tests and smoke scripts | Owner of related feature |
| README and root docs | One agent at a time |

Avoid two agents editing:

- `README.md`
- `.env.example`
- package or lock files
- central route files
- shared type/model files
- root-level planning docs

If both agents need the same file, one agent should finish and release it before the other starts.

## Handoff Format

When releasing ownership, update the log and leave a short handoff note.

Use this format:

```text
Released: <paths>
Changed: <summary>
Verification: <commands run or not run>
Follow-up: <remaining work or risks>
```

Example:

```text
Released: `backend/integrations/exa.py`, `tests/test_exa.py`
Changed: Added Exa search client and unit tests.
Verification: `uv run python -m unittest tests.test_exa -v`
Follow-up: Wire endpoint into frontend research tab.
```

## Conflict Prevention Checklist

Before applying a patch:

- Confirm the file is not owned by another active agent.
- Re-read the file if it may have changed.
- Keep the patch narrow.
- Avoid modifying unrelated lines.
- Avoid large automated rewrites.

Before final response:

- Run `git status --short`.
- Mention changed files.
- Mention tests or checks run.
- Release owned files in this document if the work is complete.

## Conflict Recovery

If both agents edited the same file:

1. Stop further edits.
2. Run `git status --short`.
3. Identify both agents' intended changes.
4. Read the current file fully.
5. Merge manually with a small patch.
6. Do not discard partner changes.
7. Add a note in the handoff describing the conflict and resolution.

If a change appears unexpectedly:

- Assume it was made by the partner or user.
- Do not revert it.
- If it conflicts with your task, stop and ask for direction.
- If it does not conflict, continue and avoid touching it.

## Branching Recommendation

For low-friction hackathon work:

- Use one branch per feature if possible.
- Use short-lived branches such as `feature/exa-research`, `feature/google-calendar`, or `feature/workato-callbacks`.
- Merge only after tests pass or the limitation is documented.

If working directly on one branch:

- Keep ownership rows updated.
- Commit small, coherent changes.
- Avoid long-running edits to shared files.

## Commit Discipline

Each commit should represent one coherent unit:

- One feature.
- One bug fix.
- One documentation update.
- One integration wiring change.

Commit message format:

```text
area: concise change summary
```

Examples:

```text
docs: add system design workflow
integrations: add exa research client
api: add google calendar scheduling endpoint
frontend: add approval card for scheduling
```

## High-Risk Files

Treat these as single-owner files:

```text
README.md
AGENT_TO_AGENT.md
hackathon.md
.env.example
package.json
package-lock.json
pyproject.toml
uv.lock
```

If any of these need edits, claim them explicitly in the ownership log.

## Default Development Order

Suggested order to minimize collisions:

1. Agent A owns backend models and API endpoints.
2. Agent B owns frontend screens using mocked API payloads.
3. Agent A releases endpoint contracts.
4. Agent B wires frontend to real endpoints.
5. Agent A owns integration tests.
6. Agent B owns UI polish and demo flow.
7. Both agents review docs and submission material one at a time.

## Non-Negotiables

- Never overwrite partner changes.
- Never use destructive git commands unless explicitly approved by the user.
- Never edit secrets into committed files.
- Never expose API keys through frontend environment variables.
- Never perform external side effects without a human-approved demo path.
- Always document unrun tests or incomplete verification.

## Current Project Notes

The project idea currently includes:

- TalentFlow IQ-style hiring workflow.
- Exa search for role, company, and interview research.
- Google Workspace for Gmail, Calendar, and Google Meet scheduling.
- Optional Workato recipes for scheduling, follow-up, and downstream automation.
- Approval-gated actions for email, scheduling, stage changes, and candidate communication.

Keep those boundaries intact when implementing.
