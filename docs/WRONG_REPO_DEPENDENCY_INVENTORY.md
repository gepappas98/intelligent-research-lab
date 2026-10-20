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
