# Wrong-Repository Research Archive — Containment and Removal Plan

**Incident:** research-knowledge archive implementation was merged/applied in `gepappas98/pixel-perfect-pixels` / Supabase `yckewtpfttvwiptmmrfq`, not in the intended `gepappas98/intelligent-research-lab`.

**Status:** Read-only dependency inventory and removal plan. No rollback executed. This is intentional: archive tables contain records and retention coverage is incomplete.

## 1. Latest verified state — 2026-10-20

Read-only Supabase inspection returned:
- Database: **504,605,843 bytes / 481 MB**.
- `research_evidence`: 3,019 rows.
- `research_cases`: 3,000 rows.
- `research_findings`: 0 rows.
- `research_archive_control`: 1 control row.
- Archive control reports `archive_enabled=false`, `delete_enabled=false`.
- `get_research_archive_status(72,168)`: **incomplete**, 29,790 eligible retention-source records, 0 archived, 29,790 missing evidence.
- Missing evidence by source: `asset_news_events` 362; `asset_flow_snapshots` 9,360; `whale_flow_snapshots` 1,397; `asset_price_snapshots` 9,360; `whale_flow_transitions` 537; `event_flow_transmissions` 1; `asset_sentiment_snapshots` 7,698; `whale_flow_shock_followups` 538; `whale_flow_transition_context` 537.
- Cron jobs currently active:
  - `research-data-retention`: `17 3 * * *`, invokes `cleanup_research_data(72, 168, false)`.
  - `research-lab-data-readiness`: every 15 minutes, invokes `check_research_lab_data_readiness()`.
  - `research-whale-wave-readiness`: every 5 minutes, invokes `check_whale_wave_research_readiness()`.
- Database migration history contains four archive-specific applied versions:
  - `20261019222555 research_knowledge_archive_20261020160000`
  - `20261019222658 research_archive_delete_guard_20261020173000`
  - `20261019223022 research_knowledge_sync_batch_fix_20261020180000`
  - `20261019223432 research_archive_capture_gate_20261020182000`

These versions are recorded in the live database migration history; do not treat deleting migration files from Git as reversing applied SQL.

## 2. Security finding requiring review

The live `pg_policies` inventory showed public SELECT policies (`USING (true)`) for `anon` and `authenticated` on:
- `research_evidence`
- `research_cases`
- `research_findings`

The first two tables contain symbol-level source identifiers, bounded summaries, outcomes and links. This does not prove sensitive fields are present, but public read is broader than least privilege. Do not assume RLS enabled means data is private when a permissive SELECT policy exists.

**Containment priority:** review the actual intended product access model and current clients before changing policies. A separate narrowly scoped security fix may be warranted; do not combine it with destructive table removal. No policy was changed by this audit.

## 3. Deployed functions and dependency surface

Read-only routine inventory shows:
- Archive-specific: `archive_research_retention_sources`, `get_research_archive_status`, `refresh_research_knowledge_cases`.
- Existing research/readiness routines: `get_research_alerts`, `check_research_lab_data_readiness`, `check_whale_wave_research_readiness`.
- Existing cleanup routine: `cleanup_research_data`.

The wrong-repository `main` contains application callers/readers in:
- `src/lib/research-knowledge.ts` (contracts, validation, cohort and evidence eligibility rules).
- `src/lib/research-knowledge.functions.ts` (read path querying archive tables).
- `src/lib/pipeline.server.ts` (calls `refresh_research_knowledge_cases(72)` after post-mortems with timeout/fail-open behavior).
- Research Knowledge UI/dashboard and related tests (must be traced by exact current tree search before removing anything).

The readiness crons are separate existing research collectors/alerts; their names alone do not establish whether they predate the mistaken archive feature. Do not disable them as a shortcut.

## 4. Why immediate DROP/rollback is unsafe

- 3,019 evidence rows and 3,000 cases exist and have not been verified as transferred to the intended IRL destination.
- There are 29,790 eligible source rows with missing archive evidence; retention must remain disabled.
- The database is 481 MB, above the previously discussed 480 MB warning line. Dropping archive tables might reclaim only a small amount compared with the largest existing tables, and may create additional index/storage work. Do not claim that dropping these tables will resolve the storage issue.
- Application code calls the refresh RPC and reads these tables. Dropping them without first reverting/guarding callers can cause repeated errors and pipeline result noise.
- Applied migrations are immutable history; removing migration files does not undo them. A forward rollback migration must account for dependencies and preserve/export records.
- `research_findings` is empty, but that alone does not make the rest disposable.

## 5. Required removal sequence

### Phase A — freeze and preserve
1. Keep `allow_archive=false` and `allow_source_delete=false`.
2. Do not enable or run any retention DELETE path.
3. Export a bounded, verified snapshot of all 3,019 evidence rows, 3,000 cases and the control row to a secure, access-controlled artifact; verify counts, primary IDs, fingerprints and checksum. This must not be placed in a public repository.
4. Confirm the export can be read and reconciled before any drop.
5. Inventory all callers, policies, grants, RPC dependencies, cron jobs, indexes, migration history and any views before planning DDL.

### Phase B — decouple the source app
1. In a separate source-app PR, stop new writes to the mistaken archive RPC only after confirming no intended workflow depends on it.
2. Make the existing UI/read path fail gracefully if archive schema is unavailable; do not alter trade execution, strategy scoring, existing signal collection or readiness collectors.
3. Decide explicitly whether the current Research Knowledge UI should be retired, hidden, or left read-only until the proper IRL replacement is available.
4. Deploy only after review and a non-production test. The user controls Lovable publish/deploy.

### Phase C — rollback plan and review
1. Prepare a forward migration that first verifies export completion and then drops only the archive-specific tables/functions/indexes/policies created by the four archive migrations.
2. Do not drop or modify the three readiness functions/jobs unless dependency tracing proves they were introduced solely by the mistaken work; current evidence says they are separate research readiness mechanisms.
3. Do not touch `trades`, `composite_signals`, `strategy_variant_signals`, `pipeline_runs`, sentiment/flow/price/whale source tables, their history, or unrelated cron schedules.
4. Validate the rollback in an ephemeral PostgreSQL database populated with representative rows, including checks that unrelated source tables and existing cron jobs remain intact.
5. Review the migration and export checks before applying it to the canonical source project. This document itself does not authorize the production apply.

### Phase D — verify after approved rollback
- Confirm source tables and historical row counts are unchanged.
- Confirm archive-only tables/functions/policies are gone only after data export is verified.
- Confirm pipeline runs no longer attempt the removed RPC and no new errors are introduced.
- Measure database bytes and relation sizes before/after; do not infer storage savings.
- Record exact migration version, verification query outputs and recovery artifact location.

## 6. What is explicitly not authorized here

- No bulk copy of production records to IRL until IRL's own isolated backend is identified.
- No enabling retention or deleting any source rows.
- No dropping tables or functions, reverting migrations, or disabling cron jobs during this read-only audit.
- No changes to trade executor, strategy scoring, live/paper order behavior or historical outcomes.
- No service-role secrets or database credentials in GitHub, issues, logs or this document.

## 7. Exit criteria

Removal is ready for review only after:
- the source snapshot/export is verified;
- exact application callers and deployed SQL dependencies are mapped;
- IRL's isolated database identity is established;
- the destination data contract is approved;
- rollback is tested against a disposable database;
- the user-facing app deployment sequence is documented and separately reviewed.


## 8. Additional source-migration audit — temporal assumptions

Read-only inspection of the deployed `refresh_research_knowledge_cases(integer)` definition identified a material data-quality caveat:
- It writes `observed_at = source.created_at` and `available_at = source.created_at` for trades, composite signals and variant signals.
- The inspected source schemas do not establish that `created_at` equals the real signal event time or when the strategy could first know the values.
- The refresh maps trade cases to cohort `Unknown` and scorer `paper-trade`; it maps variant cohorts using fingerprint prefixes and stores V3 scorer label `v3-mtf-aligned`.
- For variant cases, `maturity_at` is assigned from `resolved_at` only for the limited terminal labels `win`, `loss`, or `expired`; it is not independently calculated as entry time + 72h.
- The refresh can update case outcome, PnL, timestamps and evidence links in place as source values change, while entry evidence is inserted once by fingerprint.

These behaviors do not by themselves prove individual records are wrong, but they mean the archive's bitemporal and maturity guarantees must not be assumed from the schema. Before any transfer, IRL must preserve the raw source timestamps and label inferred availability/maturity as unverified unless the upstream producer/evaluator contract confirms them. Do not copy these archive fields as authoritative event-time labels.


## 9. Fresh live snapshot — 2026-10-20 05:31 UTC

This newer read-only query supersedes the earlier size and eligible-source counts in Section 1:

- Database size: **505,736,339 bytes = 505.74 MB (decimal) / 482.31 MiB (binary)**.
- Archive rows: evidence 3,019; cases 3,000; findings 0; control 1.
- Retention preflight: **30,084 eligible, 0 archived, 30,084 missing evidence**; status remains `incomplete`.
- Missing evidence by source: `asset_news_events` 363; `asset_flow_snapshots` 9,450; `whale_flow_snapshots` 1,416; `asset_price_snapshots` 9,450; `whale_flow_transitions` 545; `event_flow_transmissions` 1; `asset_sentiment_snapshots` 7,773; `whale_flow_shock_followups` 541; `whale_flow_transition_context` 545.
- Control row remains `allow_archive=false`, `allow_source_delete=false`. The deployed cleanup function was inspected read-only and was not invoked.
- Archive table total relation sizes combine to 3,661,824 bytes (~3.49 MiB), so their removal alone cannot materially resolve overall database capacity pressure.

No rows were deleted and no source tables, controls, policies, functions, cron jobs or trading logic were changed.


## 10. Export/restore protocol and current preflight baseline — 2026-10-20

### 10.1 Destination identity result

The connected Supabase project listings (both account connections) contain only:
- `yckewtpfttvwiptmmrfq` / `trading-command-center` — active source project; not an IRL destination.
- `opwkbdbpqgtgcrmqqmbq` / `polymarket-quant-bot-lite` — inactive, unrelated project; not approved for IRL.

The connected Lovable workspace `george's Lovable` contains six projects; none is named Intelligent Research Lab. The existing Pixel Perfect Pixels project is `6d1cd604-982a-4237-98b3-1276c19ca6f7`, a trading app, not IRL. Project lookup for the previously observed ref `gbbrmzstuhdizfvabjvz` is denied from both Supabase connections. Consequently, **there is still no authoritative, accessible IRL Supabase project ref**. Do not infer a destination from a stale `.env`, a URL in Git, or an inaccessible ref.

### 10.2 Current private preflight manifest

A private, non-row-data manifest was generated at `/mnt/data/private_artifacts/irl_archive_preflight_manifest_20261020.json` (file mode 0600). Its SHA-256 is:

`a4747bba358e5ee3cd34d64752c17354301fc6dc31d21de4266944ad7fcfe83a`

It records the read-only source baseline at 2026-10-20 09:51:08 UTC:
- `research_evidence`: 3,019 rows; 3,019 unique IDs; 3,019 unique fingerprints.
- `research_cases`: 3,000 rows; 3,000 unique IDs; 2,801 distinct non-null fingerprints; 199 null fingerprints.
- `research_findings`: 0 rows.
- `research_archive_control`: 1 row; both archive/delete flags false.

The manifest contains row counts and aggregate hashes only, not production row payloads or credentials. Its SHA-256 is the hash of the manifest file itself. The per-table rowset/ID/fingerprint hashes are **baseline hashes, not yet export-file hashes and not yet proof of a successful restore**. The current export has not been created; no destination was written to.

### 10.3 Export protocol — do not execute until the destination and secure storage are verified

1. Use a dedicated, access-controlled local/private volume with encryption at rest. Do not place any data dump, row-level JSON, connection URI, password, or service-role key in GitHub, chat logs, issue comments or public artifacts.
2. Use a read-only source role for the preflight and a separate authorized export role for the dump. Establish one consistent MVCC snapshot for the dump and all aggregate verification queries; do not compare hashes captured at different times while the source refresh function can update cases.
3. Create a custom-format `pg_dump` artifact for exactly these tables: `public.research_evidence`, `public.research_cases`, `public.research_findings`, `public.research_archive_control`. Preserve primary IDs and all original column values. Also save a schema/dependency bundle containing table DDL, indexes, constraints, policies/grants, relevant `pg_get_functiondef` output and migration versions. Do not recreate cron jobs automatically from the bundle.
4. Produce a signed/immutable manifest with source project ref, database/server version, snapshot timestamp, dump SHA-256, per-table row count, distinct/non-null ID count, sorted-ID SHA-256, fingerprint null/distinct counts, sorted-fingerprint SHA-256, canonical full-rowset SHA-256, and schema/migration bundle SHA-256.
5. Encrypt the dump and manifest before moving them off the working volume. Record the encryption key reference separately from the artifact. Restrict access; verify the encrypted-file hash before and after transfer.
6. Restore into a **blank disposable PostgreSQL database**, never directly into the eventual IRL production database. Apply only the archive tables/schema needed for the drill; do not import source crons or the source's broad public-read policies into IRL. Keep any target schema changes separate from source-recovery fidelity.
7. Verify every table after restore: counts, distinct IDs, nulls, duplicate IDs, fingerprint counts, sorted ID hash, fingerprint hash, full-rowset hash, key constraints, and sample row-by-row comparisons. The restored manifest must match the export manifest exactly. A successful command exit alone is insufficient.
8. Test failure recovery by restoring a second time into another blank database, verify duplicate/create conflicts fail safely, then repeat a clean restore. Record the exact PostgreSQL version, commands, exit codes and comparison outputs. Never test by deleting/replacing rows in the source database.
9. Only after the export and restore are independently verified may the source-app decoupling and a rollback migration be reviewed. No step in this runbook authorizes a production rollback or source deletion.

**Canonical row hashing contract:** sort rows by primary-key text; compute the ID-set digest over newline-joined ID text; compute the rowset digest over newline-joined PostgreSQL `to_jsonb(row)::text` values in the same order. Preserve the PostgreSQL JSONB text representation as part of the hash contract. The artifact-file SHA-256 is a separate check and must never be substituted for the logical rowset digest.

### 10.4 Dependency trace relevant to recovery

A fresh catalog query found:
- No foreign-key constraints referencing or originating from the four archive tables.
- No triggers attached to those four tables.
- Archive-related routines: `archive_research_retention_sources(integer,integer)`, `get_research_archive_status(integer,integer)`, `refresh_research_knowledge_cases(integer)`, and the pre-existing `cleanup_research_data(integer,integer,boolean)`.
- `cleanup_research_data` calls the archive routine and must be included in dependency review before any schema rollback.
- `refresh_research_knowledge_cases` is called by the source app pipeline; the source app also has a read path and UI. Those application dependencies must be decoupled in a separately reviewed change.
- Active cron `research-data-retention` calls `cleanup_research_data(72,168,false)`; readiness crons call separate readiness functions and are not archive-only by name or definition.
- RLS is enabled, but SELECT policies for `anon` and `authenticated` use `USING (true)` on evidence/cases/findings. Preserve that as a security finding; do not blindly re-create these policies on IRL.

### 10.5 Disposable PostgreSQL test gate

The container environment does not have `psql`/PostgreSQL binaries, and package installation timed out without provisioning a local server. I did **not** claim a PostgreSQL restore test passed.

The available alternative is an isolated Supabase development branch on the source project. Supabase returned a quoted compute cost of **US$0.01344 per hour** (about US$0.32/day or US$9.81 for 30 days if left running). Branch creation has not occurred; explicit user approval is required before confirming that cost and creating the branch. If approved, use only synthetic fixture rows in the branch, verify the restore procedure, and do not merge the branch to production. No production rows are to be copied into the test branch.
