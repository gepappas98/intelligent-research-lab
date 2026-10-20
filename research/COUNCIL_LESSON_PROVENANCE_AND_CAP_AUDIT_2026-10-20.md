# Council Lesson Provenance and Per-Symbol Cap Audit

**Observed:** 2026-10-20 UTC, canonical Supabase `yckewtpfttvwiptmmrfq`.
**Mode:** read-only production queries. No lessons or trades were deleted, rewritten, or remapped.

## Findings

- `public.council_lessons`: **259 rows**, **55 distinct symbols**.
- `source_trade_id` is populated on all 259 rows and distinct across all 259 rows; no duplicate source-trade IDs were observed.
- A left join to the current `public.trades` table found **29 lesson rows whose source trade is no longer present**. All 29 still contain `entry_context` and `realized_pnl`; this is valuable historical evidence, not disposable orphan data. Keep the lessons intact and label the missing trade link as unresolved until historical provenance can be reconstructed.
- **10 symbols exceed the desired five-lessons-per-symbol active retrieval cap**, with **112 lessons beyond that cap** in aggregate. Maximum observed: GTC 45, OSMO 31, AMP 28, TIA 15, RSR 10, UNI 9; ARB 6, TAO 6, WLD 6, ZEC 6.
- In the symbols over cap, each lesson has a distinct `source_trade_id`; this is not simply duplicate rows that can be safely dropped.
- The 29 missing trade references cluster in older lessons dated 2026-10-12 through 2026-10-14 (notably UNI, ARB, INJ, ADA, XRP, TIA, ZEC). This is consistent with a historical source-retention/reset boundary, but does not prove why the source trades disappeared.

## Retention and retrieval decision

1. Preserve all 259 lesson records and their original `entry_context`, `outcome`, `realized_pnl`, `pnl_pct`, `lesson`, `created_at`, and source ID.
2. Apply the five-per-symbol limit to **active prompt/retrieval selection**, not by deleting or overwriting older lessons. Choose the five using an explicit policy (e.g. relevance, evidence completeness, recency and outcome diversity), and retain an audit reference to excluded-but-preserved lessons.
3. Import all lessons into the Intelligent Research Lab with stable source IDs, captured timestamps, original trade IDs, outcome/PnL fields, and a provenance state such as `linked` or `source_trade_missing`. Do not relabel a missing source trade as a confirmed orphan without checking archived backups/history.
4. Reconstruct source trade links only from exact stable IDs and independently verified historical evidence. Never match by symbol/time/PnL alone and never invent a replacement trade ID.
5. Add a read-only regression check: total lesson count, unique source-trade IDs, missing source-trade references, and maximum active retrieved lessons per symbol. The active retrieval output must not exceed five per symbol while the archive retains all source records.

## Related Intelligent Research Lab state at this observation

- `research_evidence`: 3,019 rows, only `strategy_variant_signals` (2,801), `trades` (199), and `composite_signals` (19) were present as evidence source categories.
- `research_cases`: 3,000 rows; 2,250 V2 signal cases, 551 V3 signal cases, and 199 trade cases.
- `research_findings`: 0 rows. Evidence and cases exist, but no persisted evidence-backed findings were recorded at this point.
- Raw price/flow/sentiment/news/whale/event-flow source tables were not represented in the inspected `research_evidence` grouping. The separate archive readiness RPC remains incomplete; its archive/delete flags remain false.

## Caveats

These are a point-in-time production snapshot. Counts can change while collectors and the trading research pipeline run. Missing current `trades` rows do not prove permanent loss if other backups or historical exports exist. No retention gate, cron schedule, active scoring path, or production database content was changed by this audit.
