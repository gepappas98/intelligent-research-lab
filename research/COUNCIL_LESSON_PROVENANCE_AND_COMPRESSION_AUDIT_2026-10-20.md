# Council Lesson Provenance and Compression Audit — 2026-10-20

**Source:** canonical production Supabase `yckewtpfttvwiptmmrfq`, read-only checks.

## Findings

- `public.council_lessons` contains **262 lessons across 55 symbols**.
- **11 symbols exceed the intended five-lesson working-memory budget**; maximum is 45 for GTC, followed by OSMO 31, AMP 29, TIA 15, RSR 10, UNI 9, then ARB/COMP/TAO/WLD/ZEC at six each.
- 12 exact normalized lesson-text groups contain duplicates. This count is duplicate groups, not total duplicate rows.
- No lesson text is blank. All 262 lessons have a non-null `source_trade_id`, but **29 references do not resolve to a row in the current `trades` table**. These orphan references are concentrated in older lessons from 12–14 October: UNI 7, ARB 4, INJ 4, ADA 3, XRP 3, ZEC 2, TIA 2, plus one each for PENGU, SUI, SEI and TAO (the grouped output sums to 29).
- The missing links do not prove the trade rows were deleted; the lesson may reference a different trade identifier namespace, or source rows may have been removed before the current retention snapshot. Do not infer which without lineage logs.

## Interpretation

The 5-lessons-per-symbol target should be implemented as a **derived working-memory view**, not by deleting older `council_lessons`. Preserve the full append-only lesson history for audit/research. For each symbol, produce up to five current lessons selected by transparent criteria (source-trade linkage valid, outcome known, evidence-backed, non-duplicate, recency, and realized outcome), while keeping a pointer to all excluded lesson IDs and reasons. A single “best lesson” ranking must not use PnL alone or promote a lesson based on a small sample.

## Safe next steps

1. Reconcile all orphan `source_trade_id` values against historical trade exports, audit logs, and the original lesson-generation payload; do not rewrite the UUIDs speculatively.
2. Compute exact duplicate clusters with normalized text plus symbol, verdict, and source-trade context; do not merge records solely because text matches.
3. Implement a read-only compaction function/view and tests for deterministic selection, tie-breaking, null outcomes, and preserving historical IDs.
4. Expose `lessons_total`, `lessons_unique`, `lessons_selected_for_memory`, `orphan_source_links`, and `excluded_lesson_ids` in the knowledge-sync audit.
5. Keep full lessons and all source trade rows; no deletion, database reset, or production write was performed by this audit.

## Reconciliation

The aggregate orphan count and symbol breakdown both sum to 29 rows across 29 distinct missing trade IDs. This is a confirmed integrity gap; the cause is not established.
