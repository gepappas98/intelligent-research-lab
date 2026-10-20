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
