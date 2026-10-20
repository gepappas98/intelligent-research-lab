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
**Status:** source behavior and caller wiring verified at the reviewed commit; production runtime parity not verified. **Confidence:** high for source behavior.

The reviewed pipeline caller sets researchMode = (mode === "paper") and passes it into canOpenTrade. Therefore, at this source revision, ordinary paper mode activates the bypass: maximum-open-position, daily economic-loss, consecutive-loss-streak, and aggregate portfolio stop-risk rejections are all conditioned on not being in researchMode. Research mode still calculates the associated metrics and returns them in RiskDecision, but those metrics are telemetry rather than enforced entry limits. The loss-streak query itself uses legacy gross pnl for the most recent closed paper BUY trades; it does not use the fee-aware realizedPnlValue helper used by equity/daily PnL calculations.

**Research implication:** any paper cohort produced with researchMode=true must be labelled capacity-unbounded and not evaluated as if the normal risk brakes had constrained it. Before comparing it to capped paper results, record the actual caller's researchMode value and quantify counterfactual breaches: positions above 3, daily economic loss below −1.2% equity, aggregate stop-risk above 1.2%, and 3+ losses in the last 5. Also reconcile gross pnl versus net_pnl for the loss-streak rule. This is an evaluation distinction, not a recommendation to turn the brakes on or off.

Source: [risk.engine.ts](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/risk.engine.ts).


## Finding F-20261020-14 — Whale-flow shock “complete” labels require paired BTC-price coverage; runtime parity is unresolved
**Status:** corrective SQL verified in source; canonical production application must be verified independently. **Confidence:** high for the SQL contract, provisional for current data state.

The historical canonical audit recorded 546 rows labeled `complete_24h`, but only 144 had `btc_return_24h` populated. The defect was semantic, not merely missing data: earlier refresh SQL assigned completeness from flow deltas alone, so a row could claim a complete flow→BTC-price horizon without the paired price return. The reviewed corrective migration `20261009050000_fix_whale_flow_shock_data_quality.sql` instead labels a horizon complete only when both the corresponding flow delta and BTC return are non-null (15m, 1h, 4h, or 24h). It upserts derived follow-up rows and leaves raw snapshots/transitions untouched.

The source stabilization tracker has conflicting historical status notes: it describes PR #72 as not yet applied in one section, while also containing a post-recomputation verification result elsewhere. Therefore neither “still broken” nor “fixed in production” is safe to assert from repository text alone. The corrected SQL exists at the reviewed source revision; current canonical migration history and post-refresh row counts remain the decisive checks.

**Research implication:** exclude or separately stratify old `complete_*` cohorts unless paired-horizon completeness is verified. For each horizon, require both flow delta and BTC return, retain the label-definition/version and refresh timestamp, and never treat missing BTC return as zero or as evidence of no price response. Do not rerun the production refresh or apply migrations as part of this conclusions-only transfer.

Sources: [corrective migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261009050000_fix_whale_flow_shock_data_quality.sql), [stabilization tracker](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/docs/P0_STABILIZATION_TRACKER.md), [PR #72](https://github.com/gepappas98/pixel-perfect-pixels/pull/72).


## Finding F-20261020-15 — Execution audit is persisted per pipeline run, but does not by itself reconstruct bypassed risk counterfactuals
**Status:** source path verified at reviewed commit; current production payload shape/retention not revalidated. **Confidence:** high for source implementation.

The pipeline caller passes `pipelineRunId` into `executeTrades()`, collects `executionResult.audit`, and persists those events under `pipeline_runs.result.execution_audit.events`. Risk-engine rejections include side, entry price, and stop loss in the audit details. However, when paper mode sets `researchMode=true`, the risk engine allows entries past several normal-mode economic/capacity brakes, so those bypassed checks do not appear as rejection events. The `RiskDecision` telemetry is not visibly added to the audit event in the reviewed call site. Separately, `execution_capacity_observations` is written only when a max-open-position rejection occurs; that rejection is itself bypassed in research mode at the reviewed source revision.

**Research implication:** absence of a risk rejection is not evidence that a candidate would pass the normal risk limits. Historical audit events alone may be insufficient to estimate counterfactual rejections. First inventory which risk metrics, open positions, equity, realized PnL, and timestamps are actually recoverable for each candidate; label irrecoverable counterfactuals as unknown. For future measurement, prefer a separately versioned, research-only decision snapshot that records calculated risk metrics and “would reject” reasons without changing execution behavior. Do not expand raw `pipeline_runs.result` payloads indiscriminately; store compact typed fields or a bounded summary and preserve the existing payload compaction discipline.

Source: [pipeline.server.ts at reviewed commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/pipeline.server.ts).


## Finding F-20261020-16 — Benchmark RPC names represent different cohorts; source UI is wired to V3
**Status:** source-code contract verified; deployed database/UI parity not verified. **Confidence:** high for reviewed source revision.

The migration `20261018120000_variant_benchmark_v3.sql` defines two distinct contracts:
- `get_variant_performance(days)` excludes fingerprints prefixed `v2|` and `v3|`; it is therefore the non-V2/non-V3 cohort, not V3.
- `get_variant_performance_v3(days)` selects only `v3|` fingerprints.
Both aggregate BUY observations, count `win`, `loss`, and `expired` as resolved, and sum `pnl_pct` across all three resolved outcomes. Expiry semantics therefore remain a separate accounting check.

At reviewed source commit `4e55ba120f37fe959d8dd4256ee6536cedfe5253`, the Variant Comparison panel, strategy auto-switch, and read-only MCP diagnostic call `get_variant_performance_v3`. This is reassuring source-level wiring, but does not prove the production migration is applied or that the published frontend matches this commit. The general RPC must never be described as the V3 result.

Sources: [V3 benchmark migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261018120000_variant_benchmark_v3.sql), [Variant Comparison panel](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/components/trading/VariantComparisonPanel.tsx), [strategy auto-switch](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/strategy-auto-switch/index.ts), [read-only diagnostic allowlist](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/mcp-diagnostic.server.ts).

No production RPC, migration, UI, or strategy was changed in this review.


## Finding F-20261020-17 — Shadow resolver must distinguish maturity from missing market data
**Status:** source/PR evidence; current merge and production deployment status not verified. **Confidence:** high for the documented failure mode, unknown for present runtime state.

The source repository's resolver audit history describes a concrete failure pattern: matured shadow rows remained open because Binance rejected a symbol/pair request (example: `PONSUSDT`, HTTP 400), while an outer catch converted the fetch failure to an empty candle array. A zero-candle window therefore did not explain whether the row lacked a relevant candle or the fetch itself failed. The proposed resolver audit changes add explicit events for fetch failures and for expiry blocked by fetch failure/no relevant candle, without inventing a close or changing TP/SL/72-hour expiry rules.

Related PR records:
- [PR #78 — prioritize matured shadow resolver rows](https://github.com/gepappas98/pixel-perfect-pixels/pull/78): describes starvation risk when rotating pages as eligible row counts change; adds a dedicated matured-row batch alongside a rotating regular batch.
- [PR #79 — audit resolver candle fetch failures](https://github.com/gepappas98/pixel-perfect-pixels/pull/79): describes the v5-to-v6 audit-event change.
- [PR #77 — retry-safe shadow resolver](https://github.com/gepappas98/pixel-perfect-pixels/pull/77): describes symbol-to-pair normalization, non-terminal treatment of missing lower-timeframe candles and rotating batches; its body explicitly says the deployed function was still v3 at the time of that report.

These PR descriptions are evidence of proposed/code-level remediation, not proof they are merged or deployed. An open/unresolved row is not a loss, win, expiry, or zero-PnL observation. Next manual audit should check the exact deployed resolver version and compare matured-open counts, fetch-failure events, relevant-candle counts and actual terminal outcomes. No production resolver or historical row was changed in this research pass.

## Finding F-20261020-18 — Execution-capacity observations are rejection-triggered, not a full candidate ledger
**Status:** schema/call-site fact at reviewed source commit; production coverage unverified. **Confidence:** high for schema and reviewed caller behavior.

The `execution_capacity_observations` schema captures pipeline run ID, signal ID, symbol, observed time, candidate confidence/price/regime/reasoning, rejection reason, open-position count, held positions and a candidate snapshot. However, the reviewed caller writes these records in the max-open-position rejection path. It is therefore a selective record of capacity rejections, not a complete log of all candidate decisions and not sufficient by itself to replay normal risk decisions. Combined with the paper-mode risk-brake bypass documented in F-11/F-13/F-15, missing observations must not be interpreted as proof a candidate passed normal risk limits.

Source: [observation schema](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261008163705_add_execution_capacity_observations.sql), [reviewed pipeline caller](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/pipeline.server.ts).

Research implication: inventory the recoverable candidate universe and label absent telemetry as unknown. Any future compact decision telemetry should be versioned and research-only; do not alter execution policy as part of this audit.


## Finding F-20261020-19 — Whale Flow Shock “complete_24h” was not proof of paired price coverage
**Status:** defect and proposed correction documented at reviewed source revision; current production application state is not established by this snapshot. **Confidence:** high for the documented historical defect.

The source tracker records a read-only audit with 546 rows labeled `complete_24h`, of which only 144 had `btc_return_24h` populated. The documented cause is that `refresh_whale_flow_shock_followups()` labeled completeness from flow deltas without requiring the paired BTC price return at the same horizon. A derived 24h follow-up therefore could be marked complete while lacking its paired market-price outcome, making causal or predictive analysis vulnerable to coverage bias.

The corrective migration `20261009050000_fix_whale_flow_shock_data_quality.sql` changes the refresh function and describes recomputing derived follow-up rows while leaving raw observations unchanged. However, the tracker at the reviewed source commit explicitly says this migration had **not** been applied to production at that time. This is historical status evidence, not a claim about today's database state.

Sources: [P0 stabilization tracker at reviewed commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/docs/P0_STABILIZATION_TRACKER.md), [corrective migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261009050000_fix_whale_flow_shock_data_quality.sql).

Research rule: never treat `complete_24h` as validated until paired flow and BTC return exist for the same horizon. Before using the cohort, verify production migration version and recalculate coverage counts by horizon; do not alter raw observations or infer missing returns.


## Finding F-20261020-20 — Missing executor audit can be persisted as a zero-count “completed” audit
**Status:** code-path fact at reviewed source commit; frequency in production runs unknown. **Confidence:** high for fallback semantics.

In `supabase/functions/trading-pipeline-orchestrator/index.ts`, the orchestrator reads `tradeExecutorStage?.result?.execution_audit`. If absent, it synthesizes a version-1 audit with `status: "completed"`, an empty `events: []`, and summary counters `eligible_buy_signals: 0`, `audited_eligible_signals: 0`, `uncovered_eligible_signals: 0`; it also defaults opened/skipped counts from the executor result. This fallback conflates “audit object was not returned” with a genuinely complete audit that found zero eligible candidates. The three zero counters do not establish that no eligible signals existed or that coverage was complete.

Source: [orchestrator at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/trading-pipeline-orchestrator/index.ts).

Research implication: when analyzing historical audit coverage, distinguish audit-present from audit-synthesized/missing. Treat fallback records as `audit_missing` / coverage unknown; do not interpret zero eligible or zero uncovered counters as evidence of complete telemetry. This is a research data-quality finding only; no execution or production code changed.


## Finding F-20261020-21 — Orchestrator can mark a run completed when trade-executor failed
**Status:** control-flow fact at reviewed source commit; production incidence unknown. **Confidence:** high for reviewed branch behavior.

The orchestrator's `call()` wrapper preserves HTTP failures as `ok: false`. Phase 3 collects `trade-executor` and `variant-resolver` concurrently, but unlike earlier critical ingestion and synthesis stages, it does not check `tradeExecutorStage.ok` before proceeding. After post-trade learning, the outer path writes `pipeline_runs.status = "completed"` even if trade-executor returned a non-2xx response. When that failed result also lacks an audit object, the orchestrator can persist the synthetic empty “completed” audit described in F-20. Consequently, pipeline status alone is not proof that paper execution completed successfully.

Source: [orchestrator at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/trading-pipeline-orchestrator/index.ts).

Research implication: execution-quality analysis must inspect the individual `trade-executor` stage `ok/status`, audit presence/status and the top-level pipeline status separately. Count completed pipeline runs with failed executor stages; do not treat them as successful zero-trade runs. This documents current source behavior only; no production code or pipeline status was changed.


## Finding F-20261020-22 — V3 “win rate” excludes expired cases while resolved PnL includes them
**Status:** metric-definition fact in the reviewed panel and RPC; impact on current displayed rates requires cohort counts. **Confidence:** high.

The V3 RPC counts `win`, `loss`, and `expired` as resolved and sums `pnl_pct` across all three terminal outcomes. The Variant Comparison panel computes displayed `Win%` as `wins / (wins + losses)`, deliberately excluding expired cases from that denominator. Therefore the displayed win rate is conditional on a win/loss decision, not wins divided by all resolved cases. Expired cases still affect the displayed resolved count and total PnL. This is not necessarily a bug, but comparisons can be misleading unless the denominator and expiry share are shown together.

Sources: [V3 benchmark RPC migration at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261018120000_variant_benchmark_v3.sql), [Variant Comparison panel at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/components/trading/VariantComparisonPanel.tsx).

Research rule: report wins, losses, expired, and open separately; calculate and label both decision win rate (`wins/(wins+losses)`) and all-resolved win share (`wins/resolved`) where useful. Never infer that expired outcomes are wins or losses, and keep expired PnL in net benchmark performance.


## Finding F-20261020-23 — Terminal `ambiguous` outcomes disappear from V3 summary counts
**Status:** code-path fact at reviewed source commit; actual row count unknown. **Confidence:** high.

The resolver can persist `outcome = 'ambiguous'`, `resolved_at` set, and `pnl_pct = null` when TP and SL cannot be ordered from available candles. The V3 RPC defines `resolved` as only `win`, `loss`, or `expired`, and `open_count` as only `open`. The Variant Comparison panel derives `totalObserved = totalResolved + totalOpen`. Thus terminal ambiguous rows are neither resolved nor open in the displayed totals, and the panel can understate the number of evaluated/terminalized cases. Null PnL is appropriate for unresolved path ordering; omission from cohort coverage counts is the reporting gap.

Sources: [variant-resolver at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/variant-resolver/index.ts), [V3 RPC definitions](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261018120000_variant_benchmark_v3.sql), [Variant Comparison panel](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/components/trading/VariantComparisonPanel.tsx).

Research rule: report `ambiguous` separately as a terminal non-scored outcome; keep its PnL null and exclude it from win/loss profitability calculations, but include it in total case-coverage accounting. Do not reclassify it as expired, win, loss, or zero PnL.


## Finding F-20261020-24 — Benchmark panel silently substitutes fallback assumptions when settings query has no data
**Status:** source-code fact at reviewed revision; whether the fallback differs from production settings at any given time is unknown. **Confidence:** high.

The Variant Comparison panel queries `pipeline_settings` for `variant_max_hours`, `variant_tp_pct`, and `variant_sl_pct`, but sets `settings = settingsQuery.data ?? FALLBACK_SETTINGS`. Its explicit error branch checks the performance query, not `settingsQuery.error`. If the settings read fails or returns no row, the panel can continue showing benchmark assumptions from the fallback constant instead of confirming the active resolver settings. This can make a performance display look more precisely tied to runtime configuration than the evidence supports.

Source: [Variant Comparison panel at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/components/trading/VariantComparisonPanel.tsx).

Research rule: record settings provenance as `runtime`, `fallback`, or `unavailable`; do not label fallback values as the active runtime configuration. For historical comparisons, join the benchmark outcomes to settings evidence available for the same evaluation period.


## Finding F-20261020-25 — Resolver can return overall `ok: true` after per-row database update failures
**Status:** source-code fact at reviewed revision; failure frequency unknown. **Confidence:** high.

When an individual `strategy_variant_signals` update fails, the resolver records `db_update_failed` in its audit and continues to the next candidate. Its final response still returns `ok: true`, with `resolved` counting successful updates and `candidates` counting selected variants; it does not return a dedicated failed-update count. Thus a successful HTTP/function-level response can still represent partial resolution. Consumers that only inspect `ok` may miss unresolved rows caused by write failures.

Source: [variant-resolver at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/variant-resolver/index.ts).

Research rule: distinguish candidate count, successfully updated count, write failures, candle-data blocks, no-relevant-candle blocks, and unresolved remainder. Reconcile candidate outcomes to database state; never equate `ok: true` with every candidate being resolved.


## Finding F-20261020-26 — V3 benchmark PnL is raw price return, not fee-adjusted net return
**Status:** calculation fact at reviewed source revision. **Confidence:** high.

The resolver calculates `pnl_pct` solely from entry price and exit price: for BUY, `(exit-entry)/entry * 100`; for SELL, `(entry-exit)/entry * 100`. The reviewed calculation does not subtract entry/exit trading fees, spread, slippage, or execution impact. Consequently, V3 `total_pnl_pct` is a gross price-movement benchmark, not realized net trading performance. This does not invalidate within-cohort gross comparisons, but it can overstate deployable economic performance and makes comparisons with fee-adjusted paper-trade PnL non-equivalent.

Source: [variant-resolver at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/variant-resolver/index.ts), [V3 benchmark RPC migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261018120000_variant_benchmark_v3.sql).

Research rule: label the current metric `gross price-return %`. Any net counterfactual must use evidenced fee/spread/slippage assumptions, remain a separate derived metric, and never overwrite historical `pnl_pct`.


## Finding F-20261020-27 — Rotating offset pagination of mutable open rows needs starvation/coverage verification
**Status:** risk inferred from source pagination design; actual skipped-row incidence unmeasured. **Confidence:** moderate.

The resolver selects open rows in fixed batches of 100 using `created_at` ordering and an offset derived from a rotating scheduler slot and the current count of eligible/matured open rows. Rows are removed from the selected set as they resolve, so the set size and computed page count change between invocations. With offset pagination over a mutable set, a shrinking count can shift page boundaries and cause rows to be revisited or delayed; the source also separates matured and regular batches, which need independent coverage accounting. This is a testable coverage risk, not proof that a specific row was skipped.

Source: [variant-resolver at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/variant-resolver/index.ts).

Research rule: measure oldest eligible age, selection frequency, time-to-resolution, and never-selected eligible rows separately for matured and regular cohorts. Do not infer full resolver coverage from successful invocations or aggregate candidate counts.


## Finding F-20261020-28 — Variant panel silently omits strategy names outside its fixed preset list
**Status:** UI aggregation fact at reviewed source revision; whether unknown strategy rows exist in current V3 results is unknown. **Confidence:** high.

The V3 RPC groups by the database's `strategy_name`, and the panel builds an aggregation map from every returned row. However, its rendered strategy list and total counters iterate only the hard-coded `PRESET_ORDER` list. A newly introduced, renamed, or unexpected strategy name returned by the RPC can therefore be present in the response but omitted from visible rows and `totalObserved` without an explicit warning. This is a schema/UI coverage risk, not proof that current production rows are being omitted.

Source: [Variant Comparison panel at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/components/trading/VariantComparisonPanel.tsx), [V3 RPC migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261018120000_variant_benchmark_v3.sql).

Research rule: compare distinct RPC `strategy_name` values with `PRESET_ORDER`; report unknown names explicitly and keep raw RPC totals separate from preset-only display totals.


## Finding F-20261020-29 — The rolling seven-day V3 panel compares cohorts with different maturity
**Status:** cohort-window fact; effect size requires outcome-age analysis. **Confidence:** high.

The panel queries V3 performance for `days: 7`, and the RPC filters by `created_at >= now() - 7 days`, not by a fixed entry cohort with uniform follow-up or by resolution time. It displays open cases separately, but its resolved win/loss/expired and PnL totals can still reflect unequal outcome maturity: newer entries have had less time to hit TP/SL or reach expiry, while older entries have had more resolution opportunity. Strategy entry rates and the age distribution of unresolved cases can therefore influence a live rolling comparison.

Sources: [Variant Comparison panel](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/components/trading/VariantComparisonPanel.tsx), [V3 RPC migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261018120000_variant_benchmark_v3.sql).

Research rule: pair rolling-window results with entry-age and maturity coverage. For strategy comparisons, use matched entry windows and a common minimum follow-up horizon where possible; keep open cases censored rather than scoring them as losses or zero.


## Finding F-20261020-30 — Early Entry whale-flow breadth is computed from an unordered capped query
**Status:** source-code fact at reviewed revision; whether the 3,000-row cap is reached and whether it biases live calculations are unknown. **Confidence:** high for query semantics.

The Early Entry function reads `whale_alerts` created within the previous hour with `.limit(3000)`, but does not specify an `order()` for that query. It then computes accumulation/distribution USD totals and derives `whaleNet` and `whaleState` from the returned rows. If more than 3,000 rows qualify, the query has no explicit recency or deterministic ordering guarantee in the source, so the calculated flow state may depend on which subset is returned. Even below the cap, the implementation does not record a count of qualifying rows excluded by the cap because it does not request an exact count.

Source: [early-entry-regime at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/early-entry-regime/index.ts).

Research rule: audit one-hour qualifying whale-alert counts and whether the 3,000-row limit is reached; compare the current computed state with a deterministic, fully covered or explicitly bounded cohort offline. Do not change the production gate until the bias is measured.


## Finding F-20261020-31 — Archive cleanup response contains contradictory status keys
**Status:** source-code fact; no claim that cleanup was run. **Confidence:** high.

Migration `20261020182000_research_archive_capture_gate.sql` pauses archive writes by setting `allow_archive=false` pending storage/evidence review. In the early return from `cleanup_research_data`, the same `jsonb_build_object` supplies `archive_only=true` and later `archive_only=false` (and repeats `archive_enabled` / `delete_enabled`). PostgreSQL JSON object construction retains the later value for duplicate keys, so the returned `archive_only` flag can contradict the explanatory reason and disabled archive status. The branch returns before any source DELETE, so this is a status/reporting defect, not evidence of deletion.

Source: [archive capture gate migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020182000_research_archive_capture_gate.sql).

Research/safety rule: treat `archive_enabled`, `delete_enabled`, `reason`, and actual row deltas as separate evidence; fix duplicate response keys in a future reviewed migration only. Never infer that cleanup ran from this source inspection.


## Finding F-20261020-32 — Event→Flow open-position and cooldown checks are a bounded, non-atomic preflight
**Status:** source-code fact; duplicate-entry frequency unknown. **Confidence:** high for the preflight design.

`event-flow-paper-open` queries the newest 500 `event_flow_paper` paper trades, builds its active-position and cooldown maps in memory, then inserts qualifying trades one at a time. There is no transaction spanning the preflight read and insert in this function, and the reviewed code does not establish a database uniqueness guard for one active trade per asset. A position outside the newest-500 window may be missed; overlapping invocations can also both pass the same preflight before either insert completes. Neither failure is proven to have occurred.

Source: [event-flow-paper-open at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/event-flow-paper-open/index.ts).

Research rule: audit open-position counts independently of the 500-row decision window, check overlapping invocation timestamps, and count same-asset concurrent opens. Keep this as a paper-only integrity audit; do not add an execution lock without a deliberate design review.


## Finding F-20261020-33 — Early Entry variant confluence reads fail without explicit error diagnostics
**Status:** source-code fact; actual query-failure incidence unknown. **Confidence:** high.

In `early-entry-variants`, the council, sentiment, and price-snapshot reads destructure `data` without checking each query's `error`. Missing rows and query failures can therefore both appear as absent confluence/price evidence. Council and sentiment are boosters rather than mandatory gates, but this still weakens diagnostic interpretation; a failed price read can leave the variant with no candidates without a distinct data-error classification.

Source: [early-entry-variants at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/early-entry-variants/index.ts).

Research rule: distinguish `no_rows`, `query_error`, `stale_data`, and `valid_data` for each optional input. Do not interpret missing confluence as negative sentiment or no candidate as a market rejection when the input read failed.


## Finding F-20261020-34 — Early Entry variant opens the trade before persisting its decision ledger row
**Status:** source-code fact; orphaned-trade frequency unknown. **Confidence:** high.

For B/C variants, `early-entry-variants` first inserts a paper trade and then separately inserts the corresponding `early_entry_variant_decisions` row. These writes are not wrapped in a transaction in the reviewed function. If the trade insert succeeds but the decision insert fails, the paper position can exist without its expected linked decision record; retry behavior and duplicate-key handling do not by themselves make the two writes atomic.

Source: [early-entry-variants at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/early-entry-variants/index.ts), [decision-ledger schema migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261014210000_early_entry_parallel_paper_variants.sql).

Research rule: reconcile variant-tagged trades to decision rows by `entry_metadata.signal_key`, `trade_id`, and `decision_key`; separately report missing decision rows and decisions whose trade_id no longer resolves.


## Finding F-20261020-35 — Candle collector's candidate universe is seeded from recent 5m indicator rows
**Status:** source-code fact; universe omissions unknown. **Confidence:** high.

`market-candle-collector` selects symbols from `indicator_snapshots` where timeframe is `5m` and `created_at` is within the last hour, limited to 500 rows, then fetches only 5m and 15m candles for those symbols. Thus an asset absent from the recent 5m indicator snapshot sample cannot be refreshed by this collector during that run, even if it is in the wider tracked-asset universe. This can create a coverage feedback loop if downstream early-entry candidates require those candles.

Source: [market-candle-collector at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/market-candle-collector/index.ts).

Research rule: compare the collector's selected symbol set against the intended tracked/watchlist universe and downstream candidate universe; report missing-symbol counts, age, and reason. Do not assume `stored` means broad market coverage.


## Finding F-20261020-36 — Research archive cleanup is explicitly paused in the reviewed migration sequence
**Status:** source migration fact; production migration application is unverified. **Confidence:** high for source intent, none for deployed state.

Migration `20261020182000_research_archive_capture_gate.sql` sets `research_archive_control.allow_archive=false` and records that archive writes and source deletion are paused pending storage and evidence-value review; it also drops `research_cases_source_idx`. This is a source-level safety posture, not proof of the live database's current control value or applied migration history. It also means any archive/retention workflow must not be described as actively archiving unless runtime state confirms it.

Source: [archive capture gate migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020182000_research_archive_capture_gate.sql).

Research rule: verify applied migration history and control-row values before any archive claim; keep source deletion disabled and avoid re-enabling archive writes without explicit review of storage headroom and evidence completeness.


## Finding F-20261020-37 — Early Entry variants use global row caps for per-asset context without coverage diagnostics
**Status:** source-code fact; whether limits truncate the live universe is unknown. **Confidence:** high.

The reviewed `early-entry-variants` function loads recent 1h indicators with a global limit of 2,000, recent 5m candles with a limit of 600, council signals with a limit of 500, sentiment snapshots with a limit of 500, and price snapshots with a limit of 500. The queries are ordered newest-first, then reduced to latest-per-symbol/asset in memory. When qualifying rows exceed any cap, assets with older rows may be absent from that run's candidate or confluence universe. The function does not emit per-query total counts or a coverage ratio to show whether a cap truncated the set.

Source: [early-entry-variants at reviewed source commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/early-entry-variants/index.ts).

Research rule: record eligible-row counts, distinct symbols/assets, age ranges, and cap-hit indicators for each input. Report candidate coverage against the intended watchlist and distinguish `no candidate` from `asset absent from capped input`.


## Finding F-20261020-38 — Archive safety migration trades index storage for potentially slower source-case queries
**Status:** source-code fact; runtime query impact unknown. **Confidence:** high for the index drop, none for its performance impact.

Migration `20261020182000_research_archive_capture_gate.sql` explicitly drops `public.research_cases_source_idx` while pausing archive writes pending storage/evidence review. This reduces index storage, but may increase lookup cost for queries filtering/joining research cases by source, depending on the actual query plan and table size. The source change alone does not establish whether the trade-off is material in production.

Source: [archive capture gate migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020182000_research_archive_capture_gate.sql).

Research rule: measure index size, table size, and representative source-lookup query plans/timings before considering index restoration; do not recreate the index without storage-headroom review.


## Finding F-20261020-39 — CMC paper entry has no explicit age gate for listing or watchlist snapshots
**Status:** source-code fact; actual snapshot staleness is unknown. **Confidence:** high.

`cmc-paper-open` selects the latest `dynamic_watchlist_snapshots` row and up to 1,000 `cmc_listing_snapshots` ordered by `captured_at`, but the reviewed function does not reject the watchlist by `computed_at` age or listings by `captured_at` age. It fetches Binance spot prices during the current invocation, so the price input is newly fetched while CMC momentum, volume, rank, and watchlist membership may come from older snapshots. A current spot price alone does not prove the rest of the entry context is fresh.

Source: [cmc-paper-open at the current source default branch](https://github.com/gepappas98/pixel-perfect-pixels/blob/main/supabase/functions/cmc-paper-open/index.ts).

Research rule: measure watchlist/listing snapshot ages at entry and report stale-context cases separately. Do not claim CMC momentum was contemporaneous unless timestamps demonstrate it.


## Finding F-20261020-40 — CMC paper position preflight is capped and non-atomic
**Status:** source-code fact; duplicate or missed-active-position frequency unknown. **Confidence:** high.

`cmc-paper-open` reads only the newest 1,000 CMC paper trades to build its active-position and 15-minute cooldown maps, then inserts eligible trades without a transaction that binds the preflight read to the insert. Older still-open positions can fall outside the bounded read if enough newer trades exist; overlapping invocations can pass the same preflight before either inserts. The function rechecks neither active state nor a uniqueness constraint atomically at write time.

Source: [cmc-paper-open at the current source default branch](https://github.com/gepappas98/pixel-perfect-pixels/blob/main/supabase/functions/cmc-paper-open/index.ts).

Research rule: compare all open CMC paper trades against the newest-1,000 preflight window and inspect same-symbol opens by invocation time. Treat code-level exposure as a hypothesis until runtime rows confirm incidence.


## Finding F-20261020-41 — Research knowledge materialization is invoked from the normal pipeline path
**Status:** source-code fact; whether the current deployed runtime has this exact code and the RPC applied is unverified. **Confidence:** high for source behavior.

The current source default branch's `src/lib/pipeline.server.ts` calls `refresh_research_knowledge_cases({ p_lookback_hours: 72 })` in the post-mortem section of the normal pipeline path, with an 8-second timeout. It labels the sync research-only and states that it does not feed scoring, entry gates, or execution; errors are recorded and trading continues. Nevertheless, if this version and RPC are deployed, materialization is automatic on each invocation of that pipeline path rather than strictly user-triggered. This conflicts with the operating preference that refreshes be manual and separately authorized.

Source: [pipeline.server.ts at the current source default branch](https://github.com/gepappas98/pixel-perfect-pixels/blob/main/src/lib/pipeline.server.ts).

Research/safety rule: do not invoke the refresh RPC or change cron/deployment as part of this knowledge-transfer work. Verify deployed code/RPC state and record how often the call runs. Keep manual refresh as the intended operating policy; any source change to disable or explicitly gate this call requires a separate approved change.


## Finding F-20261020-42 — Latest source project-state report confirms archive is paused, not complete
**Status:** documented production verification in source repository dated 2026-10-20; not independently re-queried live in this task. **Confidence:** high for what the report states.

The latest `PROJECT_STATE.md` reports canonical Supabase archive controls `allow_archive=false` and `allow_source_delete=false`; the existing retention schedule remains `17 3 * * *` and returns before archive/delete while the gate is off. It reports 22,150 retention-eligible source rows, 0 archived, 22,150 missing evidence, and 3,000 materialized research cases with 3,019 bounded evidence records. Of 551 V3 cases, all 551 remain open with `maturity_at IS NULL`. The documented database size is 464 MB (486,878,355 bytes), below the 480 MB warning threshold, and no retention-source rows were deleted. PR #132 is merged and the full migration chain passed ephemeral PostgreSQL integration tests. User-controlled Lovable sync/publish and deployed RPC-status verification remain pending.

Source: [PROJECT_STATE.md at source commit 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/PROJECT_STATE.md).

Research rule: distinguish source-documented production verification from an independent live query. Do not claim archival is complete, evidence coverage is sufficient, or the new pipeline hook is active in Lovable until the pending sync/runtime check is complete.


## Finding F-20261020-43 — Event→Flow decision table stores latest state per asset, not an append-only decision history
**Status:** schema and writer fact at reviewed source revision. **Confidence:** high.

Migration `20261014010000_event_flow_paper_open.sql` declares `event_flow_paper_decisions.asset` as the primary key. The function upserts every invocation with `onConflict: "asset"`, replacing that asset's current decision row. The `observed_at` and `updated_at` fields therefore describe the current/latest state, not a complete sequence of all WAITING_DATA, COOLDOWN, OPEN_FAILED, OPENED, and other decisions over time. This table alone cannot reconstruct historical gate frequencies or decision transitions.

Sources: [decision-table migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261014010000_event_flow_paper_open.sql), [Event→Flow writer](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/event-flow-paper-open/index.ts).

Research rule: label this table as a latest-state snapshot. Historical rejection-rate analysis requires a genuine append-only audit source or previously captured snapshots; never infer historical frequencies from current rows.


## Finding F-20261020-44 — Council post-mortem insert and trade completion flag are separate writes in the pipeline generator
**Status:** source-code fact for `generatePostMortems()`; actual failure/duplicate frequency unknown. **Confidence:** high.

The pipeline's `src/lib/council-learning.ts` inserts a `council_lessons` row for a closed BUY trade, then separately updates `trades.post_mortem_generated=true`. The update's returned error is not checked before incrementing `generated`. If that flag update fails after the lesson insert, the trade can remain eligible for a later post-mortem attempt. The separate Edge Function `council-lessons` has an explicit existing-`source_trade_id` check, but that does not make the main pipeline generator's two writes atomic or establish a unique database constraint.

Source: [council-learning.ts](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/council-learning.ts), [council-lessons Edge Function](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/council-lessons/index.ts).

Research rule: reconcile lesson rows by `source_trade_id` and trade flags; distinguish lesson insertion from flag-update success. Check duplicate source_trade_id counts before treating Council lesson counts as unique closed-trade examples.


## Finding F-20261020-45 — Research knowledge reads use bounded samples, not complete table scans
**Status:** source-code fact; effect on any specific view depends on the downstream consumer. **Confidence:** high.

`readKnowledge()` in `src/lib/research-knowledge.functions.ts` records exact counts but fetches only the newest 250 rows by default for each source table, and caps `research_evidence` and `research_findings` at 100 rows. It uses newest-first ordering and reports query errors separately. Any derived snapshot built from these returned arrays is a bounded recent sample, not a full historical cohort. Exact row counts can reveal that the sample is truncated, but do not supply the missing older rows.

Source: [research-knowledge.functions.ts](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/research-knowledge.functions.ts).

Research rule: preserve per-table exact counts and sample limits alongside every derived snapshot; mark truncated cohorts explicitly. Do not calculate full-history rates from the bounded sample without stratified/batched coverage.


## Finding F-20261020-46 — Early Entry taker-buy diagnostic can use an unfinished 5-minute candle
**Status:** source-code fact; outcome impact not measured. **Confidence:** high for the data path.

`market-candle-collector` requests the latest three Binance klines for each symbol/timeframe and stores all returned valid rows without filtering for `close_time <= now()`. Binance's latest kline can be the still-forming candle, whose scheduled `close_time` is in the future. `early-entry-variants` then reads 5-minute candles with `close_time >= now()-15 minutes`, orders descending by `close_time`, and retains the first row per symbol. A future close_time makes the unfinished candle the newest row; its `quote_volume` and `taker_buy_quote_volume` are partial, yet the function uses them to compute cross-sectional taker imbalance.

Sources: [market-candle-collector](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/market-candle-collector/index.ts), [early-entry-variants](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/early-entry-variants/index.ts).

Research rule: separate closed-candle and in-progress-candle metrics. Recompute historical taker imbalance using only candles with `close_time <= observation_time`, compare it with the current diagnostic, and quantify the differences before changing any gate.


## Finding F-20261020-47 — Event→Flow sentiment, flow and price inputs have global row caps across assets
**Status:** source-code fact; actual cap-hit incidence unknown. **Confidence:** high.

The `event-flow-paper-open` function queries recent RSS sentiment with `limit(100)`, flow snapshots with `limit(200)`, and price snapshots with `limit(200)`, then builds latest-per-asset maps. These are global caps across all tracked assets, not per-asset limits. If the recent snapshot row count exceeds a cap, some assets can be absent from the maps even if they have a qualifying row within the freshness window. The function fails on query errors, but a successful capped query does not report whether the intended asset universe was fully covered.

Source: [event-flow-paper-open](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/event-flow-paper-open/index.ts).

Research rule: compare exact eligible row counts and distinct assets with each cap, measure per-asset coverage, and classify absent inputs as `no recent row` versus `asset omitted by capped sample` wherever evidence permits.


## Finding F-20261020-48 — Council lesson generators classify and store PnL from different trade fields
**Status:** source-code fact; number of affected lessons unknown. **Confidence:** high.

The normal pipeline generator `src/lib/council-learning.ts` computes `pnl_pct`, win/loss/breakeven outcome, prompt PnL, and `realized_pnl` from legacy `trades.pnl`; it does not select `net_pnl`. The separate `supabase/functions/council-lessons/index.ts` calculates from `net_pnl ?? pnl`. If a trade's fee-adjusted `net_pnl` differs from `pnl`, the two generation paths can assign different outcomes and lesson PnL for the same `source_trade_id`. This makes pooled Council lesson win counts/PnL potentially non-homogeneous unless the generating path is retained as provenance.

Sources: [pipeline Council generator](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/council-learning.ts), [Council lessons Edge Function](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/council-lessons/index.ts).

Research rule: compare `pnl` versus `net_pnl` and lesson outcome/realized_pnl by `source_trade_id`; segment results by generation path where provenance exists. Do not retroactively rewrite lessons without an explicit, audited reconciliation.


## Finding F-20261020-49 — The automatic knowledge refresh is not bounded to the 72-hour window for trade evidence/cases
**Status:** source migration/code fact; runtime frequency and actual query cost not independently measured. **Confidence:** high for SQL behavior.

The pipeline calls `refresh_research_knowledge_cases({p_lookback_hours:72})` in its normal post-mortem path, with an 8-second timeout. In the reviewed `20261020182000_research_archive_capture_gate.sql` definition, the 72-hour cutoff is applied to variant candidates, but the trade evidence insert scans `public.trades` without a time predicate; composite-signal evidence is selected by existence of any linked trade; and trade cases are upserted from all `public.trades`. Thus the parameter does not bound the trade/signal evidence and trade-case work. Repeated pipeline invocation can repeatedly inspect historical rows even when no rows change. This is separate from the user policy requiring manual refresh; deployment/RPC state remains unverified.

Sources: [pipeline caller](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/pipeline.server.ts), [latest reviewed migration definition](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020182000_research_archive_capture_gate.sql).

Research rule: do not execute the RPC as part of this transfer. Before any approved activation, bound each source by an explicit incremental cursor or cutoff, measure query plans and rows touched, and separately resolve the manual-versus-automatic refresh policy.

## Finding F-20261020-50 — Later archive-gate migration redefines the refresh RPC after the V3-only batch fix
**Status:** migration-chain source fact; applied production version unverified. **Confidence:** high for source ordering and definitions.

Migration `20261020180000_research_knowledge_sync_batch_fix.sql` scopes variant materialization to `source_fingerprint like 'v3|%'`, explicitly leaving V2/Legacy untouched. The later migration `20261020182000_research_archive_capture_gate.sql` replaces the same `refresh_research_knowledge_cases(integer)` function but its variant candidate CTE no longer has that V3-only predicate; its case insert classifies V3, V2, Legacy and Unknown fingerprints. It still limits each variant candidate batch to 250, but can reintroduce non-V3 automatic materialization if this later migration is applied. This conflicts with the earlier fix's stated V3-only contract and source-state summary.

Sources: [V3-only batch fix](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020180000_research_knowledge_sync_batch_fix.sql), [later migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020182000_research_archive_capture_gate.sql).

Research rule: migration integration tests must assert the final installed function body, not only each migration independently. Verify the applied production migration version before claiming V3-only behavior; do not apply or amend migrations as part of this transfer.

## Finding F-20261020-51 — Strategy auto-switch has paths that can choose a preset below the 25-resolved benchmark threshold
**Status:** source-code fact; whether the function is enabled or invoked in production is unverified. **Confidence:** high.

The V3 Variant Comparison panel labels a preset “best” only when it has at least 25 resolved cases and positive average PnL. In `strategy-auto-switch`, the ordinary deterministic `choose()` pool admits presets with only 8 resolved cases; the subsequent AI choice is validated against the allowed preset names, but not required to have 25 resolved cases. The no-qualified-positive-preset safety path also allows a demotion target with 8 resolved cases and positive average PnL. The confirmed-Bear demotion path separately accepts an alternative with 8 cases, positive average PnL and at least 40% win rate. Therefore the panel's sample rule is not a universal auto-switch eligibility rule.

Sources: [auto-switch implementation](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/strategy-auto-switch/index.ts), [Variant Comparison panel](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/components/trading/VariantComparisonPanel.tsx).

Research rule: before any strategy-policy change, test every auto-switch branch against one explicit sample-size/positive-expectancy contract. Keep this as a source finding until deployment/configuration and invocation are verified; no production switch was performed.


## Finding F-20261020-52 — Knowledge-case PnL fallback treats legacy zero `net_pnl` as authoritative
**Status:** source-code fact; affected-row count unknown. **Confidence:** high.

The archive refresh populates trade-case PnL with `coalesce(t.net_pnl,t.pnl)`. A numeric zero is non-NULL, so rows with `net_pnl=0` and nonzero legacy `pnl` are materialized as zero PnL. The source's `risk.engine.ts` explicitly documents this historical condition: the fee migration added `net_pnl DEFAULT 0` without a valid closed-trade backfill for some legacy rows, and its `realizedPnlValue()` falls back to legacy `pnl` when net PnL is zero but legacy PnL is nonzero. The research-case materializer does not apply that fallback.

Sources: [research-case migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020182000_research_archive_capture_gate.sql), [risk PnL compatibility logic](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/lib/risk.engine.ts), [fee migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/drizzle/migrations/0005_trading_fees.sql).

Research rule: read-only quantify closed trades with `net_pnl=0 AND pnl<>0`; compare case PnL with the established fee-aware fallback, but do not rewrite source rows or archived cases until a documented reconciliation policy is approved.

## Finding F-20261020-53 — Archive integration fixture cannot detect the V3-only migration regression
**Status:** test-fixture fact. **Confidence:** high.

`supabase/tests/research_knowledge_archive.integration.sql` applies migrations in order, including both the V3-only batch fix and the later archive-gate migration, but its `strategy_variant_signals` fixtures contain only two `v3|` fingerprints. It therefore cannot reveal that the later function definition also admits V2, Legacy and Unknown fingerprints. The current test may pass while the final migration has broadened the variant scope.

Source: [archive integration test](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/tests/research_knowledge_archive.integration.sql).

Research rule: add disposable V2, Legacy, Unknown and V3 fixtures with explicit assertions on which rows the final function materializes; test the final installed function after the full migration chain.

## Finding F-20261020-54 — Trade-case `outcome` stores lifecycle status, not economic win/loss
**Status:** source-code fact; downstream consumer impact depends on aggregation logic. **Confidence:** high.

The research-case refresh sets trade-case `outcome` to `coalesce(t.status,'unknown')`, so both profitable and losing closed trades are labeled `closed`; the PnL sign remains a separate field. Variant cases instead use economic labels such as `win`, `loss`, `expired`, or `open`. Any combined case analysis that treats `outcome` as a common win/loss label will misclassify or omit paper-trade cases unless it branches on `source_table` or derives economic outcome from validated PnL/close reason.

Source: [research-case refresh migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020182000_research_archive_capture_gate.sql).

Research rule: keep lifecycle status and economic outcome as distinct dimensions. For trades, derive win/loss/breakeven only after validating PnL basis and missing values; never silently combine the current `outcome` field across source tables.


## Finding F-20261020-55 — Early Entry B/C use a +6% take-profit, not the common +4% benchmark
**Status:** source-code fact; this may be an intentional experiment setting. **Confidence:** high.

The direct paper-trade insert in `early-entry-variants` sets `take_profit = entry_price * 1.06`, `stop_loss = entry_price * 0.97`, and notional $1,000. This differs from the V3 benchmark contract of TP +4% / SL −3% / 72-hour maximum hold, and from Event→Flow's +4% / −3% setup. Trade-exit logic applies configured max-hold/stale-exit settings to open paper trades, but the B/C entry function does not pin or snapshot those exit settings on each entry. Thus realized outcomes can reflect a different TP and whatever exit settings are active at close, rather than the fixed V3 benchmark. This is not automatically a defect; it must be treated as a separate experimental policy unless deliberate parity is confirmed.

Sources: [Early Entry B/C paper opener](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/early-entry-variants/index.ts), [shared paper exit policy](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/_shared/trade-exit.ts).

Research rule: store/derive the actual TP, SL, max-hold and stale-exit policy per entry cohort; never pool B/C outcomes with V3 benchmark results as if exit assumptions were identical.

## Finding F-20261020-56 — V3 performance RPC counts terminal outcome labels without requiring a resolution timestamp
**Status:** SQL contract fact; inconsistent-row count unknown. **Confidence:** high.

`get_variant_performance_v3` counts `win`, `loss`, and `expired` outcomes as resolved solely from the `outcome` value; it does not require `resolved_at IS NOT NULL`. The research-case materializer, in contrast, sets `maturity_at` only when one of those terminal labels and a non-null `resolved_at` are both present. If any inconsistent rows exist, dashboard/RPC aggregates can treat them as resolved while the knowledge-case maturity contract does not. Normal resolver updates set outcome and resolved_at together, so this is an invariant check rather than evidence of current bad rows.

Source: [V3 benchmark RPC migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261018120000_variant_benchmark_v3.sql).

Research rule: count terminal-labelled V3 rows with null `resolved_at` and non-terminal rows with non-null `resolved_at`; report any mismatches separately before trusting cross-surface resolved counts.


## Finding F-20261020-57 — Live archive status is 41,465 eligible sources, zero archived, all missing evidence
**Status:** direct read-only production query on canonical Supabase project `yckewtpfttvwiptmmrfq`, approximately 2026-10-20 15:28 UTC. **Confidence:** high for snapshot.

The live `research_archive_control` row has `allow_archive=false` and `allow_source_delete=false`. `get_research_archive_status(72,168)` reports `status=incomplete`, 41,465 eligible sources, 0 archived, 41,465 missing. By source: asset prices 13,020; asset flow 13,020; asset sentiment 10,789; whale-flow snapshots 1,939; whale-flow transitions 750; transition context 750; shock followups 745; asset news 445; event-flow transmissions 7. No archive or deletion was performed. This supersedes the older source-documented 22,150 count; the old snapshot was stale or from a different observation point.

Research rule: keep both controls disabled. Re-check counts only with aggregate read-only queries and do not equate a generated research case with retention-source archival.

## Finding F-20261020-58 — Live V3 knowledge-case coverage is incomplete and 73 terminal outcomes are stale or missing
**Status:** direct read-only production aggregate, approximately 2026-10-20 15:28 UTC. **Confidence:** high for snapshot.

The live source has 2,115 V3 fingerprint rows, all created in the last 72 hours: 2,042 open and 73 terminal (37 losses, 36 wins). The `research_cases` table has only 551 V3 cases, all labelled open, leaving 1,564 source rows without a matching V3 case. Of the 73 terminal source rows, 54 have a matching case that is still incorrectly `open` with stale resolution fields, and 19 have no case at all. This is an observed materialization mismatch, not merely a code-path risk.

The live function body is V3-only, but its last materialized V3 case update is 2026-10-19 22:35:15 UTC despite continued pipeline runs on 2026-10-20. Do not use V3 `research_cases` as a complete resolved-outcome source until the mismatch is reconciled.

## Finding F-20261020-59 — Live paper-trade cases lag source trades
**Status:** direct read-only production aggregate, approximately 2026-10-20 15:30 UTC. **Confidence:** high for snapshot.

The source `trades` table contains 258 rows (220 closed, 38 open), but there are only 199 matching `research_cases` rows: 59 trades have no case (36 closed, 23 open), and 20 existing trade cases disagree with source status, PnL or `closed_at`. The latest missing closed trade was created at 2026-10-20 14:40:39 UTC; the latest source trade was created at 15:30:36 UTC. `research_evidence` contains 199 trade-source evidence rows, consistent with the incomplete case coverage. The zero-net-PnL compatibility check found 0 of 220 closed trades with `net_pnl=0` and nonzero legacy `pnl`, so F-52's legacy-zero scenario was not observed in this snapshot.

Research rule: reconcile by stable source IDs and compare status, `resolved_at`, outcome and PnL basis. Do not bulk-refresh or rewrite cases until the approved manual-refresh workflow is settled.

## Finding F-20261020-60 — Applied migration history and active production refresh function differ from the checked-in migration definition
**Status:** direct read-only production inspection plus source comparison. **Confidence:** high that the bodies differ; reason unknown.

Supabase migration history lists the archive capture-gate migration as applied. However, `pg_get_functiondef('public.refresh_research_knowledge_cases(integer)')` on the live database shows a V3-only variant filter and returns `variant_scope='V3 only; V2/Legacy remain in source table and are not duplicated by this automatic refresh'`. The checked-in `20261020182000_research_archive_capture_gate.sql` defines the same function without that V3-only filter and classifies V2/Legacy/Unknown variants. Thus the active function does not match the checked-in definition of the migration recorded as applied. A later manual/hotfix change or source/migration drift is possible; the mechanism is not established.

Research rule: treat the live function definition as runtime truth. Preserve the discrepancy and inspect the migration ledger/diffs before any future migration work; do not reapply the migration.

## Finding F-20261020-61 — Knowledge-refresh telemetry is absent from recent pipeline rows while case/evidence materialization is stale
**Status:** live pipeline row inspection plus source-code comparison; exact refresh invocation count is unknown. **Confidence:** high for observed absence/staleness.

Recent pipeline runs continue at approximately 10-minute intervals through 2026-10-20 15:30 UTC, but their persisted `pipeline_runs.result` objects do not contain `research_knowledge_sync`. The source `pipeline.server.ts` writes that field into `result`; the orchestrator's final update replaces the `result` JSON with a new object containing stages and execution audit but omits the sync field. Meanwhile, the latest research-evidence capture is 2026-10-19 22:35:15 UTC and the V3/trade case coverage gaps above remain. The database therefore does not provide reliable per-run proof that the refresh succeeded, failed, or ran.

Research rule: fix/verify telemetry persistence only in an explicitly approved source change. Until then, report refresh status as unobservable from `pipeline_runs`, and infer no successful refresh from a top-level pipeline `completed` status.


## Finding F-20261020-62 — Live 50-run execution audit covers only 46 of 135 eligible BUY signals
**Status:** direct read-only aggregate of the latest 50 completed `pipeline_runs`, from 2026-10-20 07:20 to 15:30 UTC. **Confidence:** high for recorded telemetry; audit is known to be incomplete.

Across those 50 runs, the stored audit summary reports 135 eligible BUY signals, 46 audited eligible signals and 89 uncovered eligible signals: recorded audit coverage is 34.07%. Four runs had eligible BUY signals but zero audited eligible signals. All 50 rows had an `execution_audit` object, so this is not simply a missing-object issue; it is incomplete per-signal coverage. This supports the existing code findings about selective audit events and paper research-mode bypasses, but does not identify the cause of each uncovered signal.

Research rule: report `eligible`, `audited`, and `uncovered` together per run and over the full sample. Do not infer that an eligible signal passed every normal risk gate from the absence of a rejection event.

## Finding F-20261020-63 — Recorded live rejection events show micro-data and per-symbol-cap friction
**Status:** direct read-only aggregate of events stored in the same latest 50 completed pipeline runs. **Confidence:** high for recorded events only, not complete candidate-level rates.

The audit contains 249 recorded events: 114 `QUALITY_GATE / confidence_below_minimum`; 75 `PER_SYMBOL_CAP / max_exposure_reached: 1/1`; 27 `CANDIDATE_FILTER / duplicate_composite_signal`; 19 `CANDIDATE_FILTER / eligible BUY accepted in paper research mode`; 7 `MICRO_TF_GATE / MICRO_DATA_NOT_READY` (6 stale 5m/15m snapshots and 1 missing 5m/15m); 4 micro-pressure cautions; and 3 sideways-market rejections where whale net flow was −5.51% against the required >+5%. No recorded ERROR events appeared in this sample. Because 89 eligible BUY signals were uncovered by the audit, these are counts of recorded events, not exhaustive gate frequencies.

Research rule: prioritize read-only per-stage coverage and freshness measurements before altering gates. Do not relax confidence, micro-timeframe, symbol-cap, or sideways thresholds based on these counts alone.


## Finding F-20261020-64 — Archive-status `last_archive_at` is sourced from all research evidence, not retention archives
**Status:** SQL contract and live output confirmed. **Confidence:** high.

`get_research_archive_status` returns `last_archive_at = max(captured_at)` across the entire `research_evidence` table, without filtering to the nine retention-source tables. In the live snapshot, the function reported `last_archive_at=2026-10-19 22:35:15 UTC` while simultaneously reporting `archived_sources=0` and `archive_enabled=false`. The timestamp corresponds to general research evidence materialization and does not establish that retention-source archival occurred.

Source: [archive status function in the capture-gate migration](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/migrations/20261020182000_research_archive_capture_gate.sql).

Research rule: report the latest capture timestamp for the explicit retention-source set separately from general research evidence. Never present `last_archive_at` alone as proof of archival activity.


## Finding F-20261020-65 — Live storage guard is latched as triggered, but all listed cron jobs are currently active
**Status:** direct read-only production inspection of private guard state, function definition and `cron.job`, approximately 2026-10-20 15:31 UTC. **Confidence:** high.

`private.storage_capacity_guard_state` records `triggered_at=2026-10-11 03:56:00 UTC`, `measured_bytes=480,021,651`, `threshold_bytes=480,000,000`, and lists six jobs as paused, including `trading-pipeline-orchestrator`. Yet the live `cron.job` rows show all six listed jobs active: orchestrator, event-flow-lab-collector, event-flow-lab-discovery, social-source-collector-sweep, research-whale-wave-readiness, and research-lab-data-readiness. The current database is 529,591,443 bytes (505.06 MiB), above the guard threshold. The active `private.enforce_storage_capacity_guard()` function returns `already_paused` immediately whenever `triggered_at IS NOT NULL`; it does not reconcile the current active state of those jobs. Thus the persisted guard state no longer matches actual cron state, and the guard's one-time latch would not re-disable reactivated jobs.

The same guard's configured list excludes `market-candle-collector` and `early-entry-variants`; both are currently active at 10-minute intervals. This is a control-state discrepancy, not authorization to pause jobs in this research transfer.

Research rule: do not alter cron jobs or reset guard state here. Preserve this as a high-priority operational issue for explicit owner decision; any remediation should reconcile the intended pause policy, current job state and guard re-entry semantics.

## Finding F-20261020-66 — Live database exceeds the 480,000,000-byte storage threshold; largest tables are research/telemetry-heavy
**Status:** direct read-only production size snapshot, approximately 2026-10-20 15:31 UTC. **Confidence:** high for reported relation sizes.

`pg_database_size(current_database())` reports 529,591,443 bytes (505.06 MiB), 49,591,443 bytes above the configured 480,000,000-byte threshold. Largest measured table-plus-index footprints include `strategy_shadow_diagnostics` 95.98 MiB, `composite_signals` 78.63 MiB, `strategy_variant_signals` 41.99 MiB, `pipeline_runs` 36.30 MiB, `whale_alerts` 35.09 MiB, `market_candles` 30.34 MiB, and `accumulation_shadow_observations` 25.51 MiB. `research_evidence` is 1.95 MiB and `research_cases` 1.48 MiB; the archive backlog itself is not the largest measured storage consumer yet.

Research rule: prioritize read-only per-table/index size trends and retention/value analysis. Do not delete source rows, change retention, or pause cron as part of this transfer. Note that `pg_stat_user_tables` tuple estimates were inconsistent with earlier exact counts and should not be used as authoritative row counts.


## Finding F-20261020-67 — Storage watchdog is disabled and database size has risen above threshold again
**Status:** direct read-only production snapshot history, approximately 2026-10-20 15:31 UTC. **Confidence:** high for recorded snapshots.

The `cron.job` row for `storage-capacity-watchdog` (job 15, intended every minute) is `active=false`. Hourly `private.storage_size_snapshots` show 477,818,003 bytes at 2026-10-19 21:13 UTC and 482,217,107 bytes at 22:13 UTC, crossing the 480,000,000-byte threshold between those snapshots. The latest saved hourly snapshot at 2026-10-20 15:13 UTC is 526,970,003 bytes; the direct database-size query at ~15:31 UTC is 529,591,443 bytes. From the 2026-10-19 16:13 snapshot (462,163,091 bytes) to 2026-10-20 15:13, net size increased by 64,806,912 bytes in 23 hours, despite interim fluctuations.

The guard's old `triggered_at` remains latched from 2026-10-11 and its watchdog cron is inactive, so there is no active scheduled enforcement to notice the later re-crossing. Do not reactivate, pause, or reschedule the watchdog as part of this research transfer; record for explicit owner decision.


## Finding F-20261020-68 — Live repeated-BUY research ledger remains 98.7% unresolved
**Status:** direct read-only production aggregate, approximately 2026-10-20 15:31 UTC. **Confidence:** high for current row counts.

`repeated_buy_research_ledger` has 2,729 rows: 2,694 with `net_pnl IS NULL` (98.72%), 27 negative-PnL rows and 8 positive-PnL rows; non-null PnL sums to −$355.78. The newest entries are current through 2026-10-20 15:30 UTC. The 35 non-null outcomes are too few, and the unresolved share too high, to treat the ledger as a reliable strategy verdict. Null outcomes must remain unresolved, not be imputed as zero or classified as losses.

Research rule: analyze outcome maturity and missingness by entry cohort/source before interpreting the 35 resolved values; preserve all ledger rows.

## Finding F-20261020-69 — Exact live row counts confirm large telemetry tables dominate storage
**Status:** direct read-only production `count(*)` queries, approximately 2026-10-20 15:31 UTC. **Confidence:** high for snapshot counts.

Exact counts include `strategy_shadow_diagnostics` 114,933 rows (~95.98 MiB including indexes), `composite_signals` 16,810 (~78.63 MiB), `strategy_variant_signals` 67,867 (~41.99 MiB), `pipeline_runs` 882 (~36.30 MiB), `whale_alerts` 60,251 (~35.09 MiB), `market_candles` 92,377 (~30.34 MiB), and `accumulation_shadow_observations` 57,317 (~25.51 MiB). These exact counts differ materially from `pg_stat_user_tables.n_live_tup` estimates for several tables; use exact counts for row totals and relation-size measurements for storage, not stale tuple estimates.

Research rule: evaluate each table's retention value, uniqueness and re-computability independently before any owner-approved cleanup. No deletion or retention change was made.


## Finding F-20261020-70 — Proposed retention archive does not target the largest live storage consumers
**Status:** source migration table scope compared with direct live relation-size snapshot. **Confidence:** high.

The nine-table `archive_research_retention_sources` scope covers price/flow/sentiment/news snapshots, event-flow transmissions, whale-flow followups, transition context, transitions and whale-flow snapshots. It does not include the largest measured live consumers: `strategy_shadow_diagnostics` (~95.98 MiB), `composite_signals` (~78.63 MiB), `strategy_variant_signals` (~41.99 MiB), `pipeline_runs` (~36.30 MiB), `whale_alerts` (~35.09 MiB), `market_candles` (~30.34 MiB), or `accumulation_shadow_observations` (~25.51 MiB). Therefore enabling the current retention archive alone would not directly address the dominant measured table footprints; it also must not be enabled merely to chase the size threshold.

Research rule: map per-table growth, reproducibility, strategy/evidence value, and existing retention rules for the largest tables first. Any retention or deletion proposal requires explicit owner approval and a verified recovery/evidence plan; no rows were deleted.


## Finding F-20261020-71 — Early-entry decision records do not directly prove candle-close alignment
**Status:** live read-only audit, 2026-10-20 ~18:40 UTC. **Confidence:** high for the observability gap; no conclusion about look-ahead is asserted.

The live `early_entry_variant_decisions` table records per-variant decisions and a JSON metrics object. Recent records expose `taker_buy_imbalance_5m`, `taker_buy_z`, `candle_symbols`, `breadth_1h`, `whale_delta`, `whale_net`, `whale_turn`, `regime_at_signal`, and `transition_sequence_distribution_neutral_accumulation`. However, the decision record does not expose a normalized source-candle ID or an explicit per-timeframe candle `open_time/close_time/captured_at` tuple. A direct time-window join to the latest 5m candle rows did not establish a valid one-to-one candle lineage, so it cannot prove that every input candle was closed when each decision was made.

Research rule: treat candle-close/look-ahead status as **unverified**, not as a confirmed defect or a clean bill of health. Next inspect the exact early-entry collector/scorer code path and the meaning/contents of `metrics.candle_symbols`; if lineage is still unavailable, add source timestamps/closed-candle eligibility to research telemetry before drawing a conclusion. No production code, schema, cron, or strategy was changed.


## Finding F-20261020-72 — Early-entry evaluators can consume an unfinished 5m candle
**Status:** confirmed by source-code path inspection plus live read-only evidence, 2026-10-20 ~15:46 UTC. **Confidence:** high.

Source path in `gepappas98/pixel-perfect-pixels` main:
- `supabase/functions/market-candle-collector/index.ts` fetches the last three Binance Spot klines and maps/upserts every returned row, including the current kline; it does not filter rows by `close_time <= captured_at` or the current time before upsert.
- `supabase/functions/early-entry-variants/index.ts` selects 5m candles with `close_time >= now - 15 minutes`, orders descending by `close_time`, and takes the first row per symbol. There is no upper-bound predicate `close_time <= now`, so a forming candle with a future close time can win the “latest” selection. Its taker-buy quote volume feeds `taker_buy_imbalance_5m`, B/C eligibility, and candidate ranking/selection.
- `supabase/functions/early-entry-regime/index.ts` uses the same lower-bound-only pattern for 5m candles; taker-buy imbalance feeds the score/diagnostics and candidate prioritization.

Live evidence from the canonical source database: among candle rows captured in the preceding 30 minutes, 55 5m rows and 56 15m rows had `close_time > captured_at`, directly confirming that the collector persisted candles while they were still forming. At the audit instant, zero rows had `close_time > now()` because the newest candle interval had since elapsed; this does not negate the capture-time evidence. The earlier decision-to-candle join was inconclusive because decision telemetry does not retain a candle ID or its timestamps.

Impact: intrabar volume/taker-buy fields can change before close and be treated as if they were final. This creates a confirmed temporal-integrity/look-ahead risk in the early-entry evidence, though this audit does not quantify how many historical decisions or trades were affected.

Recommended corrective design (not applied): filter upstream collector results to closed candles only (`close_time <= captured_at`, with a conservative completion buffer if needed) and enforce `close_time <= evaluation_time` in both evaluators; record evaluation time and per-timeframe source candle open/close/capture timestamps in decision metrics. Add regression tests for forming-candle rejection and boundary conditions. No production code, database rows, schema, cron, strategy, or deployment was changed in this audit.


## F-20261020-73 — Production fix deployed: reject unfinished early-entry candles (2026-10-20)

**Status:** Production Edge Functions deployed; source committed to `gepappas98/pixel-perfect-pixels/main`; code-level regression checks passed (13/13).

### Production change
- `market-candle-collector` deployed as version 3: Binance kline rows are filtered before upsert with strict `close_time < capturedAt`. An open candle and a candle exactly at the close-time boundary are not written by this collector.
- `early-entry-variants` deployed as version 8 (version 7 was immediately replaced after CI exposed a duplicate metadata-key type error; the removal was behavior-neutral): the 5m candle query requires `close_time < evaluationAt` and `captured_at <= evaluationAt`; a second in-memory timestamp guard repeats those checks before selecting the latest row per symbol.
- `early-entry-regime` deployed as version 13: the 5m candle query applies the same strict bounds and repeats them in memory.
- The evaluators now record evaluation time and latest selected candle close/capture timestamps in their diagnostic metrics. No other strategy gates, thresholds, entry sizing, exits, or cron schedules were changed. No exchange/live orders are enabled.

### Verification
- Re-read the deployed function definitions: versions 3, 8, and 13 are ACTIVE and contain the expected timestamp predicates.
- Code-level assertions: 13/13 passed. GitHub Actions run [39453060338](https://github.com/gepappas98/pixel-perfect-pixels/actions/runs/39453060338) succeeded: all three target functions type-checked, and the Deno candle-integrity suite passed 6/6 tests covering equality boundaries, just-closed candles, delayed capture, unfinished candles, and source/query guards.
- The two active cron jobs remain on their existing `*/10 * * * *` schedule (`market-candle-collector`, `early-entry-variants`). No schedule changes were made.
- Runtime verification after the first post-deployment scheduled run at 2026-10-20 16:00 UTC: cron jobs 19 (collector) and 21 (variants) both reported `succeeded`. The first scheduled run refreshed 110 rows for each timeframe. A later cumulative read-only audit covering all rows captured at/after deployment found 218 rows on 5m and 112 on 15m; zero had `captured_at < close_time`, and zero had `close_time >= now()` at audit time. The only early-capture rows in the rolling 30-minute window were captured at 15:50 UTC, before deployment. Pre-deployment rows remain in the table; downstream evaluators reject them if their close/capture timestamps fail the evaluation-time bounds. No historical rows were deleted or rewritten.

### Historical impact audit (do not relabel trades)
The current telemetry cannot link a decision to a specific candle `open_time`, `close_time`, `captured_at`, or immutable source-row ID. Therefore an exact count of decisions/entries that actually consumed unfinished candles **cannot be proven from retained evidence**; do not mark any historical trade invalid or change outcomes.

Observed historical population before deployment (cut-off 2026-10-20 15:56 UTC):
- `early_entry_variant_decisions`: 2,528 decisions lacked `candle_evaluation_at`: A_CURRENT 833 NO_ENTRY + 19 PAPER_OPEN; B_EARLY_REVERSAL 838 NO_ENTRY; C_ADAPTIVE_REVERSAL 838 NO_ENTRY.
- `trades` with `mode='paper'` and `entry_source='early_entry_regime'`: 19 entries existed before the fix, 12 closed and 7 open at the cut-off (current statuses may change as paper trading continues).
- These are **potentially exposed populations**, not counts proven to have consumed unfinished candles. Since pre-fix decision records lack immutable candle IDs and per-input timestamps, the exact contaminated count remains unknown.
- No historical trades, decision rows, source candles, PnL, or statuses were changed.

Source commits on `pixel-perfect-pixels/main`: `e0d76fa84bb618b8b05da12edfdebf4b4bed3fd8` (collector), `c60d0dd282bcaf71c8a10c5be45ef8e8978a1e86` (variants), `a7fe43359650e06a57496fda504d7215a0c70145` (regime), `0617f1e8220d4eb0d0c467ca485cf3d8e872fd33` (duplicate-key cleanup), `1e71f9c2e22154cb27190314ee1bd995cab0a237` (Deno tests), `e51edb5c55e9eca1dda8953877b707f568342056` (remove obsolete test extension), and `09e76675c3a0e24877f0c1a7d2de97c06cc9f5e9` (CI read permission).


Baseline runtime verification — 2026-10-20 16:32 UTC: the 16:00 orchestrator run stopped at `whale-watch` HTTP 500 before reaching `early-entry-regime`; this was not a candle-integrity failure. Successful orchestrator cycles at 16:20 and 16:30 subsequently invoked the deployed baseline function with HTTP 200 and `status=observed`, `opened_count=0`, and no entry errors. At 16:30, `evaluation_at=16:30:22.034Z`, `latest_close_time=16:29:59.999Z`, and `latest_captured_at=16:30:11.256Z`; both timestamp bounds held. Breadth improvement and positive whale turn were false, explaining the zero entries under unchanged gates. No manual invocation was used.


## F-20261020-74 — Stagger variant evaluation after candle collection (2026-10-20)

**Status:** Production cron offset applied; first post-change scheduled run requires runtime verification. **Scope:** scheduling only; strategy logic unchanged.

### Confirmed race
The `market-candle-collector` (job 19) and `early-entry-variants` (job 21) were both scheduled on `*/10 * * * *`. At 16:20 UTC, both cron requests were dispatched at approximately the same instant. The variants evaluator recorded `evaluation_at=2026-10-20T16:20:01.277Z` but used the newest available 5m candle with `close_time=16:09:59.999Z` and `captured_at=16:10:09.994Z`, approximately 10 minutes old. The collector subsequently stored the candle closed at `16:19:59.999Z`, captured at `16:20:11.182Z`. This was not a look-ahead violation: both timestamps passed the guards. It was a scheduling race that delayed variant evidence by one collection interval.

The orchestrated baseline `early-entry-regime` is different: it runs later, after ingestion and signal synthesis. Its 16:20 evaluation at `16:20:38.978Z` used the 5m candle closed at `16:19:59.999Z`, captured at `16:20:11.182Z`, satisfying both time bounds.

### Narrow production correction
- Left collector job 19 unchanged at `*/10 * * * *`.
- Changed only variant job 21 to `1-59/10 * * * *` (minute 1, 11, 21, 31, 41, 51), placing its evaluation one minute after the collector's scheduled request.
- Applied and read back the schedule at 2026-10-20 16:30:01 UTC. The first expected post-change variant run is 16:31 UTC; runtime confirmation is pending at the time of this record.
- No source-code gates, thresholds, position sizing, TP/SL, entry logic, other cron schedules, historical rows or trade outcomes were changed.

### Post-deployment data check
At the 16:30 UTC read, rows captured since the 15:56 UTC deploy cut-off totaled 322 for 5m and 164 for 15m; zero rows were captured before `close_time`, and zero had `close_time >= now()`. The active collector source was `binance-spot-klines`. The early-entry evaluators consume 5m candles; the 15m figures verify collector integrity, not direct evaluator consumption.

### Required follow-up
After the first staggered run, verify that the variant metrics show a current closed candle captured before evaluation, with capture age materially below the previous ~9.8 minutes; confirm job 21 remains active and that all A/B/C decisions still record evaluation/candle timestamps. This is a freshness check only; do not change gates based on the result. Historical contamination remains unquantifiable, and no retrospective trade reclassification is permitted.


### F-20261020-74 runtime verification — passed at 16:31 UTC
The first scheduled run after the offset succeeded: cron job 21 started at `16:31:00.396Z`; all three variant decisions were recorded at approximately 16:31:02 UTC with `evaluation_at=16:31:00.661Z`, `candle_latest_close_time=16:29:59.999Z`, and `candle_latest_captured_at=16:30:11.256Z`. The close lag fell from ~10.02 minutes to 1.01 minutes, and capture age fell from ~9.85 minutes to 0.82 minutes. A/B/C each recorded `NO_ENTRY`; the schedule change did not itself force an entry. Job 21 remains active on `1-59/10 * * * *`; collector job 19 remains active on `*/10 * * * *`. The collector now has 426 post-deploy 5m rows and 217 post-deploy 15m rows, with zero captured before close. This validates the targeted freshness correction for the first offset cycle; continue monitoring subsequent cycles for stability.


### Follow-up live audit at 16:32 UTC
The 16:31 offset variant run succeeded. All three A/B/C decisions used the candle closed at 16:29:59.999Z and captured at 16:30:11.256Z before evaluation at 16:31:00.661Z; close lag was 1.01 minutes and capture age 0.82 minutes, compared with ~10.02 and ~9.85 minutes on the previous aligned schedule. The latest read found 643 post-deploy candle rows across 5m/15m with zero captured before close and zero still unclosed. No new early-entry paper trades were present after the deploy cut-off. This validates the first offset cycle; subsequent scheduled cycles still merit passive monitoring.


### Post-deploy decision and historical metadata reconciliation — 2026-10-20 16:32 UTC
A read-only aggregate over all variant decisions since the 15:56 UTC deploy cut-off found 12 decisions: four per variant (A_CURRENT, B_EARLY_REVERSAL, C_ADAPTIVE_REVERSAL). All 12 had non-null evaluation, latest-close and latest-capture timestamps; all 12 passed `latest_close_time < evaluation_at` and `latest_captured_at <= evaluation_at`. All 12 were `NO_ENTRY`; no variant paper entries or baseline Early Entry paper trades were created after the cut-off. Candle collector audit at 16:32 found 426 post-deploy 5m rows and 217 post-deploy 15m rows, with zero captured before close and zero still unclosed at query time.

The historical trade metadata check also found that all 19 pre-deploy `early_entry_regime` paper trades had `gate_diagnostics`, but **0/19** retained `candle_evaluation_at`, `candle_latest_close_time`, `candle_latest_captured_at`, or per-candle source references. Thus these diagnostics explain strategy gates but cannot prove which candle each entry consumed. Exact historical contamination remains unknown; no historical trades or outcomes were modified.


### Gate explanation after the offset — 16:31 UTC
The fresher 5m data also explains the variant outcome without changing any gate: 53 candle symbols were available, whale turn was true, but aggregate 5m taker-buy imbalance was `-0.1512` and 1h bullish breadth delta was `0` (`breadth_improving=false`). Thus B failed its positive-taker-buy and improving-breadth requirements; C failed its positive taker-buy / adaptive reversal conditions. A observed no baseline paper trade. These are single-window gate diagnostics, not a profitability conclusion.
