# 2026-06-27 Dev Log

## Claim: google-calendar-read-add-entry
- Owner: Codex
- Started: 2026-06-27 13:47 +08:00
- Status: complete
- Goal: add a simple event creation function to the manual Google Calendar read script.
- Scope:
  - `tests/google_calendar_read.py`
  - `nic_notes/dev_logs/2026-06-27-google-calendar-read-add.md`
- Avoid:
  - `.env`
  - `secrets/`
  - `nic_notes/dev_logs/2026-06-27.md`, which is currently deleted in the working tree
  - backend runtime behavior
- Expected output:
  - script keeps read behavior by default and only creates a calendar entry with an explicit flag
- Current notes:
  - existing script uses Google quickstart OAuth token flow and read-only scope
  - write support needs an events write scope; existing readonly token may need to be regenerated
- Verification plan:
  - run script help
  - avoid live event creation unless explicitly requested
- Parallel-safe work:
  - backend, frontend, and Supabase work can continue independently

## Changes
- `tests/google_calendar_read.py`: added `get_calendar_credentials`, `add_calendar_entry`, and `list_upcoming_events` helpers.
- `tests/google_calendar_read.py`: added CLI flags for `--add-entry`, `--summary`, `--start-time`, `--end-time`, `--timezone`, `--calendar-id`, and `--max-results`.

## Verification
- `.venv\Scripts\python.exe tests\google_calendar_read.py --help`: passed and showed add-entry options.
- `.venv\Scripts\python.exe -m py_compile tests\google_calendar_read.py`: passed.
- `.venv\Scripts\python.exe -m unittest discover -s tests -v`: passed 6 tests; the manual Calendar script was not picked up by unit discovery.
- not run: live calendar creation, because it would create a real Google Calendar event.

## Handoff / Next
- List events with `.venv\Scripts\python.exe tests\google_calendar_read.py`.
- Add an event with `.venv\Scripts\python.exe tests\google_calendar_read.py --add-entry --summary "Demo event" --start-time "2026-06-28T10:00:00+08:00" --end-time "2026-06-28T10:30:00+08:00"`.
- If an existing `token.json` was created with read-only scope, delete/regenerate it because this script now requests `https://www.googleapis.com/auth/calendar.events`.
- Released: `tests/google_calendar_read.py`

## Claim: google-calendar-secret-discovery
- Owner: Codex
- Started: 2026-06-27 14:01 +08:00
- Status: complete
- Goal: make the manual Google Calendar script discover the local OAuth client secret JSON from `secrets/`.
- Scope:
  - `tests/google_calendar_read.py`
  - `tests/google_calendar_smoke.py`
  - `nic_notes/dev_logs/2026-06-27-google-calendar-read-add.md`
- Avoid:
  - `.env`
  - `secrets/`
  - backend runtime behavior
- Expected output:
  - script loads `secrets/client_secret*.json` without hardcoding a secret filename
- Current notes:
  - user referred to `google_calender_test.py`; repo currently has `google_calendar_read.py` and `google_calendar_smoke.py`
- Verification plan:
  - run script help or py_compile without invoking live OAuth/calendar mutation
- Parallel-safe work:
  - frontend, backend API, and unrelated tests can continue independently

## Changes
- `tests/google_calendar_read.py`: added default `secrets/client_secret*.json` discovery through `pathlib`, explicit missing-secret error text, and parent creation for `secrets/token.json`.
- `tests/google_calendar_read.py`: added `--client-secret-file` so a specific Google OAuth client JSON can be passed without hardcoding the secret filename.

## Verification
- `.venv\Scripts\python.exe -m py_compile tests\google_calendar_read.py tests\google_calendar_smoke.py`: passed.
- `.venv\Scripts\python.exe tests\google_calendar_read.py --help`: passed and shows `--client-secret-file`.
- not run: live OAuth/calendar add flow, because that opens a browser and may create/use live credentials.

## Handoff / Next
- Use `tests/google_calendar_read.py`; there is no `tests/google_calender_test.py` in the repo.
- The script now auto-loads the first `secrets/client_secret*.json` file.
- To force the specific local file, pass `--client-secret-file "secrets\client_secret_175442647594-0s2ugp2vgf38puusnup05nlv60tdjjut.apps.googleusercontent.com.json"`.
- Released: `tests/google_calendar_read.py`, `tests/google_calendar_smoke.py`
