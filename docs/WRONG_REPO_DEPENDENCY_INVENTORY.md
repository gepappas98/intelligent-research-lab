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


## Current-main code-path trace — read-only, 2026-10-20

The current source main files were fetched directly, not inferred from the stale PROJECT_STATE.md narrative:

1. src/lib/pipeline.server.ts contains a server-side call to refresh_research_knowledge_cases({ p_lookback_hours: 72 }) after post-mortem generation, with an 8-second timeout and fail-open handling. The caller is an integration point that must be removed or feature-guarded before dropping the RPC.
2. src/lib/research-knowledge.functions.ts reads both source execution tables and archive tables: trades, strategy_variant_signals, council_lessons, research_evidence, research_findings, research_cases, plus linked composite_signals. The read helper reports an issue rather than treating an unavailable archive table as empty, but exact UI behavior still needs an isolated component test.
3. src/lib/research-knowledge.ts contains pure cohort, evidence-eligibility, deduplication and finding-validation helpers. Preserve and test these independently of deployed archive tables if useful to IRL.
4. src/components/trading/ResearchKnowledgePanel.tsx invokes getResearchKnowledge through useServerFn and React Query. Trace the route/component import before decoupling; do not delete the UI module blindly.
5. The archive SQL refresh materializes trade, composite-signal and variant entry evidence with source created_at in both observed_at and available_at, while using now() for captured_at. The server read path similarly maps trade and linked signal created_at into both observed and available timestamps. These are insertion/creation timestamps, not proof of feature publication, candle close or strategy knowledge time.
6. The pure helper eligibleEntryEvidence checks observed_at <= available_at <= entry_at. Because both timestamps are copied from created_at, the predicate can pass mechanically without establishing the semantic precondition. A passing predicate is not sufficient evidence that the historical feature was knowable at entry.

### Consequence and required treatment

- Mark archive-generated entry evidence with timestamp semantics unverified until upstream producer/deployment evidence proves otherwise.
- Do not use those records to claim strict point-in-time/no-look-ahead validity or validated alpha.
- Preserve original source timestamps and snapshots; do not overwrite historical cases to make the validator pass.
- Future IRL ingestion should store event_at, observed_at, available_at, ingested_at and a separate temporal-quality status, allowing available_at to remain unknown.
- Decoupling should be a separately reviewed app change with tests proving the post-mortem/trading pipeline proceeds if the research RPC is absent and the panel displays a clear schema_pending/unavailable state rather than fabricated zero counts.


## Case mutability, maturity and scorer-version findings — migration-source audit

The batch-fix migration 20261020180000_research_knowledge_sync_batch_fix.sql was inspected around the trade and variant UPSERTs:

- research_cases rows are not immutable snapshots: on conflict, the refresh function updates resolved_at, outcome, net_pnl, close_reason/regime (trade cases), and fingerprint/maturity_at/outcome/net_pnl/regime (variant cases), and unions additional evidence_ids. This may be operationally reasonable for a materialized current-state projection, but it is not an append-only historical event log. IRL must not copy this table as though every version of a case were preserved.
- For variants, maturity_at is set to resolved_at only when outcome is win, loss or expired and resolved_at is non-null. It does not independently calculate entry_at + 72 hours. Therefore maturity_at currently means “source resolver reached a terminal state at this timestamp,” not “the 72-hour benchmark horizon matured.” Keep those semantics separate.
- The SQL maps every fingerprint beginning v3| to scorer_version v3-mtf-aligned. A cohort prefix can identify a V3 fingerprint family but does not independently prove the exact scorer build/configuration for every historical row. The historical PAXG scorer change documented in RESEARCH_KNOWLEDGE_TRANSFER.md demonstrates why scorer generation needs separate provenance.
- Evidence inserts use ON CONFLICT (fingerprint) DO NOTHING, while case rows may be updated later. This means the materialized case can reflect a newer outcome while its original entry evidence remains the first inserted version. Preserve both source record/version and each observed outcome revision when designing IRL ingestion.

IRL contract decision: store immutable source-observation events and immutable entry snapshots separately from later resolution events. Derive current case state as a projection. Represent benchmark maturity as an explicit evaluator-derived field based on entry time, configured horizon, required market-data coverage and evaluator version; do not overload a resolver timestamp. Require an actual scorer build/config identifier where available; otherwise use scorer_version=Unknown with a provenance-quality flag rather than asserting v3-mtf-aligned from prefix alone.


## Integration-test scope — important limitation

The source test supabase/tests/research_knowledge_archive.integration.sql is explicitly an ephemeral PostgreSQL fixture; it does not validate production rollback or export. It tests the refresh function by asserting that a resolved V3 case has maturity_at = resolved_at, so the test codifies the current resolver-timestamp semantics rather than an independently calculated 72-hour benchmark maturity. It also tests archive fail-closed behavior when capture fails and source deletion is disabled, then deliberately enables both flags in the disposable test database to exercise the delete path.

The test does not establish that source created_at is a true feature-availability timestamp, that initial entry evidence remains immutable across source updates, that all source application callers are decoupled, or that a production export can be restored. Any replacement/rollback test suite should add separate assertions for unknown availability, outcome-event append-only behavior, evaluator-derived horizon maturity, grants/RLS, cron definitions, and application fail-open behavior when archive objects are absent.


## Application contract-test limitation

The pure unit suite src/lib/_tests_/research-knowledge.test.ts verifies ordering predicates, unknown availability rejection, cohort separation, terminal outcome checks and evidence linkage. However, it uses hand-authored Evidence objects and cannot detect that the production reader/SQL writer fabricate an availability timestamp by copying created_at. It proves the validator's logic for supplied timestamps, not the provenance of timestamps from the database. A future regression suite should test source-mapper behavior directly: if a source has no independently verified availability field, mapped available_at must remain null or carry an explicit inferred/ambiguous quality status, and strict eligibility must fail closed.

The UI currently renders query errors as “Research evidence unavailable” and lists source availability issues; missing archive-table reads may instead produce a partial snapshot with null table count and an issue. The decoupling test must verify this partial-data state is clearly labeled and cannot be mistaken for complete history or zero observations.


## Follow-up migration review — cleanup status payload consistency

A static inspection of `supabase/migrations/20261020182000_research_archive_capture_gate.sql` found duplicate JSON keys in the early-return payloads of `cleanup_research_data`:

- The archive-paused return includes `archive_only` twice (`true`, then `false`) and repeats `archive_enabled` / `delete_enabled`.
- The archive-enabled-but-delete-locked return also repeats `delete_enabled` and `archive_only` with contradictory values.

PostgreSQL builds a JSONB object from these key/value pairs; duplicate-key handling can cause the later value to override the earlier one. That makes the diagnostic payload misleading even though these branches return before the source DELETE statements. This is a **code-level observability defect**, not evidence that deletion occurred and not a reason to change the live function ad hoc.

Before any rollback or future cleanup maintenance, correct the payload in a separately reviewed migration and test exact returned JSON for both locked states in disposable PostgreSQL. Until then, rely on the actual live control row and deployed function definition—not `archive_only` in the returned JSON alone—to assess safety. No production function was invoked or changed during this inspection.
