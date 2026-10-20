#!/usr/bin/env python3
"""Validate an append-only JSONL matching-conclusions ledger.

This validates structure and internal references only. It does not claim that source
records exist unless --source-ids is supplied, and it never rewrites input files.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

REQUIRED = {
    "conclusion_id", "recorded_at_utc", "matching_run_id", "matching_version",
    "source_record_ids", "source_snapshot_checksums", "time_window", "hypothesis",
    "observations", "conclusion", "confidence", "limitations", "counterevidence",
    "next_test", "status",
}
STATUSES = {"exploratory", "replicated", "contradicted", "retired"}
SHA256 = re.compile(r"^[0-9a-f]{64}$")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ledger", type=Path, help="JSONL file; one conclusion object per line")
    parser.add_argument("--source-ids", type=Path, help="Optional newline-delimited known source record IDs")
    args = parser.parse_args()

    known_sources = None
    if args.source_ids:
        known_sources = {line.strip() for line in args.source_ids.read_text(encoding="utf-8").splitlines() if line.strip()}

    errors: list[str] = []
    seen: dict[str, int] = {}
    count = 0
    for line_no, raw in enumerate(args.ledger.read_text(encoding="utf-8").splitlines(), 1):
        if not raw.strip():
            continue
        count += 1
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError as exc:
            errors.append(f"line {line_no}: invalid JSON: {exc.msg}")
            continue
        if not isinstance(obj, dict):
            errors.append(f"line {line_no}: record must be a JSON object")
            continue

        missing = sorted(REQUIRED - obj.keys())
        if missing:
            errors.append(f"line {line_no}: missing fields: {', '.join(missing)}")
        cid = obj.get("conclusion_id")
        if not isinstance(cid, str) or not cid.strip():
            errors.append(f"line {line_no}: conclusion_id must be a non-empty string")
        elif cid in seen:
            errors.append(f"line {line_no}: duplicate conclusion_id {cid!r} (first seen line {seen[cid]})")
        else:
            seen[cid] = line_no

        for field in ("recorded_at_utc", "matching_run_id", "matching_version", "hypothesis", "conclusion", "next_test"):
            if field in obj and (not isinstance(obj[field], str) or not obj[field].strip()):
                errors.append(f"line {line_no}: {field} must be a non-empty string")

        if "status" in obj and obj["status"] not in STATUSES:
            errors.append(f"line {line_no}: status must be one of {', '.join(sorted(STATUSES))}")
        src = obj.get("source_record_ids")
        if not isinstance(src, list) or not src or any(not isinstance(x, (str, int)) or not str(x).strip() for x in src):
            errors.append(f"line {line_no}: source_record_ids must be a non-empty list of IDs")
        elif known_sources is not None:
            unknown = sorted({str(x) for x in src} - known_sources)
            if unknown:
                errors.append(f"line {line_no}: source IDs not found in supplied source inventory: {', '.join(unknown[:20])}")

        checksums = obj.get("source_snapshot_checksums")
        if not isinstance(checksums, list) or not checksums:
            errors.append(f"line {line_no}: source_snapshot_checksums must be a non-empty list")
        elif any(not isinstance(x, str) or not SHA256.fullmatch(x) for x in checksums):
            errors.append(f"line {line_no}: each source_snapshot_checksums entry must be a 64-character lowercase SHA-256 hex digest")

        for field in ("time_window", "observations", "confidence", "limitations", "counterevidence"):
            if field in obj and obj[field] is None:
                errors.append(f"line {line_no}: {field} must not be null; use an explicit empty value plus a limitation when applicable")

    if errors:
        print(f"FAIL: {len(errors)} issue(s) across {count} record(s).", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"PASS: {count} conclusion record(s); required fields, unique IDs, statuses and checksum formats valid.")
    if known_sources is None:
        print("NOTE: source-record existence was not checked; supply --source-ids to enable that check.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
