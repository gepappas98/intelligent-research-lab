# Supabase Project Identity Map

**Verified:** 2026-10-10  
**Scope:** Trading Command Center source repository, Lovable project, Vercel production deployment, connected Supabase projects and Lovable's attached database tool.  
**Method:** Read-only inspection. No production data, schemas, execution logic or deployment settings were changed.

## Executive finding

The canonical Supabase project used by the Trading Command Center browser client and its active Edge Functions is:

`yckewtpfttvwiptmmrfq`  
URL: `https://yckewtpfttvwiptmmrfq.supabase.co`

The latest Lovable project commit and the latest Vercel production deployment both reference commit `20d94cee54b48a13bf50843715de30d67aba64e7`. That commit's Supabase client explicitly pins the browser runtime to the canonical URL and publishable key when build-time environment variables differ.

However, the database accessed through Lovable's `query_database` tool has a materially different dataset and schema inventory. Its actual Supabase project reference could not be established through the available project-management API. Treat this as a separate/stale Lovable database context until its project ref and the configured migration connection are verified. Do not run migrations through that context.

## Verified mapping

| Surface | Observed identity | Evidence | Conclusion |
|---|---|---|---|
| Canonical Trading Command Center Supabase | `yckewtpfttvwiptmmrfq` | Supabase project list/details; `supabase/config.toml`; browser client constants; active Edge Functions; current production data counts | **Canonical runtime project** |
| GitHub source | `gepappas98/pixel-perfect-pixels`, branch `main`, commit `20d94cee54b48a13bf50843715de30d67aba64e7` | Read `src/integrations/supabase/client.ts`, `supabase/config.toml`; deployment metadata points to the same SHA | Source explicitly pins runtime to canonical project |
| Lovable app | Project ID `6d1cd604-982a-4237-98b3-1276c19ca6f7`, “Pixel Perfect Pixels”; latest commit SHA matches the Vercel production SHA above | Lovable project metadata and direct read of `src/integrations/supabase/client.ts` | Browser runtime code points to canonical project; attached database tool is a separate concern |
| Vercel production | Project `pixel-perfect-pixels`; latest production deployment commit `20d94cee54b48a13bf50843715de30d67aba64e7` | Vercel deployment metadata | Deployed source contains canonical-project guard |
| Lovable attached database tool | Database name `postgres`, PostgreSQL 17.6, 21 public tables; 3,570 `composite_signals`, 641 `pipeline_runs`, 746 `strategy_variant_signals`, 0 `trades`; latest observed signal/run timestamps 2026-10-07 | Read-only `query_database` queries and table-count comparison | Dataset is materially different from canonical Supabase. Exact project ref is **not yet verified**. |
| `gbbrmzstuhdizfvabjvz` | Found in tracked GitHub `.env` and Lovable project's `.env` | Read-only source inspection | Stale/foreign configuration value relative to canonical runtime. The connected Supabase project API denied access to this ref, so do not claim it is definitively the attached database's ref. |
| `opwkbdbpqgtgcrmqqmbq` | Supabase project named `polymarket-quant-bot-lite`; zero Edge Functions returned in inspection | Supabase project list/details and Edge Function listing | Separate project; not the Trading Command Center canonical runtime. |

## Canonical-project evidence

1. `supabase/config.toml` sets `project_id = "yckewtpfttvwiptmmrfq"`.
2. `src/integrations/supabase/client.ts` defines the canonical URL `https://yckewtpfttvwiptmmrfq.supabase.co` and checks both configured URL and publishable key against canonical values. If they do not both match, the client substitutes the canonical pair.
3. The same commit includes `src/lib/mcp-diagnostic.server.ts` with `CANONICAL_SUPABASE_PROJECT_REF = "yckewtpfttvwiptmmrfq"`.
4. The latest Vercel production deployment and latest Lovable project revision both reference commit `20d94cee54b48a13bf50843715de30d67aba64e7`.
5. The Supabase project has the expected active functions, including `trading-pipeline-orchestrator`, `trade-executor`, `event-flow-lab`, `whale-watch`, `signal-combiner`, and `variant-resolver`.
6. Current read-only inventory of canonical project: 50 public tables; `composite_signals` 30,537 rows; `pipeline_runs` 2,253 rows; `strategy_variant_signals` 15,164 rows; `trades` 344 rows. Latest observed `created_at` values for those tables were around 2026-10-10 06:00 UTC.

## Important distinction: browser runtime vs Lovable database/migration context

The browser client source is pinned to the canonical project, but the Lovable database tool returns a different dataset. The project's `drizzle.config.ts` uses `process.env.LOVABLE_DB_MIGRATION_URL` for migration operations. The configured value of that secret was not read or exposed, and the Vercel environment-variable listing was blocked by a scope authorization error.

Therefore:
- **Confirmed:** the deployed browser client source points to `yckewtpfttvwiptmmrfq`.
- **Confirmed:** the canonical Supabase project's Edge Functions and larger, current dataset are on `yckewtpfttvwiptmmrfq`.
- **Confirmed:** the Lovable database tool points to a materially different database state.
- **Not yet confirmed:** the exact Supabase project ref behind Lovable's attached database tool, and the target of `LOVABLE_DB_MIGRATION_URL`.
- **Not yet confirmed from Vercel environment metadata:** the environment variable values. The Vercel API returned HTTP 403 for the `gepappas-projects` scope. This does not block identifying the effective browser runtime because the inspected source explicitly falls back to the canonical project.

## Safety actions

1. Do not apply migrations or schema changes through the Lovable database tool until its project identity is established.
2. Do not change the canonical browser client: its current guard is the protection against silent redirection to a foreign environment.
3. Keep the stale `gbbr...` values documented as configuration drift. Do not infer that this ID is the Lovable attached database ref without direct evidence.
4. Next, verify the actual configured target of `LOVABLE_DB_MIGRATION_URL` through an authorized metadata-only path that does not expose credentials, and re-authenticate the Vercel integration to the correct `gepappas-projects` scope if environment metadata is still needed.
5. Keep the Intelligent Research Lab physically separate. Do not point IRL at either existing database or copy production data until its own isolated backend is explicitly selected.

## References

- [Canonical browser client at verified commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/20d94cee54b48a13bf50843715de30d67aba64e7/src/integrations/supabase/client.ts)
- [Supabase project config](https://github.com/gepappas98/pixel-perfect-pixels/blob/main/supabase/config.toml)
- [Vercel project](https://vercel.com/gepappas-projects/pixel-perfect-pixels)
- [Lovable project](https://lovable.dev/projects/6d1cd604-982a-4237-98b3-1276c19ca6f7)

## 4. Destination recheck — 2026-10-20

Both currently connected Supabase account views returned the same two projects:

| Project ref | Name | Current status | Decision |
|---|---|---|---|
| `yckewtpfttvwiptmmrfq` | `trading-command-center` | `ACTIVE_HEALTHY` | Source only; **not** the IRL destination |
| `opwkbdbpqgtgcrmqqmbq` | `polymarket-quant-bot-lite` | `INACTIVE` | Not approved as the IRL destination |

The previously observed `gbbrmzstuhdizfvabjvz` reference remains unresolved because the Supabase management API denied access; its ownership, status and relation to Lovable remain unverified. A tracked environment value is not sufficient proof that a project is an approved destination.

**Current decision: no isolated writable IRL database has been identified.** Do not point IRL migrations, imports, secrets or browser clients at either listed project. Before any data transfer, identify the IRL project ref from an authoritative project dashboard/owner context, confirm its URL and region, confirm it is not the TCC source or unrelated inactive project, and perform a read-only identity check. Until then, continue repository documentation and read-only analysis only.


## 5. Lovable workspace recheck — 2026-10-20 09:49 UTC

The current Lovable workspace `george's Lovable` (workspace ID `vx55H9Kw5Tn3M8npqEMm`) lists six projects. None is named or described as Intelligent Research Lab. The Pixel Perfect Pixels project is `6d1cd604-982a-4237-98b3-1276c19ca6f7`; its cloud database is enabled, but it is the existing trading application and must not be repurposed as IRL.

This independently supports the current blocker: there is no identifiable IRL Lovable project in the accessible workspace, and the connected Supabase project listings likewise expose no approved IRL destination. The old `gbbrmzstuhdizfvabjvz` reference still cannot be inspected by the current Supabase account connections. Do not enable or migrate any database for the existing Pixel Perfect Pixels project as a substitute for IRL.

A separate disposable restore-test branch was priced by Supabase at **US$0.01344/hour**. No branch was created; explicit user cost approval is required before creation. A local PostgreSQL server was not available in the execution environment, and an installation attempt timed out without provisioning it.


## Destination identity recheck — 2026-10-22 (read-only)

The earlier “destination not verified” statements above describe the 2026-10-10 audit state and are superseded for project identity by this recheck.

- Official Supabase project-management API returns project ref **`ragdznxfozdpxetwisrd`**, name **`intelligent-research-lab`**, region **`eu-west-3`**, database host `db.ragdznxfozdpxetwisrd.supabase.co`, status `ACTIVE_HEALTHY`, created 2026-10-21 09:50:16 UTC.
- Canonical source remains **`yckewtpfttvwiptmmrfq`**, name `trading-command-center`, region `eu-west-2`, status `ACTIVE_HEALTHY`. The candidate target is a different project ref.
- `opwkbdbpqgtgcrmqqmbq` is still the unrelated `polymarket-quant-bot-lite` project and is `INACTIVE`.
- Read-only target inventory: one public table, `research_archive_documents`; 194 rows; table size about 4.52 MiB; whole database about 15 MiB. Supabase migration history currently lists only `20261021113716_create_private_research_archive_bucket`; the document-table schema was not represented in the repository migration history at the time of this check.
- The archive table has RLS enabled and no policies, which currently fails closed for API roles, but table-level privileges are still granted to `anon` and `authenticated`. A reviewed, idempotent migration has been added on branch `ops/verified-irl-destination-and-archive-lockdown-2026-10-22` to track the schema and revoke those grants; it has **not** been applied to the database.
- Destination identity is verified; that does **not** mean transfer readiness or completeness is verified. The existing archive batches contain 7,276 distinct `research_cases`, 7,311 distinct `research_evidence`, and 3,073 `early_entry_variant_decisions`. Current source counts are 8,548, 8,584, and 3,472 respectively. These are net row-count gaps of at least 1,272, 1,273, and 399 records; exact missing IDs still require reconciliation. The archive batches are JSON documents, not a normalized full-table import.

## Production retention and storage recheck — 2026-10-22 (read-only)

- Source database size at 2026-10-22 20:05:57 UTC: **724,896,915 bytes (~691 MiB)**. The 2026-10-20 runbook snapshot was 526,126,227 bytes (~502 MiB). The two observations differ by about 199 MB over roughly 56.5 hours; this is a two-point comparison, not a forecast.
- Largest current relations by total size: `strategy_shadow_diagnostics` ~132 MB; `composite_signals` ~112 MB (including ~87 MB TOAST); `strategy_variant_signals` ~47 MB; `whale_alerts` ~46 MB; `market_candles` ~45 MB; `pipeline_runs` ~38 MB (including ~38 MB TOAST); `accumulation_shadow_observations` ~37 MB.
- `research_archive_control` currently has `allow_archive=false` and `allow_source_delete=false`. The scheduled `research-data-retention` job is active at 03:17 UTC daily and has succeeded, but the live function definition returns before archive writes or deletes when `allow_archive=false`. Success status therefore means the job ran, not that archival or cleanup occurred.
- Current rows older than the configured 72-hour raw cutoff: price 31,980/57,866; flow 31,980/57,870; sentiment 26,030/44,551; news 908/1,785. Older than the 168-hour derived cutoff: event-flow transmissions 28/71; whale-flow shock follow-ups 1,740/5,965; transition context 1,751/6,002; transitions 1,751/6,002; whale-flow snapshots 4,620/14,131.
- No production rows were changed during this check. Keep both controls disabled until the archive is complete, the retention-source mapping is validated, and the evidence-value/storage decision is explicitly reviewed.


### Historical retention evidence — 2026-10-22 read-only review

- Production migration history lists the destructive original cleanup implementation as applied, and the live cron history shows one successful `research-data-retention` run daily from 2026-10-09 through 2026-10-20. The guard/capture-gate migrations were recorded on 2026-10-19 around 22:25–22:34 UTC, after that day's 03:17 UTC run.
- The original migration `20261008050000_research_data_retention_cleanup.sql` deletes raw rows older than 72 hours and derived rows older than 168 hours when called with `p_dry_run=false`. The scheduled command used exactly `cleanup_research_data(72, 168, false)`.
- Current minimum timestamps align with the last pre-gate cleanup boundary for several tables: price, flow and sentiment snapshots begin at 2026-10-16 03:20 UTC (about three minutes after the 2026-10-19 03:17 UTC run's 72-hour cutoff); whale-flow shock follow-ups begin at 2026-10-12 03:18 UTC (about one minute after its 168-hour cutoff). This is strong evidence consistent with retention deletion, but without a pre-cleanup snapshot it cannot quantify every deleted row.
- The current `allow_archive=false` and `allow_source_delete=false` gates prevent future archive writes/deletes through the current function. They do not restore any rows removed by earlier cleanup runs.
- The live migration history also lists applied sentiment-cleanup migrations `20261008100734` (`20261008123000_clean_invalid_sentiment_research_data`) and `20261008101017` (`20261008123001_remove_zero_sentiment_rows`), but corresponding SQL files were not found in the current `main` tree or eight examined relevant branches' `supabase/migrations` directories. Exact historical predicates and deleted-row counts therefore remain unverified; recover the migration SQL from Git history/other branches or trusted backup artifacts before asserting historical completeness.


## Exact source/archive reconciliation — SHA-256, 2026-10-22

A fresh read-only pass compared the full source ID sets with IDs extracted from all archived JSON batches. Hashes use PostgreSQL `pgcrypto.digest(..., 'sha256')`; archive batches were checked for duplicate IDs and unexpected IDs.

| Dataset | Current source rows | Archived distinct IDs | Missing source IDs | Unexpected archive IDs | Full-row SHA-256 mismatches among overlapping IDs |
|---|---:|---:|---:|---:|---:|
| `research_cases` | 8,585 | 7,276 | 1,309 | 0 | 2,859 |
| `research_evidence` | 8,621 | 7,311 | 1,310 | 0 | 0 |
| `early_entry_variant_decisions` | 3,487 | 3,073 | 414 | 0 | 0 |

No duplicate IDs were found within the archived batches for these datasets. The live counts differ from earlier snapshots because source data continues to change; use the count/hash snapshot from this pass as the current reconciliation baseline.

### What the row hashes prove

- `research_evidence`: all 7,311 overlapping rows match the full-row SHA-256.
- `early_entry_variant_decisions`: all 3,073 overlapping rows match the full-row SHA-256.
- `research_cases`: all 7,276 archived IDs exist in the source, but 2,859 full-row hashes differ. A field-by-field comparison found that every difference is confined to mutable outcome/lifecycle fields: `net_pnl`, `outcome`, `updated_at`, `maturity_at`, `resolved_at`, and `close_reason`. The immutable identity/strategy/context projection matched for all 7,276 overlapping cases. This is stale outcome state in the archive, not evidence of mismatched source identity.

Therefore the archive is not ready to serve as the Observatory's canonical outcomes store. The next bounded idempotent refresh should upsert the 1,309 missing cases, 1,310 missing evidence records and 414 missing Early Entry decisions, then refresh the 2,859 stale case outcome rows. Re-run the same SHA-256 reconciliation afterward and require zero missing IDs, zero extra IDs, zero duplicates, and zero hash mismatches before marking these datasets complete. Do not enable source deletion.

### Historical sentiment-cleanup SQL recovery

The two migration records exist in the production migration history, but their SQL files were not found in the current `main` tree, eight examined relevant branches, GitHub file/commit searches, or the existing archive's repository-file path index. Their exact DELETE predicates cannot be safely reconstructed from migration names alone. Keep this as an unresolved forensic item; do not recreate guessed SQL or claim exact historical deletion scope without a trusted commit, backup, or audit log.
