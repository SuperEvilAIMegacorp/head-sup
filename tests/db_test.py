from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from contextlib import closing
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SQLITE_PATH = ROOT / ".local-data" / "supwork.sqlite"
DEFAULT_SQL_PATH = ROOT / "tests" / "db.sql"


def env_value(name: str) -> str:
    return os.getenv(name, "").strip()


def first_env(*names: str) -> tuple[str, str]:
    for name in names:
        value = env_value(name)
        if value:
            return name, value
    return "", ""


def masked(value: str) -> str:
    if not value:
        return "missing"
    if len(value) <= 10:
        return "configured"
    return f"{value[:6]}...{value[-4:]}"


def probe_supabase_rest(table: str | None) -> bool:
    url = env_value("SUPABASE_URL").rstrip("/")
    key_name, key = first_env(
        "SUPABASE_SECRET_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY",
        "SUPABASE_PUBLISHABLE_KEY",
    )
    if not url or not key:
        print(
            "Supabase REST: skipped (SUPABASE_URL and one of SUPABASE_SECRET_KEY, "
            "SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or SUPABASE_PUBLISHABLE_KEY are required)"
        )
        return False

    print(f"Supabase REST: configured url={url} key_source={key_name} key={masked(key)}")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }
    endpoint = f"{url}/rest/v1/"
    params: dict[str, Any] = {}
    if table:
        endpoint = f"{url}/rest/v1/{table}"
        params = {"select": "*", "limit": "1"}

    response = httpx.get(endpoint, headers=headers, params=params, timeout=20)
    if response.status_code >= 400:
        print(f"Supabase REST: failed status={response.status_code} body={response.text[:300]}")
        return False

    if table:
        rows = response.json()
        row_count = len(rows) if isinstance(rows, list) else "unknown"
        print(f"Supabase REST: ok table={table} sampled_rows={row_count}")
    else:
        print("Supabase REST: ok PostgREST endpoint reachable")
    return True


def probe_supabase_jwks() -> bool:
    jwks_url = env_value("SUPABASE_JWKS_URL")
    if not jwks_url:
        print("Supabase JWKS: skipped (SUPABASE_JWKS_URL is not set)")
        return False

    response = httpx.get(jwks_url, timeout=20)
    if response.status_code >= 400:
        print(f"Supabase JWKS: failed status={response.status_code} body={response.text[:300]}")
        return False

    payload = response.json()
    keys = payload.get("keys") if isinstance(payload, dict) else None
    key_count = len(keys) if isinstance(keys, list) else "unknown"
    print(f"Supabase JWKS: ok keys={key_count}")
    return True


def init_sqlite(sqlite_path: Path, sql_file: Path = DEFAULT_SQL_PATH) -> None:
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    schema_sql = sql_file.read_text(encoding="utf-8") if sql_file.exists() else default_sqlite_schema()
    with closing(sqlite3.connect(sqlite_path)) as conn:
        conn.executescript(schema_sql)
        conn.commit()


def default_sqlite_schema() -> str:
    return """
    CREATE TABLE IF NOT EXISTS prototype_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """


def test_sqlite(sqlite_path: Path) -> bool:
    init_sqlite(sqlite_path)
    with closing(sqlite3.connect(sqlite_path)) as conn:
        conn.execute(
            """
            INSERT INTO prototype_records (name, email)
            VALUES (?, ?)
            ON CONFLICT(email) DO NOTHING
            """,
            ("Prototype User", "prototype@example.com"),
        )
        conn.commit()
        row = conn.execute("SELECT COUNT(*) FROM prototype_records").fetchone()
        pragma = conn.execute("PRAGMA quick_check").fetchone()
    ok = bool(row and row[0] >= 1 and pragma == ("ok",))
    print(f"SQLite: {'ok' if ok else 'failed'} path={sqlite_path} prototype_records={row[0] if row else 'unknown'}")
    return ok


def insert_csv_sqlite(sqlite_path: Path, table: str, csv_file: Path) -> int:
    import csv

    if not table:
        raise ValueError("--table is required with --csv")
    init_sqlite(sqlite_path)
    with csv_file.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        if not fieldnames:
            return 0
        placeholders = ", ".join("?" for _ in fieldnames)
        columns = ", ".join(fieldnames)
        rows = [tuple(row[name] for name in fieldnames) for row in reader]
    if not rows:
        return 0
    with closing(sqlite3.connect(sqlite_path)) as conn:
        conn.executemany(f"INSERT INTO {table} ({columns}) VALUES ({placeholders})", rows)
        conn.commit()
    return len(rows)


def insert_csv(
    database_url: str,
    table: str,
    csv_file: Path,
) -> int:
    """Insert a CSV into a PostgreSQL table using COPY."""
    import psycopg

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            with csv_file.open("r", newline="", encoding="utf-8") as f:
                cur.copy(
                    f"""
                    COPY {table}
                    FROM STDIN
                    WITH (
                        FORMAT CSV,
                        HEADER TRUE
                    )
                    """,
                    f,
                )
        conn.commit()

    with csv_file.open("r", encoding="utf-8") as f:
        return max(sum(1 for _ in f) - 1, 0)


def insert_rows(
    database_url: str,
    table: str,
    rows: list[tuple],
):
    """Example inserting rows with INSERT."""
    import psycopg

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.executemany(
                f"""
                INSERT INTO {table} (name, email)
                VALUES (%s, %s)
                ON CONFLICT (email) DO NOTHING
                """,
                rows,
            )
        conn.commit()


def test_connection(database_url: str):
    import psycopg

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT version()")
            version = cur.fetchone()[0]

    print("Connected successfully.")
    print(version)


def main():
    
    parser = argparse.ArgumentParser(
        description="Local SQLite prototype DB test, with optional Supabase/Postgres smoke checks."
    )

    parser.add_argument(
        "--table",
        help="Target table.",
    )

    parser.add_argument(
        "--csv",
        help="CSV file to import.",
    )

    parser.add_argument(
        "--test",
        action="store_true",
        help="Initialize and test the local SQLite database.",
    )
    parser.add_argument(
        "--sqlite-only",
        action="store_true",
        help="Only initialize and test the local SQLite database.",
    )
    parser.add_argument(
        "--sqlite-path",
        default=str(DEFAULT_SQLITE_PATH),
        help="Path to the local SQLite database file.",
    )
    parser.add_argument(
        "--rest-only",
        action="store_true",
        help="Only test Supabase REST credentials.",
    )
    parser.add_argument(
        "--db-only",
        action="store_true",
        help="Only test DATABASE_URL direct Postgres.",
    )
    parser.add_argument(
        "--jwks-only",
        action="store_true",
        help="Only test SUPABASE_JWKS_URL.",
    )

    args = parser.parse_args()

    load_dotenv(ROOT / ".env")

    if args.rest_only:
        return 0 if probe_supabase_rest(args.table) else 1

    if args.jwks_only:
        return 0 if probe_supabase_jwks() else 1

    sqlite_path = Path(args.sqlite_path)

    if args.sqlite_only or args.test:
        return 0 if test_sqlite(sqlite_path) else 1

    if args.csv and not args.db_only:
        count = insert_csv_sqlite(sqlite_path, args.table, Path(args.csv))
        print(f"Imported {count} rows into SQLite table '{args.table}'.")
        return 0

    if args.db_only:
        database_url = env_value("DATABASE_URL")
        print(f"DATABASE_URL: {masked(database_url)}")
        if not database_url:
            print("DATABASE_URL is missing.", file=sys.stderr)
            return 1
        if args.csv:
            count = insert_csv(
                database_url,
                args.table,
                Path(args.csv),
            )
            print(f"Imported {count} rows into '{args.table}'.")
            return 0
        test_connection(database_url)
        return 0

    return 0 if test_sqlite(sqlite_path) else 1


if __name__ == "__main__":
    raise SystemExit(main())
