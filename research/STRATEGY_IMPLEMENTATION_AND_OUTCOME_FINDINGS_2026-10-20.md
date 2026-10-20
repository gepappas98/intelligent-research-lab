# Strategy & Implementation Findings — source-code review, 2026-10-20

## Provenance and scope
Read-only review of source repository `gepappas98/pixel-perfect-pixels` at commit `4e55ba120f37fe959d8dd4256ee6536cedfe5253` (2026-10-19 UTC). Findings below describe implementation, not proof of profitability. Related files are linked to that exact commit so future manual reviews can compare revisions.

## Finding F-20261020-01 — Early Entry requires a canonical regime transition
**Status:** implemented; effectiveness unresolved. **Confidence:** high for code behavior, low for edge.

The `early-entry-regime` function explicitly reads recent 1h breadth, whale-flow balance, prior regime observations and fresh canonical `market_regime_telemetry`; canonical telemetry must have `data_status='ok'` and be no older than 20 minutes. The documented intent is a bearish/sideways → bullish transition without a price-confirmation gate. Open paper entries are tagged `early-entry-regime`, `spot-long-only`, `research-unbounded`, and `purple-label`; metadata records strategy version, transition timing and gate diagnostics.

- Source: [early-entry-regime/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/early-entry-regime/index.ts)
- Orchestration: [trading-pipeline-orchestrator/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/trading-pipeline-orchestrator/index.ts)
- Source-backed aggregate snapshot (2026-10-20): 6 resolved `early_entry_regime/buy` cases, mean net PnL −$8.5568, total −$51.3407, entry window 2026-10-16 23:00 to 2026-10-19 15:10 UTC. This is a tiny sample and cannot establish failure or success.
- Important operational clue: older runs had a reported null `market_regime_score` because the function expected `body.market_regime_score` while orchestration called it with an empty body. Current source includes a fallback using canonical telemetry and records component sample counts; verify deployed version and persisted diagnostics before assuming the defect is fully resolved.
- Next test: join each decision/entry to its eventual trade outcome and saved gate diagnostics; segment by regime transition age and telemetry freshness; compare a frozen out-of-sample window.

## Finding F-20261020-02 — Event → Flow Lab is an independent paper-only confirmation strategy
**Status:** implemented; effectiveness currently adverse in small sample. **Confidence:** high for code behavior, moderate for aggregate observation.

The `event-flow-paper-open` function requires fresh RSS consensus, whale-flow snapshots and Binance Spot price. Thresholds in the reviewed code: sentiment age ≤20 minutes, sentiment score ≥+0.15, confidence ≥0.45, flow age ≤20 minutes, flow score ≥+0.10 and dominant state `accumulation`, price age ≤20 minutes, plus one active position per symbol and a 15-minute cooldown. Position size is $1,000; TP +4%, SL −3%; fee rate configured at 0.1%. It stores source timestamps, counts, confidence and flow context in entry metadata, and tags entries research-only/paper-only.

- Source: [event-flow-paper-open/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/event-flow-paper-open/index.ts)
- UI labels it “PAPER OPEN strategy · research-only · live orders disabled”: [EventFlowTransmissionPanel.tsx](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/components/trading/EventFlowTransmissionPanel.tsx)
- Source-backed aggregate snapshot (2026-10-20): 16 resolved `event_flow_paper/buy` cases, mean net PnL −$6.4924, total −$103.8778, entry window 2026-10-14 17:05 to 2026-10-19 12:20 UTC. Small, potentially regime-clustered sample; no claim of stable expectancy.
- Next test: compare accepted entries with rejected `event_flow_paper_decisions`; quantify which gate adds incremental value; stratify by sentiment confidence, unique RSS items, flow score and regime. Freeze logic before the next non-overlapping window.

## Finding F-20261020-03 — Pipeline compacts redundant payloads
**Status:** implemented in reviewed commit. **Confidence:** high for code behavior.

The orchestrator stores summaries instead of duplicating full whale-alert arrays and composite-signal rows inside each `pipeline_runs` JSONB result. The canonical details remain in `whale_alerts` and `composite_signals`. This is a useful storage-control pattern: keep one canonical raw source and reference it, rather than repeatedly embedding large payloads. It does not mean all pipeline storage has been proven compact or that historical bloat has been removed.

- Source: [trading-pipeline-orchestrator/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/trading-pipeline-orchestrator/index.ts)
- Next test: measure actual serialized `pipeline_runs` row-size growth across new runs; compare before/after without rewriting historical rows.

## Finding F-20261020-04 — The latest paper cohorts disagree; no global strategy verdict
**Status:** observed aggregate evidence; replication pending. **Confidence:** moderate for the recorded snapshot, low for generalization.

The point-in-time source query recorded:
- `cmc_paper/buy`: 114 resolved, mean net +$2.0424, total +$232.8319 (2026-10-16 12:40 to 2026-10-19 20:20 UTC). Promising only as a hypothesis; confirm costs, cohort definition and replication on a non-overlapping window.
- `standard/buy`: 28 resolved, mean net −$21.0035, total −$588.0989 (2026-10-15 17:40 to 2026-10-19 08:40 UTC). Adverse observation; inspect regime, symbol concentration, entry context and exits before changing gates.
- These are USD net-PnL aggregates for source cohort `Unknown` / scorer `paper-trade`, not V2/V3 benchmark results and not evidence of live profitability. Source row IDs/run IDs were not retained in the aggregate extract, so provenance is incomplete and should be improved on the next manual query.

## Finding F-20261020-05 — V2 benchmark results are materially adverse in the inspected slice
**Status:** exploratory aggregate; exact full benchmark window/selection needs confirmation. **Confidence:** moderate for counts captured, low for broad generalization.

The source-backed slice recorded negative summed PnL percentage points across the listed V2 groups: Accumulation 80 resolved win/loss cases (25 wins, 55 losses; −65.0 pp); AI-driven 82 wins/losses plus 47 expired (−150.4458 pp); Balanced 56 wins/losses plus 25 expired (−126.6414 pp); Chart-trader 206 wins/losses plus 38 expired (−329.9108 pp); Conservative 227 wins/losses plus 62 expired (−327.6715 pp); SMC-reversal 317 wins/losses plus 58 expired (−493.1013 pp); Volatility-timing 321 wins/losses plus 57 expired (−491.3329 pp); VWAP-momentum 322 wins/losses plus 58 expired (−494.1013 pp); Whale-focused 230 wins/losses plus 64 expired (−329.9122 pp). Expired rows must remain explicit: some carry negative recorded PnL and must not be silently discarded or reclassified as wins. The slice is narrow and clustered around 2026-10-15; it is not a V3 verdict.

- Next test: rerun using a frozen cohort/window contract, verify expiry accounting and outcome labels, report net-of-cost expectancy and unresolved fraction separately by variant.

## Research priorities, ordered
1. Reconcile every resolved paper result to a stable trade ID, entry source, entry/exit timestamps, fees and net PnL; retain unresolved counts.
2. Inspect negative Standard and Event Flow results by regime/symbol/gate/exit before modifying strategy logic.
3. Link Early Entry `NO_ENTRY` / `PAPER_OPEN` decisions to later outcomes and persisted diagnostics.
4. Freeze and test CMC Paper on a non-overlapping window before calling its positive aggregate repeatable.
5. Recompute V2 benchmark slices with explicit expiry treatment; keep them separate from V3 and actual paper trades.

## Limitations
This is a code-history review plus already captured aggregate evidence, not a fresh full-database export or exhaustive replay. It does not alter source rows or production strategy behavior. A future user-requested manual refresh should preserve exact source IDs, run IDs, query/window metadata and cohort filters alongside every aggregate.


## Finding F-20261020-06 — Source Research Knowledge archive is designed fail-closed; it is not the IRL transfer format
**Status:** source-code/history fact; runtime controls are documented in source development history. **Confidence:** high for recorded change, not a live re-query.

The source repository's migration defines compact evidence records with source table/ID, symbol, observed/available/captured timestamps, fingerprint, role (`entry_context`, `outcome`, `observation`) and bounded summary; case records retain cohort (`Legacy`, `V2`, `V3`, `Unknown`), scorer version, entry/resolution/maturity timestamps, outcome, PnL unit and evidence IDs. The source project's documented 2026-10-20 safety correction says broad refresh exceeded SQL timeout, was replaced with bounded 250-row batches and automatic variant materialization narrowed to V3 only; 2,250 resolved V2 cases had already been materialized, while Legacy/V2 remained intact. The documented controls were `allow_archive=false` and `allow_source_delete=false`; 22,150 retention-eligible source rows remained unarchived and undeleted. The existing source cron schedule was left unchanged.

- Migration source: [research_knowledge_archive.sql at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020160000_research_knowledge_archive.sql)
- Change history: [DEVELOPMENT_HISTORY.md at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/DEVELOPMENT_HISTORY.md)
- CI/test source: [research_knowledge_archive.integration.sql](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/tests/research_knowledge_archive.integration.sql)

**IRL decision:** reuse the sound knowledge principles—stable source identity, role-separated evidence, no-lookahead timestamp checks, idempotent fingerprints, explicit cohort/PnL units, and fail-closed safety—but do not copy source rows or enable its archive/delete mechanism for this task. IRL transfer remains conclusions-only and manually initiated. The source project's own bounded V3 materialization is a separate workflow and must not be confused with IRL's manual knowledge refresh.



## Finding F-20261020-07 — Early Entry has a conjunctive transition bottleneck worth measuring
**Status:** code-derived hypothesis; not a proven defect. **Confidence:** high for gate logic, unknown impact on trade quality.

In the reviewed `early-entry-regime` implementation, activation requires all of the following at once: canonical telemetry currently bullish and fresh (≤20 minutes), a bearish/sideways → bullish transition within 60 minutes, both 1h breadth conditions improving versus the transition baseline (bullish count must increase **and** bearish count must decrease), and current whale flow in accumulation while a neutral/distribution whale state is observed during the transition window. The short-term taker-buy imbalance is explicitly diagnostic/prioritization only, not a hard gate. Candidate entries are then restricted to currently bullish 1h symbols and at most five per activation key.

This is a deliberately strict hypothesis, but it may suppress valid transitions if breadth is flat on one side or if the observation cadence does not capture the required baseline. Do not relax it based only on the six resolved outcomes.

- Source: [early-entry-regime/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/early-entry-regime/index.ts)
- Diagnostic test: count transition candidates and classify each rejection by the exact gate; compare the current conjunctive rule with offline-only counterfactual variants (bullish breadth increase **or** bearish breadth decrease; each independently), then link both accepted and rejected decisions to mature outcomes. Freeze the logic during evaluation and prevent look-ahead.
- Decision rule: do not deploy a looser gate unless an independent window improves net-of-cost expectancy without unacceptable drawdown and without relying on immature outcomes.

## Finding F-20261020-08 — Event → Flow gate order creates an interpretable rejection taxonomy
**Status:** code-derived; outcome attribution not yet measured. **Confidence:** high for code behavior.

The reviewed function evaluates missing/stale inputs first (no open if any of RSS consensus, Whale Flow, or Binance Spot price is absent), then applies sentiment score ≥+0.15, RSS confidence ≥0.45, flow score ≥+0.10 with dominant state `accumulation`, one active paper position per symbol, and a 15-minute cooldown. Each asset receives a status/reason such as `WAITING_DATA`, `NOT_CONFIRMED`, `ALREADY_OPEN`, `COOLDOWN`, `OPEN_FAILED` or `OPENED`. This rejection ledger is valuable only if status counts are reconciled to later trade outcomes and source freshness.

- Source: [event-flow-paper-open/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/event-flow-paper-open/index.ts)
- Next test: report decision-status counts by symbol and time window; for each opened position join the saved sentiment/flow/price timestamps and exit outcome; compare accepted vs rejected opportunities with a defined counterfactual. Do not interpret rejected candidates as wins or losses.

## Finding F-20261020-09 — Micro-timeframe gate is asymmetric; pass is not the same as confirmed bounce
**Status:** code behavior verified; outcome impact unmeasured. **Confidence:** high for implementation, no profitability inference.

At source commit 4e55ba120f37fe959d8dd4256ee6536cedfe5253, evaluateMicroTimeframeGate reads 5m/15m/1h trend labels. It rejects when bears outnumber bulls, including a specific rejection for at least two bearish and zero bullish readings. It marks a confirmed bounce only with at least two bullish readings and zero bearish readings. Mixed/balanced states can still pass as balanced or supportive, so a pass alone does not imply strong bullish confirmation.

A separate BTC-downtrend entry gate is stricter: when BTC downtrend is confirmed, BUY requires at least two bullish micro readings and zero bearish readings. If BTC data is missing, code does not infer a downtrend. In a qualifying BTC-downtrend + positive whale-flow divergence, the adjusted shadow regime can reject even after the micro bounce. These are distinct gates and must be measured separately rather than summarized as one generic MTF condition.

**Research implication:** log each gate independently (micro trend, BTC downtrend, whale divergence) with input freshness, exact timeframe states, allow/reject reason, and linked eventual trade outcome. Offline ablation should compare current rule against frozen alternatives on a later, non-overlapping window after fees; do not relax a gate from code inspection alone.

Sources: [micro-trend-gate.ts](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/trade-executor/_shared/micro-trend-gate.ts), [regime-divergence.ts](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/trade-executor/_shared/regime-divergence.ts).

## Finding F-20261020-10 — Benchmark RPCs encode cohort boundaries in source fingerprints
**Status:** source contract verified; production deployment/runtime parity not verified. **Confidence:** high for migration contents.

Migration 20261018120000_variant_benchmark_v3.sql defines the general get_variant_performance function by excluding source fingerprints prefixed v2| and v3| (therefore it is not the V3 cohort), while get_variant_performance_v3 selects only fingerprints prefixed v3|. Both classify win/loss/expired as resolved and sum PnL for all three, while open cases are counted separately. This is a source-level cohort contract, not evidence that a particular deployed dashboard is currently querying the expected function.

**Research implication:** every exported benchmark snapshot must record the exact RPC/function name, date window, source-fingerprint cohort rule, outcome categories, PnL unit, and observation timestamp. Never label results V3 merely because they came from the generic function, and do not silently exclude expired cases. Confirm deployed RPC and UI wiring separately before comparing historical panels.

Source: [20261018120000_variant_benchmark_v3.sql](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261018120000_variant_benchmark_v3.sql).

## Finding F-20261020-11 — Risk metrics and entry enforcement differ in research mode
**Status:** source behavior verified; runtime path/deployment parity unverified. **Confidence:** high for the shown source revision.

At the reviewed source revision, risk.engine.ts defines a normal-mode limit of 3 open positions, per-trade stop-risk 0.15% of equity, aggregate open stop-risk 1.2%, and a daily economic-loss limit of 1.2%. Its file-level contract explicitly says research mode continues calculating/persisting normal risk metrics for telemetry but does not use capacity/economic brakes to reject BUY opportunities; the max-position and daily-loss checks are conditioned on !researchMode. The same file documents a loss-streak halt (3 or more losses among the last 5 closed trades), so its exact interaction with researchMode and the actual caller must be inspected rather than inferred from the header alone.

The implementation also has a compatibility fallback for realized PnL: if net_pnl is null, or is zero while legacy pnl is non-zero, it uses pnl. That is a deliberate recovery for rows where a migration's default zero may not represent a true fee-aware result. Any independent reconciliation must retain both fields and flag the fallback cases rather than assume net_pnl=0 means a genuine zero.

**Research implication:** distinguish risk telemetry from actual rejection/enforcement in every report. Record researchMode, active guard, rejection reason, and caller path. Reconcile pnl/net_pnl, fee treatment, and close status before deriving performance. Do not assume a configured cap is active in research mode, and do not infer live-trading behavior from this paper-only risk engine.

Source: [risk.engine.ts](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/risk.engine.ts).

## Finding F-20261020-12 — Missing MTF inputs are excluded from the score denominator
**Status:** unit-tested source behavior; live incidence and predictive value unmeasured. **Confidence:** high for the scoring contract.

The shared MTF scorer's tests explicitly assert that unavailable timeframes are excluded from the denominator. Therefore, one available bullish timeframe with the other two unavailable can score +1.0, the same normalized score as three aligned bullish timeframes. A neutral but available timeframe, by contrast, dilutes the score. The diagnostic string in signal-combiner marks individual 4h/1h/1d frames as missing, so the underlying code provides a way to distinguish these cases, but any downstream consumer that stores only the scalar score can lose that distinction.

**Research implication:** retain score plus available-frame count, per-frame availability/freshness, and frame directions. Segment outcomes by coverage (3/3, 2/3, 1/3) before comparing presets; do not interpret a normalized score of +1 as proof that all timeframes agreed. Test whether a minimum-coverage rule improves out-of-sample net expectancy offline before any production change.

Sources: [MTF scoring tests](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/_shared/mtf-scoring.test.ts), [signal-combiner.ts](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/signal-combiner/index.ts).

## Finding F-20261020-13 — Research mode intentionally bypasses every economic/capacity brake in this risk engine
**Status:** source behavior verified; exact callers and production runtime path not yet verified. **Confidence:** high for this function.

The reviewed canOpenTrade implementation conditions maximum-open-position, daily economic-loss, consecutive-loss-streak, and aggregate portfolio stop-risk rejections on not being in researchMode. Research mode still calculates the associated metrics and returns them in RiskDecision, but those metrics are telemetry rather than enforced entry limits. The loss-streak query itself uses legacy gross pnl for the most recent closed paper BUY trades; it does not use the fee-aware realizedPnlValue helper used by equity/daily PnL calculations.

**Research implication:** any paper cohort produced with researchMode=true must be labelled capacity-unbounded and not evaluated as if the normal risk brakes had constrained it. Before comparing it to capped paper results, record the actual caller's researchMode value and quantify counterfactual breaches: positions above 3, daily economic loss below −1.2% equity, aggregate stop-risk above 1.2%, and 3+ losses in the last 5. Also reconcile gross pnl versus net_pnl for the loss-streak rule. This is an evaluation distinction, not a recommendation to turn the brakes on or off.

Source: [risk.engine.ts](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/risk.engine.ts).
