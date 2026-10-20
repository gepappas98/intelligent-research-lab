# Trade Outcome Coverage and Research Sync Audit

**Observed:** 2026-10-20 UTC, canonical Supabase `yckewtpfttvwiptmmrfq`.
**Scope:** read-only source/case comparison, outcome aggregation, production orchestrator inspection, and repository review.

## 1. Research-case sync gap

- Current `public.trades`: **267** rows at the observed snapshot.
- `public.research_cases` trade cases: **199**.
- **68 current trades are missing a corresponding `research_cases` row**: 43 closed and 25 open. Breakdown: CMC Paper 33 closed + 4 open; Event Flow Paper 2 closed + 1 open; Standard 8 closed + 20 open. The missing rows were created from 2026-10-19 23:00 UTC through 2026-10-20 17:40 UTC.
- The 199 existing trade cases all still match current source rows. This is an enrichment lag, not evidence that the stored cases are corrupted.
- `public.refresh_research_knowledge_cases(72)` exists in production and is idempotent by source/cohort keys, but the live `trading-pipeline-orchestrator` v23 has no research-knowledge sync stage.
- In the last 24h, production had 144 pipeline runs and **0 runs with a research-knowledge stage**; 143 included `council-lessons`.

A draft code change was opened at [PR #134](https://github.com/gepappas98/pixel-perfect-pixels/pull/134). It adds a bounded, non-blocking research-only RPC stage after post-mortems. It is **not merged or deployed**. Verify its CI and review before rollout, then confirm the new stage in `pipeline_runs.result.stages` and the 68-case gap closes. Do not manually call the production write RPC as a substitute for the reviewed deployment.

## 2. Current closed paper-trade results

Snapshot at query time; counts can change while the pipeline runs. `net_pnl` is already after fees in the current exit implementation (`net_pnl = gross_pnl - total_fees`); **do not subtract `total_fees` a second time**. Production data confirms `pnl = net_pnl` for the closed rows while `gross_pnl` is stored separately.

| Entry source | Closed | Open | Realized gross USD | Fees USD | Realized net USD | Net wins | Net losses | Net win rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| CMC Paper | 151 | 4 | +625.17 | 151.31 | +473.86 | 68 | 83 | 45.03% |
| Early Entry Regime | 13 | 6 | +121.21 | 13.06 | +108.15 | 5 | 8 | 38.46% |
| Event Flow Paper | 22 | 1 | +79.15 | 22.04 | +57.11 | 11 | 11 | 50.00% |
| Standard | 45 | 25 | -415.88 | 44.79 | -460.68 | 10 | 35 | 22.22% |
| **Total** | **231** | **36** | **+409.65** | **231.20** | **+178.44** | **94** | **137** | **40.69%** |

These are realized paper-trade accounting results only; open-position unrealized PnL is excluded. The relatively high fees are material to strategy comparison. Preserve gross PnL, fees, and net PnL as separate fields in the research archive. Do not treat the `net_pnl` label as gross or subtract fees twice.

## 3. Retired V2 benchmark cohort — historical hypothesis only

The current `research_cases` snapshot contains 2,250 V2 variant cases, all terminal, entered on 2026-10-15. Aggregate per strategy:

| V2 strategy | Rows | Wins | Losses | Expired | Win rate among wins+losses | Average terminal PnL % |
|---|---:|---:|---:|---:|---:|---:|
| accumulation | 80 | 25 | 55 | 0 | 31.25% | -0.8125 |
| ai-driven | 129 | 16 | 66 | 47 | 19.51% | -1.1662 |
| balanced | 81 | 7 | 49 | 25 | 12.50% | -1.5635 |
| chart-trader | 244 | 45 | 161 | 38 | 21.84% | -1.3521 |
| conservative | 289 | 54 | 173 | 62 | 23.79% | -1.1338 |
| smc-reversal | 375 | 71 | 246 | 58 | 22.40% | -1.3149 |
| volatility-timing | 378 | 73 | 248 | 57 | 22.74% | -1.2998 |
| vwap-momentum | 380 | 73 | 249 | 58 | 22.67% | -1.3003 |
| whale-focused | 294 | 55 | 175 | 64 | 23.91% | -1.1222 |

Interpretation constraints:

- This is a historical, retired V2 cohort, not the active V3 aligned-MTF scorer. Do not use it to auto-switch live scoring or promote a new strategy.
- The cases are not IID: grouping V2 cases by `(symbol, entry_at)` yielded 505 symbol-entry events, 431 shared by multiple variants, maximum nine variants per event, average 4.46 variant rows per event. Strategy rows from the same symbol/time are correlated observations.
- Outcomes use fixed +4% win / -3% loss benchmark labels and expired outcomes. Fees/slippage and overlapping positions are not established as fully represented in these variant PnL percentages; do not equate them with portfolio net USD PnL.
- The persisted set contains no Legacy cohort. It must not be described as complete Legacy/V2/V3 history.
- The active V3 cohort has 551 cases and all are currently open with no resolved or maturity timestamp. They are not evaluated results.

This is a candidate historical hypothesis: the observed V2 variants performed poorly under this specific benchmark window. It needs a reproducible, cohort-aligned validation with dependence-aware sampling and cost/overlap limitations before becoming a persisted validated finding. `research_findings` remains empty; do not fabricate a validated finding from aggregate counts alone.

## 4. Preservation and next steps

1. Keep all existing trades, V2/V3 variant signals, cases, evidence, and lessons; no deletion or DB reset.
2. Merge/deploy the reviewed research sync stage only after CI passes. Keep it fail-open and isolated from all trading decisions.
3. Recheck the 68 missing case IDs, then compare source/case totals and point-in-time evidence bounds (`observed_at <= available_at <= entry_at`).
4. Expand evidence from raw price/flow/sentiment/news/whale/Event→Flow source tables in fingerprinted, timestamped batches; the current 3,019 evidence rows only cover variant signals, trades, and 19 composite signals.
5. Create `research_findings` only with stable evidence IDs, explicit cohort/scorer version, eligible sample, outcome maturity, limitations, and reproducible test logic.
6. Keep archive capture and source deletion flags false until full source coverage and restore verification pass.

## Change status

This is a research record of read-only production checks. No production row, outcome, archive flag, migration, cron job, strategy weight, or Edge Function was changed by this audit. PR #134 is draft and not deployed.


## Research-finding writer inventory

A repository-wide code search for `research_findings` / `insert into public.research_findings` found the read path in `src/lib/research-knowledge.functions.ts`, the schema/indexes in the migration, and documentation/tests—but no production writer or candidate-finding generator. This matches the production count of zero findings. The next layer must be built deliberately: findings need evidence/case IDs, cohort/scorer version, sample eligibility, maturity checks, explicit limitations and reproduction steps. Do not write “validated” findings directly from the aggregate table above, and do not make the generator a scorer or entry-gate dependency.
