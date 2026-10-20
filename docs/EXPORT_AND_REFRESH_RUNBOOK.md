# Historical data export and refresh runbook

## Current truth
The repository currently contains the research knowledge and export tooling, not source row payloads. A real snapshot is created only when the export script runs successfully with a private connection to the verified source. Never paste a database URL or password into a chat, issue, PR, commit, or workflow log.

## First full snapshot
1. Use a trusted local machine with `psql`, `pg_dump`, `sha256sum`, and `git` installed and the IRL repository checked out on the reviewed branch.
2. Obtain the source connection string from the authorized secret store. Confirm the host/project ref is the canonical export-only source `yckewtpfttvwiptmmrfq`.
3. Enter the connection string without echoing it or placing it in shell history:
   ```bash
read -rsp 'Source database URL: ' SOURCE_DATABASE_URL; echo
export SOURCE_DATABASE_URL
export SOURCE_PROJECT_REF=yckewtpfttvwiptmmrfq
bash scripts/export-versioned-research-data.sh
unset SOURCE_DATABASE_URL
```
4. Inspect `data/historical/snapshots/<timestamp>/metadata/`, especially included/missing tables, row counts, checksums, and source identity. Inspect `pipeline_runs` payloads for accidental credentials or unrelated personal data before committing. The allowlist is a safety boundary, not a guarantee that every row is safe to publish.
5. Check per-table counts against the source, validate time ranges and representative rows, run a secret scan, and verify no file exceeds GitHub's limit. Then commit the reviewed snapshot to this private repository.
6. Keep the original source untouched. Do not create a destination, restore, truncate, or delete source data as part of export.

## Ongoing enrichment
Do not repeatedly commit full snapshots on a schedule: that duplicates binary table dumps in Git history and can grow the repository quickly. Before automatic refresh is enabled, define per-table stable primary keys, incremental watermarks, correction/retraction handling, and a manifest that records the last successfully exported watermark. Append only verified new/changed records in deterministic, compressed chunks, and run duplicate/count/checksum checks. For tables without a reliable key/watermark, keep a deliberate full snapshot only after reviewing size and retention.

A GitHub Actions workflow should be enabled only after the source connection is stored as a repository Actions secret and the incremental exporter has been tested. Do not add a schedule that repeatedly performs full dumps.

## Isolated destination later
Create a brand-new Supabase project only when explicitly approved. Record and verify its project ref before restore. Restore the reviewed schema/data only into that new destination; reconcile row counts, primary keys, timestamp ranges, cohort labels, and outcomes before pointing any app at it. The source project is never the target.
