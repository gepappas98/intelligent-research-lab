# Research Knowledge Archive — Dependency Inventory

**Status:** read-only source audit, 2026-10-20  
**Repository audited:** `gepappas98/pixel-perfect-pixels`  
**Destination:** `gepappas98/intelligent-research-lab`  
**Scope:** identify what must be decoupled before removing the mistakenly deployed archive. No production changes are authorized by this document.

## Confirmed source-side references

- `src/lib/pipeline.server.ts` calls `refresh_research_knowledge_cases({ p_lookback_hours: 72 })` after post-mortem generation. The call has an 8-second timeout and records a research sync status; its error path logs a warning and allows the trading flow to continue.
- `src/lib/research-knowledge.ts` and `src/lib/research-knowledge.functions.ts` implement the knowledge read path and UI-facing contracts. Search and trace all imports before removing either module.
- Research Knowledge dashboard/UI and related tests depend on the read path; exact route/component/test import graph must be checked against the current main tree immediately before decoupling.
- Deployed SQL objects include `research_evidence`, `research_cases`, `research_findings`, `research_archive_control`, `archive_research_retention_sources`, `get_research_archive_status`, and `refresh_research_knowledge_cases`.
- Existing operational functions include `cleanup_research_data`, `check_research_lab_data_readiness()`, and `check_whale_wave_research_readiness()`. Do not disable readiness collectors just because archive tables are being removed.
- Scheduled jobs observed: `research-data-retention` daily at 03:17 invoking `cleanup_research_data(72,168,false)`; `research-lab-data-readiness` every 15 minutes; `research-whale-wave-readiness` every 5 minutes. Verify the live job definitions immediately before any rollback.
- Archive-specific migration history observed: `20261020160000`, `20261020173000`, `20261020180000`, `20261020182000`. Removing migration files from Git does not reverse their effects in a deployed database.

## Separate candidate-finding work

The source repository PR #133, “Feat/research candidate findings”, is closed because it was opened in the wrong repository. Do not merge or deploy it there. Its candidate-finding implementation must be re-designed for IRL’s separate schema, evidence contract, and validation requirements. No finding should be called validated from aggregate counts alone; require source-linked evidence, sample checks, cohort separation, time-safe features, and out-of-sample evaluation.

## Critical safety constraints

1. Keep archive capture and source deletion disabled.
2. Do not drop tables, functions, indexes, policies, or migration history until an access-controlled export is verified and the complete caller/dependency graph is reviewed.
3. Decouple the source application first in a separate, reviewed change: remove or guard the RPC caller and ensure the UI handles a missing schema without affecting collectors or trading.
4. Test the exact forward rollback migration in disposable PostgreSQL with representative rows, grants, RLS policies, dependencies, and cron definitions.
5. Never copy raw production rows, credentials, or large `pipeline_runs.result` JSON payloads into public GitHub.
6. Do not point IRL at the canonical Trading Command Center project or the unverified Lovable database/migration target. Destination project identity is still a hard blocker.
7. Preserve source tables and historical paper-trading/execution records. This rollback is archive-specific only.

## Temporal-data warning

The deployed refresh function has used source `created_at` as both observed and available time. That is not sufficient proof of when a signal or feature became knowable. Treat those times as unverified provenance until the upstream producer semantics are established. Keep raw timestamps, mark uncertainty explicitly, and do not use these cases to assert a no-look-ahead backtest result.

## Verification checklist before rollback

- [ ] Exact current callers/imports, routes, tests, RPCs, grants, policies, triggers, views, and cron jobs inventoried.
- [ ] Export stored outside public GitHub; row counts, primary IDs, fingerprints, and checksum verified.
- [ ] IRL destination Supabase project ref independently verified and isolated.
- [ ] Rollback tested on disposable PostgreSQL and rollback/recovery steps rehearsed.
- [ ] Application decoupling merged and verified without trading/collector regressions.
- [ ] Before/after object inventory and storage measurements captured.
- [ ] Explicit approval for production rollback obtained after all above gates pass.


## Migration-source reconciliation — 2026-10-20

A static read of `supabase/migrations/20261020160000_research_knowledge_archive.sql` reveals an important comment/state mismatch: its header says the migration is “intentionally NOT applied to production by this change,” but the canonical database's live migration history records the migration and the three follow-up versions as applied. For operational decisions, the live migration history and read-only catalog inspection take precedence over stale comments in the source file.

The first migration explicitly creates permissive SELECT policies using `USING (true)` for both `anon` and `authenticated` on `research_evidence`, `research_cases`, and `research_findings`, and grants SELECT to those roles. This matches the observed live policy inventory and is a concrete least-privilege review item, not merely a theoretical concern. No policy or grant was changed during this audit.

The fourth migration also drops `public.research_cases_source_idx`, an index created by the first archive migration. It is archive-specific; still, any rollback plan must be based on the final live catalog, not a simplistic replay of file names. Do not restore/drop indexes blindly, and do not infer that dropping archive objects will materially reduce total database size.

These findings strengthen the requirements to reconcile every migration against live `pg_class`, `pg_proc`, `pg_policies`, grants and migration-history records before drafting a forward rollback.


## Scheduled cleanup guard behavior — verified from migration source

The scheduled `research-data-retention` job passes `cleanup_research_data(72,168,false)`; the third argument means **not a dry run**. That is potentially destructive by itself, so the safety conclusion depends on the function's live body and control row, not on the cron name.

The latest inspected migration body checks `research_archive_control.allow_archive` before invoking the archive function or reaching any source DELETE. When `allow_archive=false`, it returns early with reason `archive paused pending storage and evidence-value review`. The current control row is reported as `allow_archive=false` and `allow_source_delete=false`, and the live retention preflight is incomplete (29,790 missing evidence). Under that observed state, the function should return before the DELETE statements.

This is a source-code/control-state safety finding, not a claim that no prior deletion has ever occurred or a substitute for checking the live deployed function definition. Before any future maintenance, verify the deployed function body and control row again. No cleanup function was invoked by this audit, and no rows were deleted.


## Live database confirmation — read-only SQL, 2026-10-20

A read-only query against the canonical project `yckewtpfttvwiptmmrfq` re-checked the current control row, policies and deployed function definition (using `pg_get_functiondef`); the cleanup function was **not invoked**.

- Live control row `id=1`: `allow_archive=false`, `allow_source_delete=false`, note says archive and source deletion are paused pending storage/evidence-value review.
- Live `pg_policies`: all three archive tables have SELECT policies to `anon` and `authenticated` with predicate `true`.
- Live `cleanup_research_data(integer,integer,boolean)` reads the control row when `p_dry_run=false` and returns early if `allow_archive=false`, before its first DELETE. It only reaches the DELETE block after archive is enabled, the archive function returns, and `allow_source_delete=true`.
- The scheduled job passes `false` for `p_dry_run`, so it is a real cleanup invocation path guarded by those control flags. The observed flags currently prevent that path from reaching source DELETE statements.

This verifies the present guard state, not historical absence of deletion. Keep both flags false. The public-read policies remain a separate security issue; do not change them as part of rollback without an access-model review and a separate reviewed fix.
