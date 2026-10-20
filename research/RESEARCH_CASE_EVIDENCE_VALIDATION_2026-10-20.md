# Research Case and Evidence Integrity Validation

**Observed:** 2026-10-20 UTC, canonical Supabase project `yckewtpfttvwiptmmrfq`.
**Scope:** read-only checks of persisted `research_cases`, `research_evidence`, source IDs, and point-in-time evidence bounds.

## Positive integrity results

- `research_cases`: **3,000** rows.
- `research_evidence`: **3,019** rows.
- `research_findings`: **0** rows at observation time.
- All 3,000 cases have a non-empty source ID and entry timestamp; all 3,000 case keys `(source_table, source_id, cohort, scorer_version)` are distinct.
- All 3,000 cases have at least one `evidence_ids` reference.
- Unnesting all case evidence references produced **3,019 references**; all 3,019 match a persisted `research_evidence.id`. No dangling evidence IDs were found.
- Joined point-in-time check found **0 violations** among matched evidence for `observed_at <= available_at <= case.entry_at`.
- All 199 `trades` cases and all 2,801 `strategy_variant_signals` cases still match their source rows at this snapshot (0 missing trade source rows, 0 missing variant source rows).

## Cohort composition

| Source | Cohort | Outcome | Rows | Resolved timestamp | Maturity timestamp |
|---|---|---|---:|---:|---:|
| `strategy_variant_signals` | V2 | expired | 409 | 409 | 409 |
| `strategy_variant_signals` | V2 | loss | 1,422 | 1,422 | 1,422 |
| `strategy_variant_signals` | V2 | win | 419 | 419 | 419 |
| `strategy_variant_signals` | V3 | open | 551 | 0 | 0 |
| `trades` | Unknown / paper-trade | closed | 164 | 164 | not applicable |
| `trades` | Unknown / paper-trade | open | 35 | 0 | not applicable |

The source table has many more rows than the 2,801 persisted variant cases. Therefore these are an evidence-backed bounded/selected set, not a complete historical extraction of all `strategy_variant_signals`. Do not call them full-history strategy statistics. The 551 V3 rows are open and unevaluated; they must not be used as resolved outcomes.

## Missing research layer

The current evidence-to-case linkage is internally sound for this snapshot, but there are no persisted `research_findings`. The evidence layer only contains three source categories: `strategy_variant_signals` (2,801), `trades` (199), and `composite_signals` (19). Raw price/flow/sentiment/news/whale/Event→Flow observations are not yet represented in `research_evidence`, so the current archive does not yet preserve all source context required for future reproducible conclusions.

## Next actions

1. Preserve these 3,000 cases and 3,019 evidence records; do not reset or truncate them.
2. Add raw-source evidence in bounded, fingerprinted batches with stable source IDs and `observed_at`, `available_at`, `captured_at` timestamps. Keep entry context separate from outcomes and enforce point-in-time bounds.
3. Extract older/missing Legacy cases from authoritative historical sources before claiming Legacy/V2/V3 completeness; maintain separate cohort/scorer labels.
4. Create findings only after sample eligibility, outcome maturity, cohort alignment, and evidence references pass reproducible validation. Persist limitations and reproduction instructions with each finding.
5. Keep archive/source-delete controls disabled until source coverage, archive completeness, and restore verification pass.

## Change status

Read-only audit and documentation only. No source data, case, evidence, outcome, archive flag, schema, or production function was changed.
