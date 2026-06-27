# sup'work Frontend Workspace

This folder is reserved for the sup'work frontend. It is scaffolded for a future React/Vite/TypeScript implementation, but it intentionally does not include package manager files yet. Import the prototype zip and Figma assets first, then wire the app to the backend.

## Current Backend Context

The recent pull fast-forwarded to `dc32053 backend first draft`.

Backend shape now available:

- FastAPI package: `supwork_backend/`
- Auth/session endpoints for demo roles
- Role-shaped workflow APIs for interviewee and HR
- Evidence, research, scheduling, addendum, feedback, approval, audit, and provider-status paths
- Fixture-first mode with optional live Exa, Google Calendar/Gmail, and Azure/OpenAI-compatible provider
- Smoke script: `scripts/supwork_workflow_smoke.py`

Expected local backend command:

```powershell
.venv\Scripts\python.exe -m uvicorn supwork_backend.main:app --host 127.0.0.1 --port 8787
```

## Intended Frontend Stack

Recommended stack once code is imported:

- React
- TypeScript
- Vite
- Tailwind CSS
- lucide-react
- shared mock/API adapter boundary before live backend wiring

## Folder Map

```text
frontend/
  imports/
    source-zip/
    figma-images/
    figma-exports/
  design/
    figma-screens/
    reference/
  public/
  src/
    app/
    api/
    assets/
    components/
      addendum/
      approvals/
      audit/
      evidence/
      feedback/
      forms/
      layout/
      provider/
      research/
      schedule/
      timeline/
      ui/
    data/
    hooks/
    lib/
    pages/
      auth/
      hr/
      interviewee/
    styles/
    types/
  tests/
  e2e/
```

## Import Drop Zones

- Put your frontend prototype zip in `frontend/imports/source-zip/`.
- Put Figma screenshots or exports in `frontend/imports/figma-images/`.
- Put structured Figma exports, SVGs, or component exports in `frontend/imports/figma-exports/`.

After importing the zip, keep generated source files inside `frontend/src/` unless the zip already has a clear framework root. If the zip includes its own `package.json`, place it at `frontend/package.json`.

## Product Structure To Preserve

The frontend should support two authenticated demo accounts:

- `interviewee@demo.supwork.local`
- `hr@demo.supwork.local`

Do not implement a simple in-app role toggle as the final demo model. The intended UX is a real login screen with role-shaped routing:

- Interviewee account: timeline, evidence, role brief, prep, schedule, post-interview addendum, feedback, data/consent.
- HR account: pipeline, candidate packet, Exa research, interview plan, scheduling approvals, addendum review, follow-up, audit.

## Backend Wiring Notes

Keep API code isolated under `src/api/`.

Recommended client files later:

```text
src/api/client.ts
src/api/auth.ts
src/api/workflows.ts
src/api/approvals.ts
src/api/integrations.ts
src/api/providerStatus.ts
```

Recommended type files later:

```text
src/types/auth.ts
src/types/workflow.ts
src/types/evidence.ts
src/types/research.ts
src/types/addendum.ts
src/types/audit.ts
src/types/integrations.ts
```

## Visual Priority

The main visual anchor should be the shared Hiring Journey timeline:

1. Intake
2. Evidence Mapped
3. Research Ready
4. Interview Planning
5. Interview Scheduled
6. Interview Complete
7. Addendum Review
8. Follow-Up

Keep candidate-visible and internal-only content visually distinct.

