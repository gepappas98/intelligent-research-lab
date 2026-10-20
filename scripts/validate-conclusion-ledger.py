#!/usr/bin/env python3
"""Validate an append-only JSONL conclusions ledger without modifying it.

Usage: python3 scripts/validate-conclusion-ledger.py path/to/conclusions.jsonl
The validator checks record shape and unique conclusion IDs. It does not claim that
source IDs resolve until a source manifest is supplied by the caller.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REQUIRED = {
    "schema_version",
    "conclusion_id",
    "recorded_at_utc",
    "matching_run_id",
    "matching_version",
    "source_record_ids",
    "source_snapshot_checksums",
    "time_window",
    "hypothesis",
    "observations",
    "conclusion",
    "confidence",
    "limitations",
    "counterevidence",
    "next_test",
    "status",
}
STATUSES = {"exploratory", "replicated", "contradicted", "retired"}


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: validate-conclusion-ledger.py <conclusions.jsonl>")
    path = Path(sys.argv[1])
    if not path.is_file():
        fail(f"file not found: {path}")

    seen: set[str] = set()
    count = 0
    with path.open("r", encoding="utf-8") as stream:
        for line_number, line in enumerate(stream, 1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                fail(f"line {line_number}: invalid JSON: {exc}")
            if not isinstance(record, dict):
                fail(f"line {line_number}: each JSONL entry must be an object")
            missing = sorted(REQUIRED - record.keys())
            if missing:
                fail(f"line {line_number}: missing fields: {', '.join(missing)}")
            for field in ("conclusion_id", "matching_run_id", "matching_version", "hypothesis", "conclusion"):
                if not isinstance(record[field], str) or not record[field].strip():
                    fail(f"line {line_number}: {field} must be a non-empty string")
            if record["conclusion_id"] in seen:
                fail(f"line {line_number}: duplicate conclusion_id {record['conclusion_id']!r}")
            seen.add(record["conclusion_id"])
            if record["status"] not in STATUSES:
                fail(f"line {line_number}: invalid status {record['status']!r}")
            if not isinstance(record["source_record_ids"], list) or not record["source_record_ids"]:
                fail(f"line {line_number}: source_record_ids must be a non-empty list")
            if not isinstance(record["source_snapshot_checksums"], (dict, list)) or not record["source_snapshot_checksums"]:
                fail(f"line {line_number}: source_snapshot_checksums must be a non-empty object/list")
            if not isinstance(record["time_window"], dict):
                fail(f"line {line_number}: time_window must be an object")
            if not isinstance(record["observations"], (dict, list)):
                fail(f"line {line_number}: observations must be an object/list")
            count += 1

    print(f"OK: {count} conclusion records; {len(seen)} unique conclusion IDs.")
    print("NOTE: source-ID existence, checksum validity, timestamp semantics, and append-only history require cross-validation against run/source manifests.")


if __name__ == "__main__":
    main()
