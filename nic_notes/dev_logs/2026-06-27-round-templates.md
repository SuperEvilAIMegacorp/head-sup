# 2026-06-27 Round Templates Dev Log

## Claim: round-templates
- Owner: nic-codex
- Started: 2026-06-27 14:43 SGT
- Status: complete
- Goal: add plain dict backend helpers for R1/R2/R3 TalentFlow-style interview round templates.
- Scope:
  - `supwork_backend/round_templates.py`
  - `nic_notes/dev_logs/2026-06-27-round-templates.md`
- Avoid:
  - `supwork_backend/store.py`
  - `supwork_backend/main.py`
  - `supwork_backend/schemas.py`
  - tests
  - frontend
  - `system_design/`
- Expected output:
  - importable helper functions returning plain dictionaries/lists for default round seeding and payload shaping
- Current notes:
  - helper must avoid pydantic coupling so store.py can import it later
  - outputs should stay candidate-safe by default where candidate fields are exposed
- Verification plan:
  - import/compile check for `supwork_backend.round_templates`
- Parallel-safe work:
  - other agents can wire these helpers into store/API/UI without editing this file if the exported function names fit

## Changes
- `supwork_backend/round_templates.py`: added plain dict R1/R2/R3 templates and helpers for lookup, default round creation, and payload enrichment.
- `nic_notes/dev_logs/2026-06-27-round-templates.md`: recorded scoped claim, verification, and handoff.

## Verification
- `python -m py_compile supwork_backend/round_templates.py`: passed
- `python -c "from supwork_backend.round_templates import default_rounds, get_round_template, round_template_payload; assert get_round_template('r2')['roundType'] == 'system_design'; rounds = default_rounds('wf_demo'); assert len(rounds) == 3; assert round_template_payload({'id': 'x', 'workflowId': 'wf_demo', 'roundNumber': 1})['roundType'] == 'technical'; print('round_templates_ok')"`: passed
- `Select-String -Path supwork_backend/round_templates.py,nic_notes/dev_logs/2026-06-27-round-templates.md -Pattern '[^\x00-\x7F]'`: no matches

## Decisions
- Templates are centralized as `ROUND_TEMPLATES` and exported through copy-returning helpers to avoid accidental mutation of global config.
- `default_rounds(workflow_id)` emits store-friendly round records with deterministic IDs like `{workflow_id}_r1`.
- `round_template_payload(round_record)` preserves stored fields while adding top-level template fields and a nested `template` copy for consumers that prefer grouped metadata.

## Handoff / Next
- Main agent can import `default_rounds`, `get_round_template`, or `round_template_payload` from `supwork_backend.round_templates`.
- Suggested store usage: seed `interviewRounds` from `default_rounds(workflow_id)` and wrap stored rounds with `round_template_payload(round_record)` before returning recruiter/candidate round workbench payloads.
- Released: `supwork_backend/round_templates.py` and `nic_notes/dev_logs/2026-06-27-round-templates.md`.
