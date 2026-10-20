# Intelligent Research Lab — Research Knowledge Ledger

**Status:** first consolidated knowledge transfer; documentation-only; 2026-10-20  
**Source project:** `gepappas98/pixel-perfect-pixels` / Trading Command Center research work  
**Destination repository:** `gepappas98/intelligent-research-lab`  
**Important:** This file transfers the accumulated *research specification and lessons* into IRL. It is not a database dump and does not claim that production rows have been imported. Every metric below is time-bound and must retain its source timestamp/cohort when later ingested.

## 1. Purpose and operating rules

IRL is a separate research laboratory for learning which signals, tactics and strategy variants merit further testing. It is not an execution engine and not proof of a stable paper-trading edge.

- Keep source systems read-only during discovery and export.
- Do not write to TCC execution tables, place orders, switch strategies automatically, or alter the source application's runtime from IRL.
- Preserve all source rows, IDs, timestamps, paper executions, open positions, strategy definitions and historical results. Never use source deletion as a space-management shortcut.
- No look-ahead: features available after the decision time cannot be entry evidence.
- Do not pool Legacy, V2 and V3 cohorts without explicit compatibility checks and versioned scorer/evaluator metadata.
- Preserve raw source timestamps and their semantics; do not rename `created_at` to “event time” or “available time” without producer-level evidence.
- Treat each observation as research evidence with provenance, not as a recommendation or proven edge.
- Do not ingest large raw `pipeline_runs.result` JSON blobs into the knowledge pipeline. Extract bounded, versioned fields and retain source pointers/hashes.
- All ingestion must be idempotent and append-only for initial snapshots and outcome events. A correction is a new version/event, not a silent rewrite.
- Mark missing, ambiguous, immature, censored and invalid observations explicitly; do not convert missingness into a negative label.
- Any source cleanup/rollback is a separate, reviewed operation with verified export/recovery and dependency tests. This ledger does not authorize it.

## 2. Trading/research environment captured from project history

These are recorded configuration assumptions from earlier project work, not necessarily the current live settings. Re-read current source config before using them in a reproducible run.

- Paper environment: Binance Spot, long-only; SELL signals are skipped by a `LONG_ONLY` rule. Live orders disabled.
- Reference equity of $20,000 is an accounting reference, not a cash balance or hard position cap.
- Historical paper entry sizing was commonly $1,000 per open.
- Benchmark horizon/exit assumptions: take profit +4%, stop loss -3%, expiry at 72 hours. These are benchmark rules, not realized performance.
- A separate Flow Lab Paper OPEN experiment used the same TP/SL but a 6-hour cooldown.
- Historical defaults included stop-risk $30, maximum 3 open positions and $240/day cap; later research changes experimented with per-symbol caps and reduced repeated losses. Verify exact version before comparing cohorts.
- Composite BUY/SELL thresholds were historically +1.5 / -1.5, with an MTF gate of 2 of 3. These must be versioned; do not assume all variants use the same scoring formula.
- Multiple same-symbol research positions were intentionally acceptable in earlier experiments, but later risk-control work added per-symbol caps. Record the configuration per cohort; do not conflate the two policies.
- Research goal: learn from paper results; do not describe the system as a validated or stable profitable edge.

## 3. Cohort and evaluation contract

### Legacy, V2 and V3 are separate experiments

- **Legacy:** historical benchmark and strategy outputs with older cohort definitions and deduplication. Preserve for historical audit only; do not use as the default source of current performance.
- **V2:** deduplicated variant benchmark cohort introduced around migration `20261012173000_variant_benchmark_cohorts.sql`. Historical snapshots varied by capture time; one later view showed 2,568 resolved and 3,573 open variant observations. These counts are not timeless.
- **V3:** aligned-MTF scoring cohort, intended to bring variant scoring into line with the live scorer. At one recent view, “Variant Performance (7d)” displayed 0 resolved; this indicates insufficient resolved data for that view, not zero predictive value.
- V3 identity was associated with a fingerprint convention like `source_fingerprint LIKE 'v3|%'`; confirm the current field and producer before relying on this convention.
- The strategy auto-switch policy was intended to demote only, and required at least 25 resolved observations plus positive average PnL for an eligible preset. IRL must evaluate this policy offline; do not implement an execution switch in IRL.
- Compare like with like: same entry timing, candle source, fee/slippage assumptions, TP/SL/expiry, scorer version, evaluator version, and maturity rules.
- Outcomes must be evaluated only after the declared horizon or a legitimate terminal exit. Open and immature samples remain unresolved, not losses.
- Report sample size, win rate, mean/median return, total PnL, drawdown, exposure, fee assumptions, unresolved fraction and confidence/uncertainty together. A high win rate alone is not enough.

### Historical V2 example — preserve as a dated snapshot, not a current result

One prior deduplicated V2 read reported:
- 2,568 resolved / 3,573 open variant observations.
- Accumulation: 1,122 resolved, 311 wins / 811 losses, ~28% win rate, average return about -1.06%, aggregate PnL about -$11,890 under the then-current benchmark.
- SMC / Bollinger Bands / VWAP family: approximately 17% win rate in that same report.
These values show why cohort definitions, entry timestamps and outcome maturity need audit. They do not prove all strategies or future versions will perform similarly. Store the original query/version/time window when importing them.

Earlier legacy views differed substantially (for example, 223 resolved / 535 open and a small Accumulation sample). Do not merge those counts with V2.

## 4. Strategy and research hypothesis catalogue

Each item is a hypothesis to test, not a validated trading rule.

### A. MTF-aligned trend scoring
- Timeframes of interest: 5m, 15m, 1h, 4h and 1d.
- A prior production path originally emitted 1h/4h/1d; subsequent work added 5m/15m snapshots with Binance primary and Bybit fallback.
- Historical implementation notes: kline limit 100, request timeout 8 seconds, concurrency 25; symbol normalization included MATIC → POL and RNDR → RENDER. Re-check current code.
- Research question: whether the live scorer and V2/V3 variant scorer use exactly the same formula, timeframe freshness, missing-data behavior, weighting and threshold.
- Never treat a missing timeframe as neutral/bullish by accident. Store each timeframe's source, timestamp, freshness and raw score before the aggregate.
- A reported 2-of-3 MTF gate and ±1.5 composite thresholds are version-specific configuration, not universal constants.

### B. Early Entry: bear → neutral → accumulation
- Objective: detect a potential transition before the market is already fully bullish; do not simply wait for a bullish regime.
- Candidate evidence: short-window technical breadth changes, BTC regime, multi-timeframe slope/structure, whale-flow transition context, council signals/lessons and asset-specific sentiment snapshots.
- Whale-flow transitions and Event Flow Lab can be optional boosters, not hard blockers, unless a separately tested variant explicitly defines them as mandatory.
- Record regime score, breadth counts, each input's timestamp and missingness. A prior bug left `market_regime_score` NULL because a function expected a body field while the orchestrator sent an empty object; test input/output contracts explicitly.
- Label Early Entry positions separately (previous UI convention was purple) so their outcomes do not silently merge with standard composite entries.
- Prior state examples included a strict mode with bearish breadth 6 / neutral 0 / bullish 44 in a later snapshot; values are snapshot-specific and should not be used as defaults.

### C. Whale-flow accumulation/distribution and shock
- Study whale-flow direction, accumulation/distribution transitions, regime waves, large transfers and follow-up price behavior.
- A prior whale-shock experiment expanded coverage to 60+ mid-caps with a $50k threshold and 150+ alt/gem assets with a $30k threshold, excluding BTC/ETH/SOL from those expanded thresholds. Verify the implementation before replay.
- Historical regime bug: +$10k net flow on roughly $80.942M volume produced a +0.040 score and “Sideways” / 100% due to applying `Math.sign` to tiny net flow. Net flow must be normalized relative to volume/liquidity and tested at scale.
- Evaluate signal lead time, price impact and false-positive rates by asset liquidity, not just absolute transfer size.

### D. Flow Lab Paper OPEN
- Experimental gate was: fresh RSS sentiment ≥ +0.25, confidence ≥ 0.55, whale-flow accumulation ≥ +0.10, fresh Binance Spot price, 30 assets checked, and 6-hour cooldown.
- It was research-only and intended to open paper positions with explicit UI indication; it must not alter standard signal strategy or live execution.
- A reported initial run opened 0 positions. Treat this as a diagnostic starting point: log which gate failed per asset and input freshness rather than weakening gates blindly.
- RSS feed matching was intended to cover multiple sources (including Cointelegraph, The Defiant, DL News and a broader feed set), match against a dynamic watchlist, and count repeated independent source hits as corroborating evidence. Repetition alone does not establish truth or causality.
- Reddit was previously judged unhelpful for per-asset sentiment because useful coverage was sparse/login-gated. Prefer freely accessible, timestamped feeds where possible; preserve the source URL and publication time.

### E. News/Event → Whale Flow → Price
- Research readiness trigger is a workflow status, not a trading signal.
- A prior alert reported enough matured Accumulation/CREDIA observations for 24h/72h outcome analysis, with three detected; treat it as readiness to evaluate, not proof of predictive edge.
- Test temporal ordering: publication/availability time → observed whale-flow change → price response. Account for stale feeds, duplicate syndication, look-ahead and survivorship bias.
- Keep event-to-asset mapping evidence and confidence; ambiguous news-asset matches must remain review-required.

### F. Sentiment and auxiliary inputs
- Alternative.me Fear & Greed was added as a shadow-only input to the signal combiner.
- Binance long/short ratio was a desired additional research input if it can be collected with trustworthy timestamps and no unsafe coupling.
- Asset sentiment snapshots and AI Council signals/lessons can add context, but they must be point-in-time admissible. Current sentiment must never be backfilled into old cases.
- Avoid paid/login-gated dependencies unless deliberately approved; record source availability, collection failures and stale status.

### G. Sideways-regime micro-trend experiment
- A prior experiment proposed entering in Sideways only when 5m/15m/1h trend evidence was strongly bullish and whale-flow exceeded +5%.
- This is a separate variant. Record the exact definition of “strongly bullish,” the whale-flow scale and threshold units. Do not assume the +5% value is interchangeable with the +0.10 Flow Lab accumulation score.

## 5. Risk and execution-related research controls (source context only)

- Long-only paper mode skips SELL signals; distinguish signal direction from position-closing semantics.
- TP +4% / SL -3% / expiry 72h were benchmark assumptions; another Flow Lab variant used a 6h cooldown. Entry price source and candle timing must be recorded.
- Per-symbol caps and micro-trend gates were added in later risk-control work to reduce repeated same-symbol losses. Earlier experiments intentionally allowed repeated same-symbol positions. These are different experimental treatments.
- A watchdog was designed as alert-only (warning around 1 minute, critical after 3 minutes); it must not be mistaken for automatic position closure.
- Never infer “cash available” from the $20k reference equity. Track notional exposure and per-entry sizing separately.
- Any future risk comparison must record whether the cap, cooldown, daily limit, and position count were enabled. Otherwise cohort performance is confounded.

## 6. Data assets and source map to preserve

Candidate sources previously identified in TCC:
- `composite_signals`: composite recommendations, confidence, price/regime/source tags, entry-context snapshot and related source links.
- `strategy_variant_signals`: per-variant entry/context and outcome fields, including strategy name, symbol, confidence, score, entry/exit prices, outcome, PnL and resolved time.
- `trades`: paper position/entry/exit history; preserve every row and its relation to the signal.
- `indicator_snapshots`: indicator/timeframe snapshots.
- `whale_alerts`, whale-flow snapshots/transitions/context/shock follow-ups: flow evidence and transitions.
- `asset_price_snapshots`: price context; keep candle source and observed time.
- `asset_news_events`, `event_flow_transmissions`, `asset_sentiment_snapshots`: event/news/sentiment evidence.
- `council_signals`, `council_lessons`: AI Council outputs and lessons.
- `pipeline_runs`: execution telemetry; do not bulk copy its large `result` JSON. Preserve compact run IDs/status/timestamps and bounded diagnostic fields only where relevant.
- `trade_alerts`: alerts, not necessarily realized trade outcomes.
- Existing readiness functions/jobs are separate operational components; do not disable them merely because the archive feature is being decoupled.

One source audit snapshot reported: 128 trades (98 open paper / 30 closed), 18,798 whale alerts, 6,728 composite signals, 7,149 council signals, 279 indicator snapshots, 30 trade alerts, 29 council lessons and 743 pipeline runs. These are dated counts from a particular audit, not a current inventory. The exact inventory and row counts must be regenerated from one consistent snapshot during export.

Another retention audit reported 29,790 eligible but unarchived rows across source families: asset_news_events 362; asset_flow_snapshots 9,360; whale_flow_snapshots 1,397; asset_price_snapshots 9,360; whale_flow_transitions 537; event_flow_transmissions 1; asset_sentiment_snapshots 7,698; whale_flow_shock_followups 538; whale_flow_transition_context 537. These counts are tied to a specific retention query/time and must not be added blindly to table totals.

## 7. Archive incident status and containment

Research archive schema/functions were mistakenly deployed into the canonical TCC Supabase project. The archive implementation is not yet the destination IRL system.

At a recorded snapshot:
- `research_evidence`: 3,019 rows; IDs and fingerprints were unique in the audited sample.
- `research_cases`: 3,000 rows; 2,801 distinct non-null fingerprints and 199 null fingerprints.
- `research_findings`: 0 rows.
- `research_archive_control`: one row; archive and source-delete flags false.
- Archive status was `incomplete`: 29,790 eligible retention-source rows and zero archived.
- Database size was about 504,605,843 bytes (~481 MiB), beyond the 480 MB warning. Archive tables themselves were only a few MB combined; dropping them would not solve the main storage-growth problem.
- `research-data-retention` ran daily at 03:17 via `cleanup_research_data(72,168,false)`; readiness jobs ran separately every 15 minutes and every 5 minutes. Recheck current definitions before any source-side change.
- `refresh_research_knowledge_cases(72)` was called from the pipeline after trade executor/post-mortem with an 8-second timeout and fail-open behavior.
- Archive status function was SECURITY DEFINER and executable by anon/authenticated; permissive SELECT policies existed on archive tables. This is a security issue to redesign, not copy as-is.

**Current safety posture:** keep archive capture and source deletion disabled. No source rows have been deleted as part of this transfer. Do not drop tables/functions/policies or edit source migrations on the assumption that deleting migration files rolls back deployed SQL.

## 8. Known quality risks that must survive transfer

1. **Temporal leakage:** the archive refresh function used source `created_at` as both observed and available time for trades/composite/variant signals. This is unverified and insufficient for strict point-in-time backtesting.
2. **Mutable outcomes:** case refresh can alter outcomes/PnL/timestamps/evidence links while an entry evidence record is inserted once per fingerprint. IRL must separate immutable entry snapshots from later outcome events.
3. **Outcome maturity:** variant terminal labels included win/loss/expired and used `resolved_at`; that alone does not prove a consistent entry + 72h maturity rule.
4. **Unknown cohort/scorer:** some trade cohorts were mapped to `Unknown`, scorer `paper-trade`; variant cohorts inferred from fingerprint prefixes. Preserve uncertainty instead of fabricating labels.
5. **Missing fingerprints:** case rows with null fingerprints cannot be deduplicated by fingerprint; do not synthesize identity from symbol/time alone without a documented fallback.
6. **Unresolved ≠ loss:** 551 V3 cases were unresolved in one snapshot; do not score them as failures without horizon and evaluator verification.
7. **RLS exposure:** permissive archive SELECT policies and broad function grants must not be copied into IRL.
8. **Storage:** `pipeline_runs` was previously the largest storage contributor (around 229 MB in an earlier audit). Prefer bounded telemetry and retention design over dumping JSON or deleting history.
9. **No destination identity:** the true isolated IRL Supabase project ref remains unverified. A stale `.env` ref is not proof of ownership or destination.
10. **No verified DB restore yet:** a private preflight manifest exists, but it is aggregate metadata, not a complete row export and not a PostgreSQL restore test.

## 9. Minimum IRL knowledge model

The first real ingestion should use a small normalized model, not a raw JSON archive:

- **Source registry:** source system/project, schema fingerprint, extraction timestamp and permission boundary.
- **Observation/evidence:** source table + source record ID/version, symbol/entity, feature family, normalized bounded payload, event/observed/available/ingested timestamps, provenance URL/foreign IDs, payload fingerprint, quality flags.
- **Case/experiment:** stable case ID, source identity, cohort (Legacy/V2/V3/experiment ID), scorer/evaluator version, strategy/preset, entry time/price, benchmark assumptions and split definition.
- **Outcome event:** append-only exit/outcome records with label, price, PnL, fees/slippage assumptions, terminal/maturity timestamp, evaluator version and source pointer.
- **Finding/hypothesis:** hypothesis, supporting and contradicting evidence IDs, sample definition, test protocol, out-of-sample results, confidence/limitations and review status.
- **Run manifest:** extraction/query/version, source snapshot boundary, row counts, primary-ID sets or digest, per-table logical hash, rejected-row counts/reasons, validation results and artifact checksum.

Use separate tables or explicit versioned fields for immutable entry evidence and later outcomes. Keep source IDs as text. Make every transform reproducible and cohort-aware.

## 10. Transfer plan — next actions in order

1. Complete the source-to-IRL knowledge map in this repository (this ledger plus source contract and dependency inventory).
2. Reconfirm the intended IRL repo and identify its actual isolated backend; do not create a paid branch or project to work around free-tier limits.
3. Generate a consistent read-only source export only after destination and storage path are known. Use a consistent snapshot; export bounded relevant records, not unbounded JSON. Encrypt private artifacts and keep credentials out of Git.
4. Preserve row-level identity and provenance: source IDs, timestamps, Legacy/V2/V3 cohort, scorer/evaluator version, entry snapshot, outcome events and hashes.
5. Validate the export using counts, distinct IDs, null identity counts, fingerprints and deterministic logical hashes.
6. Restore to a local disposable PostgreSQL if available; if not, report the missing restore test plainly rather than claiming success.
7. Build IRL schema and import in small idempotent batches only after its destination is verified and storage budget is known.
8. Compare destination counts/IDs/hashes with the source manifest. Quarantine rejects with explicit reasons.
9. Only after verified transfer and a separate explicit rollback plan, consider decoupling the mistakenly deployed archive from TCC. Preserve all original research and trading history.
10. Run cohort-level data quality and backtest reproducibility checks before producing any strategy ranking or claim of predictive value.

## 11. Provenance labels for every future claim

Every imported or derived fact must be marked as one of:
- **SOURCE-OBSERVED:** directly queried from a named source table at a stated snapshot time.
- **CONFIG-RECORDED:** copied from a versioned configuration or code revision.
- **HISTORICAL-REPORT:** a dated aggregate from a previous analysis; reproduce before using.
- **HYPOTHESIS:** proposed relationship or strategy gate, not yet tested.
- **TESTED-IN-SAMPLE:** result on the declared sample only.
- **OUT-OF-SAMPLE:** evaluated on a genuinely held-out temporal/cohort split.
- **UNVERIFIED:** semantics, provenance or current implementation not yet established.

Never upgrade a hypothesis or historical report to “validated” without a reproducible test and evidence links.


## 12. Source-code-verified strategy preset weights (main branch snapshot)

The following were read from `src/lib/strategy.presets.ts` in the source repository on 2026-10-20. These are configured weights, not empirical rankings:

| Preset | Whale weight | Technicals weight | Council weight | Interpretation from label/config |
|---|---:|---:|---:|---|
| balanced | 1.0 | 1.0 | 1.0 | equal weighting |
| whale-focused | 2.0 | 0.5 | 0.5 | emphasizes whale flow |
| chart-trader | 0.5 | 2.0 | 0.5 | emphasizes technicals |
| sentiment-first | 0.5 | 0.5 | 0.5 | low-weight / sentiment shadow label; not a high sentiment weight |
| ai-driven | 0.5 | 0.5 | 2.0 | emphasizes Council |
| conservative | 1.2 | 1.2 | 1.2 | modest uniform weighting |
| volatility-timing | 0.3 | 2.2 | 1.0 | label: BB + Aroon Timing |
| vwap-momentum | 0.5 | 2.2 | 0.8 | label: VWAP + RSI Intraday |
| smc-reversal | 0.4 | 2.5 | 0.8 | label: SMC Pro (BOS + ChoCh) |

The source default is `balanced` with weights 1.0/1.0/1.0. The strategy configuration path has historically defaulted automatic switching to disabled and a 4-hour interval. Actual database configuration may differ from code defaults; preserve both as separate facts.

## 13. Source-code-verified MTF gate status and evidence strength

The source file `src/lib/mtf-gate.ts` on the inspected main branch defines:
- `DEFAULT_MTF_GATE_CONFIG.enabled = false`
- `shadow_mode = true`
- `min_timeframes = 2`
- The helper counts three signals named `primary`, `fast`, and `trend`; it does not itself establish which exact candle intervals those labels represent.
- It checks the number of timeframes confirming the requested direction; it does not penalize opposing timeframes beyond reporting their count.

The same source comment describes empirical backing from only 10 closed trades in September 2026 and claims a +74% net PnL improvement in a backtest. This is a **small, in-sample historical claim** until independently reproduced with full trade IDs, the exact split, fee assumptions, scorer version and a genuinely held-out time window. Do not import the claimed uplift as validated performance. The current default being disabled/shadow also means “2/3 MTF gate” must not be described as necessarily active in the source runtime.

## 14. Variant performance SQL semantics verified from the historical migration

Migration `20261012173000_variant_benchmark_cohorts.sql` defines two separate functions:
- `get_variant_performance(days)`: BUY variant rows with `created_at >= now() - days`, excluding `v2|%` fingerprints (but including NULL fingerprints).
- `get_variant_performance_v2(days)`: BUY variant rows in the same `created_at` lookback whose fingerprint matches `v2|%`.
- Both count only `win`, `loss`, and `expired` as resolved; `open` is counted separately. They sum `pnl_pct` for those terminal outcomes.
- This lookback is based on signal creation time, not necessarily outcome-resolution time or entry maturity. It can therefore show different cohort coverage from a matured-outcome benchmark and must not be treated as an equivalent evaluator.
- NULL fingerprints are included in the legacy function but excluded from V2. Record this difference when comparing historical outputs.

This source-level finding reinforces the rule: Legacy/V2/V3 are separate and function names alone do not guarantee comparable samples. IRL should store the query/evaluator definition hash alongside every imported aggregate.


## 15. Fresh canonical database snapshot and storage priorities (2026-10-20 11:34 UTC)

A read-only query against canonical TCC project `yckewtpfttvwiptmmrfq` measured the database at **526,126,227 bytes (~502 MB)**. This is the current recorded snapshot, superseding older size readings for planning. No data was modified.

Largest measured relations:
- `strategy_shadow_diagnostics`: ~93 MB / estimated 111,517 rows.
- `composite_signals`: ~75 MB / estimated 16,139 rows.
- `strategy_variant_signals`: ~40 MB / estimated 67,587 rows.
- `pipeline_runs`: ~36 MB / estimated 858 rows.
- `whale_alerts`: ~33 MB / estimated 57,223 rows.
- `market_candles`: ~30 MB / estimated 89,258 rows.
- `accumulation_shadow_observations`: ~25 MB / estimated 55,409 rows.
- `asset_sentiment_snapshots`: ~16 MB / estimated 30,457 rows.
- `asset_social_snapshots`: ~15 MB / estimated 24,900 rows.
- `asset_flow_snapshots`: ~12 MB / estimated 37,530 rows.
- `event_flow_study_snapshots`: ~12 MB / estimated 55,585 rows.
- `asset_price_snapshots`: ~11 MB / estimated 37,530 rows.

These row counts are planner estimates; exact counts and row hashes must be produced from one consistent snapshot before export. Relation sizes include storage outside the plain heap, including indexes/TOAST where applicable. Do not delete data based on this list. The correct next step is to preserve and transfer research-relevant observations, then separately decide source retention only after a verified export and independent approval.

Archive table sizes in this snapshot: `research_evidence` ~1.95 MiB (3,019 estimated rows), `research_cases` ~1.48 MiB (3,000 estimated rows), `research_findings` 0 rows / 40 KiB, `research_archive_control` one row / 32 KiB. Removing these tables would not solve the database-size issue and is not authorized by this ledger.

## 16. Current strategy configuration versus implementation guard

The current `strategy_config` row observed at this snapshot:
- preset `conservative`, whale/technicals/council weights 1.2/1.2/1.2, prediction weight 0;
- automatic switching enabled, interval 1 hour;
- updated `2026-10-17T13:30:04.845Z`;
- last reason text reports resolved=2, average PnL +4.00%, win rate 100%.

Source code `src/lib/strategy.functions.ts` independently checks `auto_switch_enabled`, loads 7-day variant performance, and blocks automatic selection unless at least one preset has `resolved >= 25` and positive average PnL. Thus a last-reason string referencing two observations does **not** by itself prove that a preset switch was applied on two samples; it may be a stale/different log path. The actual current gate is 25 resolved samples in the inspected function. Preserve the discrepancy for forensic review. IRL does not modify the source config.

## 17. Source-to-IRL transfer priority

Priority order for the first bounded, provenance-preserving export:
1. Strategy definitions/config snapshots and all versioned scorer/evaluator code references.
2. `strategy_variant_signals` and `composite_signals`, retaining every source ID, fingerprint, entry context, cohort and resolution field.
3. `trades` and `council_lessons` / `council_signals`, with links to source signal IDs and separate immutable entry versus outcome events.
4. `strategy_shadow_diagnostics`, `early_entry_variant_decisions`, `accumulation_shadow_observations`, `repeated_buy_research_ledger`, preserving bounded feature fields and decision reasons.
5. Whale flow: alerts, snapshots, transitions, transition contexts and shock follow-ups.
6. Asset price, flow, sentiment, social and news/event evidence, with explicit event/observed/available times and source provenance.
7. Indicator/candle history needed to reproduce the exact experiment windows, with explicit storage budgeting.
8. Compact pipeline run metadata only; do not bulk copy large `pipeline_runs.result` JSON.

Every export must be idempotent and include exact per-table row counts, distinct source IDs, null-fingerprint counts, deterministic logical hashes, extraction query/code version and snapshot boundary. Import must not begin until the destination project is verified. All source records remain preserved.
