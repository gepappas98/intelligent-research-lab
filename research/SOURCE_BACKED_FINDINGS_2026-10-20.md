# Source-backed Research Findings — manual snapshot 2026-10-20

This file records **derived research findings only** from targeted, read-only aggregate queries against canonical Supabase project `yckewtpfttvwiptmmrfq`. No raw database export was performed. This is a point-in-time manual snapshot, not a scheduled refresh.

## A. Closed paper-trade outcomes by strategy

Source: `public.research_cases`, grouped by `cohort, strategy, scorer_version, pnl_unit, outcome`. Entry window shown below is the observed window in the returned rows. These are USD paper-trade rows, cohort Unknown, scorer `paper-trade`; they are distinct from the V2/V3 benchmark cohorts.

| Strategy | Closed samples | Mean net PnL / trade | Total net PnL | Assessment |
|---|---:|---:|---:|---|
| `cmc_paper/buy` | 114 | +$2.0424 | +$232.8319 | Positive observed paper sample; validate costs and exact outcome semantics before calling a robust edge |
| `early_entry_regime/buy` | 6 | −$8.5568 | −$51.3407 | Negative early sample; too small to make a stable strategy-level conclusion |
| `event_flow_paper/buy` | 16 | −$6.4924 | −$103.8778 | Negative observed sample; investigate gates and entry timing before expanding |
| `standard/buy` | 28 | −$21.0035 | −$588.0989 | Materially negative observed sample; requires root-cause analysis |

Observed entry windows:
- CMC paper: 2026-10-16 12:40 UTC to 2026-10-19 20:20 UTC.
- Early Entry: 2026-10-16 23:00 UTC to 2026-10-19 15:10 UTC.
- Event Flow: 2026-10-14 17:05 UTC to 2026-10-19 12:20 UTC.
- Standard: 2026-10-15 17:40 UTC to 2026-10-19 08:40 UTC.

Caveats: these are aggregate rows as stored in `research_cases`; they are not a full reconciliation against `trades` or the wallet. The sample labels use cohort `Unknown`, so do not blend them with V2/V3 benchmark statistics. Open positions are excluded from PnL averages.

## B. V2 benchmark — realized outcomes in a short, concentrated entry window

Source: `public.research_cases`, cohort V2, scorer `v2`, PnL unit percent. These rows have entries concentrated on 2026-10-15; treat as a narrow cohort snapshot, not a broad out-of-sample test.

| Strategy | Wins | Losses | Expired | Win rate among win/loss only | Sum of recorded PnL across listed outcomes (percentage points) |
|---|---:|---:|---:|---:|---:|
| Accumulation | 25 | 55 | 0 | 31.25% | −65.0 |
| AI-driven | 16 | 66 | 47 | 19.51% | −150.4458 |
| Balanced | 7 | 49 | 25 | 12.50% | −126.6414 |
| Chart-trader | 45 | 161 | 38 | 21.84% | −329.9108 |
| Conservative | 54 | 173 | 62 | 23.79% | −327.6715 |
| SMC-reversal | 71 | 246 | 58 | 22.39% | −493.1013 |
| Volatility-timing | 73 | 248 | 57 | 22.75% | −491.3329 |
| VWAP-momentum | 73 | 249 | 58 | 22.68% | −494.1013 |
| Whale-focused | 55 | 175 | 64 | 23.91% | −329.9122 |

Interpretation:
- All listed V2 strategies had more losses than wins in this narrow entry window.
- Accumulation was the strongest of these on win rate, but still lost under the fixed +4% TP / −3% SL setup in this slice (25 × +4 and 55 × −3 = −65 percentage points before any expired cases).
- Expired cases carried negative recorded mark/settlement PnL in several strategies; they must not be treated as wins or silently discarded.
- These outcomes are mechanically clustered around a short time period and may not be independent samples; don't overstate statistical significance.

## C. Council lessons — historical realized outcomes

Source: `public.council_lessons`, grouped by stored outcome:
- 76 wins: average realized PnL +$40.1182; sum +$3,048.9860.
- 150 losses: average realized PnL −$28.2733; sum −$4,240.9961.
- Combined across these 226 lessons, recorded net is −$1,192.0101, with 33.63% wins by row count.

Interpretation: the lesson table's recorded wins do not offset its recorded losses in this snapshot. Use it as evidence for refining council reasoning and risk controls, not as a claim that the council is profitable. Validate for duplicated/related trades before treating row count as independent observations.

## D. Early Entry decision gate activity

Source: `public.early_entry_variant_decisions`:
- `NO_ENTRY`: 2,467 decisions.
- `PAPER_OPEN`: 19 decisions.

This is evidence that the gate predominantly rejects candidates in the captured interval. It does not establish whether rejection is correct, nor does the decision table alone establish outcomes of opened trades. Next experiment: attach every decision to later trade resolution and compute candidate → accepted → opened → resolved conversion, win/loss, expectancy, maximum adverse/favorable excursion, and counterfactual outcome for rejected candidates. Verify that all variants use the intended market-regime payload.

## E. Repeated-BUY research ledger — mostly unresolved

Source: `public.repeated_buy_research_ledger`:
- 2,652 ledger rows.
- 2,622 rows have null `net_pnl` (unresolved or missing; do not count as wins or losses).
- 26 rows have negative `net_pnl`, mean −$26.0645, total −$677.6783.
- 4 rows have positive `net_pnl`, mean +$31.8199, total +$127.2796.
- Across the 30 rows with non-null net PnL, recorded total is −$550.3987.

Interpretation: the currently resolved subset is negative, but only 30/2,652 rows have a non-null net PnL. This is a severe maturity/missingness limitation; do not use it as a final verdict on repeated BUY behavior. Compare normal position vs limited-position counterfactual using aligned 15m/1h/4h/24h/72h markouts and only matured pairs.

## F. Research findings table is empty

Source: `public.research_findings`: 0 rows at query time. Therefore, prior work has produced useful case/evidence/lesson records, but this dedicated findings table is not currently populated. The IRL repository ledger should preserve the conclusions now, and future manual runs should add a compact finding with source IDs, cohort, scorer version, window, sample size, outcome definition, limitations, counterevidence and a falsification test.

## G. Manual snapshot boundaries and next actions

- Read-only aggregate queries were used; no source rows were modified.
- This file is a derived summary, not a dump of raw records and not a complete history of every prior experiment.
- PnL units are kept distinct: USD paper PnL vs percent benchmark PnL.
- Unknown cohort, unresolved trades, short windows, possible correlated entries and wallet/dashboard inconsistencies remain explicit limitations.
- Next: inspect existing evidence/finding semantics and matching-run provenance; retrieve and reconcile original benchmark metadata; append only findings whose source cohort and evaluation window can be identified.
- No scheduled update was created. The user decides when to run the next manual research snapshot.
