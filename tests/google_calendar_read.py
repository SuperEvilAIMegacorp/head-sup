import datetime
import os.path
import argparse
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def default_client_secret_file(root_dir):
  secret_files = sorted((root_dir / "secrets").glob("client_secret*.json"))
  if secret_files:
    return secret_files[0]
  fallback = root_dir / "credentials.json"
  return fallback if fallback.exists() else None


def get_calendar_credentials(client_secret_file=None):
  # Resolve paths relative to the repository root directory
  root_dir = Path(__file__).resolve().parents[1]
  secrets_dir = root_dir / "secrets"
  token_path = secrets_dir / "token.json"
  if not secrets_dir.exists():
      token_path = root_dir / "token.json"

  creds = None

  # The file token.json stores the user's access and refresh tokens, and is
  # created automatically when the authorization flow completes for the first
  # time.
  if token_path.exists():
    creds = Credentials.from_authorized_user_file(token_path, SCOPES)
  elif (root_dir / "token.json").exists():
    creds = Credentials.from_authorized_user_file(root_dir / "token.json", SCOPES)

  # If there are no (valid) credentials available, let the user log in.
  if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
      creds.refresh(Request())
    else:
      secret_file = Path(client_secret_file).expanduser() if client_secret_file else default_client_secret_file(root_dir)
      if not secret_file or not secret_file.exists():
        raise FileNotFoundError(
            "Google OAuth client secret JSON not found. Put client_secret*.json in secrets/ "
            "or pass --client-secret-file path\\to\\client_secret.json."
        )
      print(f"Loading client secrets from: {secret_file}")
      flow = InstalledAppFlow.from_client_secrets_file(
          str(secret_file), SCOPES
      )
      creds = flow.run_local_server(port=0)
    # Save the credentials for the next run
    token_path.parent.mkdir(parents=True, exist_ok=True)
    with open(token_path, "w") as token:
      token.write(creds.to_json())

  return creds


def add_calendar_entry(service, summary, start_time, end_time, timezone_name="Asia/Singapore", calendar_id="primary"):
  event_body = {
      "summary": summary,
      "start": {"dateTime": start_time, "timeZone": timezone_name},
      "end": {"dateTime": end_time, "timeZone": timezone_name},
  }
  return (
      service.events()
      .insert(calendarId=calendar_id, body=event_body)
      .execute()
  )


def list_upcoming_events(service, calendar_id="primary", max_results=10):
  # Call the Calendar API
  now = datetime.datetime.now(tz=datetime.timezone.utc).isoformat()
  print(f"Getting the upcoming {max_results} events")
  events_result = (
      service.events()
      .list(
          calendarId=calendar_id,
          timeMin=now,
          maxResults=max_results,
          singleEvents=True,
          orderBy="startTime",
      )
      .execute()
  )
  events = events_result.get("items", [])

  if not events:
    print("No upcoming events found.")
    return

  # Prints the start and name of the next events
  for event in events:
    start = event["start"].get("dateTime", event["start"].get("date"))
    print(start, event.get("summary", "(no title)"))


def main():
  """Lists calendar events by default, or adds one entry with --add-entry."""
  parser = argparse.ArgumentParser(description="Read Google Calendar events or add a simple calendar entry.")
  parser.add_argument("--calendar-id", default="primary")
  parser.add_argument("--max-results", type=int, default=10)
  parser.add_argument("--add-entry", action="store_true", help="Create a calendar event instead of listing events.")
  parser.add_argument("--summary", default="sup'work demo calendar entry")
  parser.add_argument("--start-time", help="ISO datetime, e.g. 2026-06-28T10:00:00+08:00")
  parser.add_argument("--end-time", help="ISO datetime, e.g. 2026-06-28T10:30:00+08:00")
  parser.add_argument("--timezone", default="Asia/Singapore")
  parser.add_argument("--client-secret-file", help="Path to Google OAuth client_secret JSON. Defaults to secrets/client_secret*.json.")
  args = parser.parse_args()

  try:
    creds = get_calendar_credentials(client_secret_file=args.client_secret_file)
    service = build("calendar", "v3", credentials=creds)

    if args.add_entry:
      if not args.start_time or not args.end_time:
        raise ValueError("--start-time and --end-time are required with --add-entry")
      event = add_calendar_entry(
          service,
          summary=args.summary,
          start_time=args.start_time,
          end_time=args.end_time,
          timezone_name=args.timezone,
          calendar_id=args.calendar_id,
      )
      print("Calendar entry created")
      print(f"Event ID: {event.get('id')}")
      print(f"Summary: {event.get('summary')}")
      print(f"Calendar link: {event.get('htmlLink')}")
      return

    list_upcoming_events(service, calendar_id=args.calendar_id, max_results=args.max_results)

  except HttpError as error:
    print(f"An error occurred: {error}")


if __name__ == "__main__":
  main()
