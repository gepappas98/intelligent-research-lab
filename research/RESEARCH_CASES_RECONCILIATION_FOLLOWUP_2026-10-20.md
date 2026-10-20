# Research Cases Reconciliation Follow-up — 2026-10-20

**Canonical source:** Supabase project `yckewtpfttvwiptmmrfq`.
**Method:** read-only SQL reconciliation at the latest check time. This is a newer snapshot than the earlier 68-case gap observation; do not combine the two snapshots as if they were simultaneous.

## Current coverage

- `public.trades`: **269** rows.
- `public.research_cases` rows sourced from `trades`: **199**.
- Current trades without a research case: **70** — **46 closed**, **24 open**.
- All existing research-case `evidence_ids` resolve to a row in `research_evidence`: **0 dangling evidence links**.
- `research_evidence`: **3,019** rows — 2,801 `strategy_variant_signals`, 199 `trades`, 19 `composite_signals`. There are no evidence rows for raw price, flow, sentiment, news, whale-flow, CMC, or Event→Flow source tables in this snapshot.

## Cohort state

| Cohort | Source | Rows | Open/unresolved | Resolved timestamp | Evidence IDs empty |
|---|---|---:|---:|---:|---:|
| V2 | `strategy_variant_signals` | 2,250 | 0 | 2,250 | 0 |
| V3 | `strategy_variant_signals` | 551 | 551 | 0 | 0 |
| Unknown | `trades` | 199 | 35 | 164 | 0 |

V2 is a retired historical cohort, not active scoring evidence. V3 remains entirely unresolved in this sample and must not be treated as evaluated performance. Trade cases use `Unknown` cohort, so the current case schema does not yet distinguish all strategy-specific trade outcomes as cleanly as the variant cohorts.

## Implications

1. The case synchronizer is behind the source table. Earlier at 17:40 UTC the gap was 68; the current reconciliation is 70 (46 closed, 24 open), so any sync work must use idempotent source IDs and re-read current counts after completion.
2. Do not backfill by blind JSON copying or rewrite historical outcomes. Use the existing refresh RPC only through a reviewed, bounded, non-blocking orchestrator stage; verify that its source filters and cohort mapping preserve original timestamps and values.
3. Zero dangling evidence IDs is a positive referential-integrity result, but does **not** mean source evidence coverage is complete. Only three source tables are represented.
4. Before enabling archival or deleting raw rows, capture complete source snapshots for price/flow/sentiment/news/whale/CMC/Event→Flow, record exact provenance and timestamps, and test restore/reconciliation.
5. Keep `research_archive_control.allow_archive=false` and `allow_source_delete=false`. No deletion, database reset, strategy change, or production write was performed in this follow-up.

## Next verification batch

- Review draft PR #134 for the research-only case-sync stage; it is not deployed.
- Reconcile source/case IDs after deployment and confirm the 70-row gap closes without duplicate cases.
- Validate point-in-time bounds for every linked evidence row: `observed_at <= available_at <= entry_at`, plus source-specific capture-time rules.
- Build a separate, versioned evidence-ingestion layer for raw source observations; do not label aggregate findings as validated until cohort, maturity, dependence and cost treatment are explicit.
