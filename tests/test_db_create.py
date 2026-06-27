from __future__ import annotations

import sqlite3
import unittest
from contextlib import closing
from pathlib import Path
from uuid import uuid4

from db_test import init_sqlite

ROOT = Path(__file__).resolve().parents[1]


class LocalSqlitePrototypeDbTests(unittest.TestCase):
    def test_init_sqlite_creates_prototype_records_table(self) -> None:
        db_path = ROOT / ".local-data" / "supwork-test.sqlite"
        email = f"sqlite-test-{uuid4().hex[:8]}@example.com"
        init_sqlite(db_path)

        with closing(sqlite3.connect(db_path)) as conn:
            conn.execute(
                """
                INSERT INTO prototype_records (name, email)
                VALUES (?, ?)
                """,
                ("SQLite Test", email),
            )
            row = conn.execute(
                "SELECT name FROM prototype_records WHERE email = ?",
                (email,),
            ).fetchone()

        self.assertEqual(row, ("SQLite Test",))


if __name__ == "__main__":
    unittest.main()
