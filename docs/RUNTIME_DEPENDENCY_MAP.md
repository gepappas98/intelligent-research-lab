# Runtime dependency map — production snapshot (2026-10-22)

Canonical source project: `yckewtpfttvwiptmmrfq`. This inventory is read-only and does not certify that every function succeeded during the same run.

| Active Edge Function | Version | Deterministic inputs / upstreams | LLM dependency observed |
|---|---:|---|---|
| `trading-pipeline-orchestrator` | 23 | Coordinates ingestion, scoring, paper entries and outcome resolution; stores compact run diagnostics | No direct LLM call in this function |
| `whale-watch` | 12 | Hyperliquid Info, Binance public Spot/exchange metadata, RevolutX public pair metadata | None identified |
| `tradingview-signals` | 10 | Binance public market data; Bybit fallback | None identified |
| `council-sync` | 14 | Lovable `/api/public/ai-council-batch` bridge | Provider/quota must be inspected in Lovable |
| `strategy-auto-switch` | 11 | Variant performance/settings; Groq Chat Completions | Uses `GROQ_API_KEY` and `GROQ_MODEL`; quota-sensitive |
| `signal-combiner` | 42 | Whale, technical, Council, Binance exchange metadata and Alternative.me Fear & Greed | No direct LLM call identified |
| `early-entry-regime` | 16 | Deterministic regime/technical calculations; Binance public candles | None identified |
| `variant-resolver` | 8 | Stored entry/outcome data and market candles | None identified |
| `trade-executor` | 25 | Paper-trade state/fees/exits; JWT verification enabled | None identified |
| `council-lessons` | 1 | At most five closed paper BUY trades per invocation; sends original context/outcome to Lovable bridge | Provider/quota must be inspected in Lovable |
| `event-flow-lab` | 21 | RSS feeds: CoinDesk, Cointelegraph, The Block, CryptoSlate, Decrypt, Bitcoin Magazine, U.Today, Bitcoin.com, The Defiant | No direct LLM call identified |
| `event-flow-paper-open` | 4 | Event/flow gate and paper decisions | No direct LLM call identified |
| `cmc-macro-sync` | 1 | CMC market-cap, dominance and macro context | No LLM call identified; verify CMC access/quotas |
| `cmc-listings-sync` | 3 | CMC listing/discovery data | No LLM call identified; verify CMC access/quotas |
| `cmc-paper-open` | 10 | Paper entry gate; Binance and RevolutX tradability checks | None identified |

## Architecture decisions for the Intelligent Research Observatory

1. **Keep deterministic logic as the default.** Market-data ingestion, MTF checks, evidence validation, risk checks, deduplication, trade statistics and archive integrity do not need LLM tokens.
2. **Keep LLM work batched and optional.** The directly observed token-sensitive production path is `strategy-auto-switch` → Groq. Council sync and lessons call a Lovable bridge; its model/provider, free-tier quota and fallback behavior are not proven by the Edge Function source alone.
3. **No paid fallback.** Provider quota exhaustion must degrade to deterministic behavior and be logged, not silently switch to a paid provider.
4. **Post-mortems are outcome-triggered.** The deployed `council-lessons` function caps candidates at five closed paper BUY trades per invocation. Keep this non-blocking for ingestion and paper execution.
5. **Preserve all Council lessons.** Current snapshot: 313 lessons across 66 symbols; all have a source trade ID and realized PnL. A limit of five lessons per symbol should apply only to a curated, deduplicated view, never destructive deletion.
6. **Preserve provenance.** Every archive record should retain source project/table/ID, content hash, source event/availability/capture timestamps, transfer timestamp, snapshot kind and schema version.
7. **Keep populations separate.** Actual paper trades, V3 variant rows, legacy/V2 rows, shadow decisions and AI lessons are distinct datasets. Shadow decisions never count as trades or PnL.
8. **No look-ahead.** CMC forward returns remain labels only; Event→Flow and accumulation shadow remain research-only unless explicitly promoted.
9. **Avoid raw diagnostic duplication in dashboards.** `strategy_shadow_diagnostics` has 161,413 rows (~133 MiB). Profile and archive it with bounded immutable batches; use compact versioned rollups for Observatory queries.

## Current outcome snapshot

Closed trade metrics from `trades.net_pnl`, grouped by `entry_source`. Drawdown is raw cumulative USD PnL against a zero baseline, not equity-normalized drawdown.

| Entry source | Closed | Wins | Losses | Win rate | Net PnL | Avg win | Avg loss | Max PnL drawdown |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| CMC Paper | 217 | 87 | 130 | 40.09% | -$137.82 | +$41.08 | -$28.55 | -$851.32 |
| Early Entry Regime | 24 | 9 | 15 | 37.50% | +$225.16 | +$55.46 | -$18.26 | -$143.69 |
| Event Flow Paper | 39 | 16 | 23 | 41.03% | -$162.51 | +$30.51 | -$28.29 | -$382.39 |
| Standard | 72 | 29 | 43 | 40.28% | -$122.33 | +$29.52 | -$22.75 | -$670.74 |

Treat these as descriptive paper-ledger results, not an out-of-sample edge claim. Normalize by exposure, equity and time before ranking strategies.

## Transfer and recovery gates

- The last verified append-only archive snapshot had 8,592 cases, 8,628 evidence rows and 3,490 Early Entry decisions with zero missing/extra IDs and zero full-row SHA-256 mismatches **at that snapshot**. The next read-only counts were 8,609 / 8,645 / 3,496; reconcile the subsequent delta before claiming current parity.
- PR #140 was merged, but no `code-backup-latest` or `code-snapshot-manifest-*` exists in the archive yet. The full code backup remains unverified. The connected GitHub tools cannot inspect GitHub environment secret presence or dispatch the workflow. A maintainer must verify `ARCHIVE_SUPABASE_URL` and `ARCHIVE_SUPABASE_SERVICE_ROLE_KEY` in the `research-lab-archive` environment, run the workflow and confirm the summary reports `all_tracked_files_included: true`.
- PR #8 remains open with no submitted reviews. Its migration has not been applied. It restricts archive table privileges to `SELECT`, `INSERT`, and `UPDATE` for `service_role`, without `DELETE` or `TRUNCATE`. Review and approval are required before merge/application.
- Both source flags remain `allow_archive=false` and `allow_source_delete=false`; no source cleanup is authorized.
- The two applied sentiment-cleanup migration SQL files remain unrecovered. Do not reconstruct destructive predicates from filenames alone.
