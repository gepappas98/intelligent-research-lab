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


## Post-transfer verification — 2026-10-22 (supersedes the earlier pre-transfer gap counts)

A bounded, append-only reconciliation was completed against the verified archive project `ragdznxfozdpxetwisrd`. It copied only missing source rows and appended newer versions for changed `research_cases` outcome states. The canonical source `yckewtpfttvwiptmmrfq` was not modified; no source deletes, schema changes, or retention-flag changes occurred.

| Dataset | Source rows at final verification | Latest archive distinct IDs | Missing IDs | Extra IDs | Full-row SHA-256 mismatches |
|---|---:|---:|---:|---:|---:|
| `research_cases` | 8,592 | 8,592 | 0 | 0 | 0 |
| `research_evidence` | 8,628 | 8,628 | 0 | 0 | 0 |
| `early_entry_variant_decisions` | 3,490 | 3,490 | 0 | 0 | 0 |

The final verification compared full-row SHA-256 hashes using PostgreSQL `pgcrypto.digest`. For `research_cases`, earlier archived versions are retained; consumers must select the latest version per `id` by `updated_at` (then archive `generated_at` as a tie-breaker) before treating the archive as the current-state mirror. The new append-only batches carry per-row SHA-256 hashes in `payload.record_hashes`.

The archive now contains 436 documents and occupies about 17 MB. The three reconciled datasets are complete **as of this verification snapshot**; new source writes can create future deltas, so rerun reconciliation before any source retention or deletion is enabled.

This is not a full production transfer and does not prove the full repository code backup succeeded. PR [#140](https://github.com/gepappas98/pixel-perfect-pixels/pull/140) is merged at `4ae407ec2528456dc7baf210394643002a7cea1d`, but the archive still contains no `code-backup-latest` pointer or `code-snapshot-manifest-*` document. The full-repository backup is therefore **not yet verified**. The available GitHub connection cannot list GitHub Actions secret names or dispatch/inspect the push-triggered workflow run; confirm the two secrets in the `research-lab-archive` environment and run [the backup workflow](https://github.com/gepappas98/pixel-perfect-pixels/actions/workflows/research-lab-code-backup.yml). Accept success only when the run summary explicitly reports `all_tracked_files_included: true`.

The archive table privilege-hardening migration remains in open PR #8 and has not been applied. Keep `allow_archive=false` and `allow_source_delete=false`; no source cleanup is authorized by this reconciliation.


## Batch research inventory — live snapshot 2026-10-22 21:25 UTC

Read-only counts from the canonical production Supabase. These are current observations, not immutable baselines; new rows appeared after the append-only archive verification at approximately 21:02 UTC.

### Current core datasets

| Dataset | Current rows | First/latest observed timestamp where available | Archive state |
|---|---:|---|---|
| `research_cases` | 8,609 | Derived outcome cases | Last verified archive: 8,592; current delta +17 |
| `research_evidence` | 8,645 | Evidence rows | Last verified archive: 8,628; current delta +17 |
| `early_entry_variant_decisions` | 3,496 | Decision rows | Last verified archive: 3,490; current delta +6 |
| `strategy_variant_signals` | 71,739 | 2026-10-14 through 2026-10-22 21:20 UTC | Not included in the three-table reconciliation |
| `strategy_shadow_diagnostics` | 161,413 | High-volume diagnostic history | Not yet reconciled/transferred |
| `council_signals` | 6,233 | Council source/sync timestamps | Not yet reconciled/transferred |
| `council_lessons` | 313 | 2026-10-12 through 2026-10-21 21:10 UTC | Not yet reconciled/transferred |
| `cmc_listing_snapshots` | 28,200 | 2026-10-15 through 2026-10-22 20:20 UTC; 1,037 symbols | Not yet reconciled/transferred |
| `cmc_macro_snapshots` | 334 | 2026-10-15 through 2026-10-22 21:20 UTC | Not yet reconciled/transferred |
| `event_flow_transmissions` | 72 | 2026-10-12 through 2026-10-22 20:30 UTC; 12 assets | Not yet reconciled/transferred |
| `event_flow_paper_decisions` | 42 | 2026-10-14 through 2026-10-22 21:25 UTC | Not yet reconciled/transferred |
| `trades` | 365 | Paper-trade outcomes and open positions | Not yet reconciled/transferred |

### Trade outcome snapshot

| Entry source | Total | Closed | Open | Closed `net_pnl` sum |
|---|---:|---:|---:|---:|
| CMC Paper | 222 | 217 | 5 | -$137.82 |
| Early Entry Regime | 26 | 24 | 2 | +$225.16 |
| Event Flow Paper | 44 | 39 | 5 | -$162.51 |
| Standard | 73 | 72 | 1 | -$122.33 |
| **Total** | **365** | **352** | **13** | **-$197.50** |

These sums are from the current `trades.net_pnl` field filtered to closed trades. Preserve gross PnL, fees, net PnL, close reason, entry metadata, and the open/closed status as separate facts in the Observatory; never infer realized PnL from open positions.

### Strategy variant population

- V2: 65,735 raw rows; all resolved; mean stored `pnl_pct` -0.7018%.
- V3: 6,004 raw rows; 4,880 resolved and 1,124 unresolved; mean stored `pnl_pct` +0.5748% among resolved rows.
- These are raw variant rows and are **not** unique symbol-cycle samples. Do not compare V2 to V3 as if they were deduplicated independent observations. V2 is historical/reference only; V3 must be deduplicated and aligned to the live MTF scoring contract before inference.

### Council learning quality

- `council_lessons`: 313 lessons across 66 symbols.
- All 313 have a `source_trade_id` and non-null `realized_pnl`; no lesson is shorter than 20 characters.
- Lesson counts are concentrated in GTC (45), OSMO (31), and AMP (31), which is a coverage/skew signal, not evidence that those symbols have the most predictive lessons.
- Observatory should retain up to five **distinct, evidence-linked** lessons per symbol, with source trade, entry context, verdict/conviction, realized outcome and created timestamp. Keep rejected, contradicted and superseded lessons in the audit trail; do not let duplicate wording consume the five slots.

### Event→Flow and CMC data quality

- `cmc_listing_snapshots`: 28,200 rows / 1,037 symbols, no missing `price_usd` in this snapshot. `cmc_macro_snapshots`: 334 rows. CMC remains discovery/context and a label source, never a standalone BUY voter.
- `event_flow_transmissions`: 72 rows / 12 assets; 27 rows have `data_quality` outside the accepted labels `ok`, `good`, or `complete`. Review actual label values before treating that count as unusable records.
- `event_flow_paper_decisions`: 42 rows, 14 missing `sentiment_score`. Preserve them as incomplete decisions rather than dropping them; investigate source freshness and gate eligibility.

### Immediate incremental work

1. Reconcile the +17 cases, +17 evidence rows and +6 Early Entry decisions that appeared after the last verified archive snapshot. Re-run latest-state SHA-256 checks after append-only sync; keep source deletion disabled.
2. Inspect the full repository backup workflow status. The archive still has no `code-backup-latest` pointer or `code-snapshot-manifest-*` document, so the full code backup is **not verified**. The connector cannot inspect GitHub environment secrets or dispatch a workflow; a maintainer must confirm the two archive-only secrets and run the workflow from GitHub Actions.
3. Expand the transfer manifest to the unverified tables above, starting with `trades`, `council_lessons`, `council_signals`, V3 variant signals, Early Entry regime observations, CMC macro/listing snapshots, and Event→Flow decisions/transmissions. Record exact source table, source ID, content hash, source timestamps and transfer snapshot time.
4. Profile `strategy_shadow_diagnostics` (161,413 rows / ~133 MiB) before copying every raw row. Preserve raw data in a bounded archive if needed, but derive compact, versioned rollups for the Observatory instead of duplicating large JSON payloads into dashboard queries.

### Review state

PR [#8](https://github.com/gepappas98/intelligent-research-lab/pull/8) remains open and has no submitted reviews. The migration is not applied. Its least-privilege intent is to revoke all table privileges from `public`, `anon`, `authenticated`, and `service_role`, then grant only `SELECT`, `INSERT`, and `UPDATE` to `service_role` for the idempotent uploader; it deliberately grants no `DELETE` or `TRUNCATE`. Review/approval is still required before merging or applying it to the verified IRL project.
