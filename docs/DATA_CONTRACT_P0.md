# IRL P0 Data Contract — Source Mapping and Cohort Rules

**Status:** Proposed contract for review; read-only source schema inspection completed on 2026-10-20.  
**Target:** `gepappas98/intelligent-research-lab`  
**Important:** IRL's own isolated writable database has not been identified. This contract does not authorize migration, ingestion, or source writes.

## 1. Non-negotiable temporal model

All imported facts must preserve at least:
- `source_system`: stable logical source name, e.g. `trading-command-center`.
- `source_project_ref`: source project identity, never the IRL destination.
- `source_table`, `source_record_id`, and `source_record_version` if the source exposes one.
- `event_at`: when the underlying event happened, if explicitly represented.
- `observed_at`: when the source says a measurement was observed.
- `available_at`: earliest defensible time this value was available to the strategy/system; do not substitute current time if unknown.
- `ingested_at`: when IRL imported the row.
- `source_updated_at`: only when a real source update timestamp exists.
- `payload_fingerprint`: deterministic hash of normalized, bounded selected fields plus schema/version—not a hash of unstable serialization.
- `quality_status` and `exclusion_reason`: explicit missingness/ambiguity.

Keep `event_at` and `available_at` separate. A source's `created_at` often records insertion time and is not automatically the real-world event time or the time a model could have known the information. If temporal semantics cannot be established, mark them unknown and exclude that row from point-in-time evidence rather than guessing.

An entry-context evidence record is eligible for case entry time (T) only if both its observation time and availability time are known and `observed_at <= available_at <= T`. If availability time is absent or semantically ambiguous, it is not admissible as strict point-in-time evidence. It may be retained as unverified context with an explicit exclusion flag.

## 2. Stable source identity and idempotency

Preferred logical identity:
`(source_system, source_project_ref, source_table, source_record_id, source_record_version)`.

If the source has no version column, use source record ID plus a deterministic fingerprint of a documented field subset. Do not use symbol + timestamp alone as a primary identity. Preserve original source IDs as text in IRL so UUIDs and future non-UUID IDs can coexist.

Idempotency key for source snapshots:
`(source_system, source_project_ref, source_table, source_record_id, source_record_version, snapshot_role)`.

For a case:
`(source_system, source_project_ref, source_table, source_record_id, cohort, scorer_version, evaluator_version)`.

Retries must update neither immutable entry snapshots nor prior outcomes. A corrected source value becomes a new source version/event if the source provides evidence of revision; otherwise flag it as mutable/uncertain rather than silently overwriting.

## 3. Candidate source mapping (verified columns, semantics still require row-level tracing)

Column lists below were read from the canonical source database's information schema. They describe the source, not an IRL schema. A column's presence does not prove its semantic validity or completeness.

| Source table | Stable ID | Candidate temporal fields | Entry-time fields / outcome fields | Rules |
|---|---|---|---|---|
| `composite_signals` | `id` | `created_at`; no verified separate availability timestamp in inspected columns | `symbol`, `confidence`, `recommendation`, `price_at`, `regime_label`, `source_tags`, `market_session`, `entry_context_snapshot`, links to whale/indicator/prediction/council records | Preserve `entry_context_snapshot` only after validating when it was written and whether it is immutable. Treat `created_at` as source-created time, not automatically signal availability. |
| `strategy_variant_signals` | `id` | `created_at`, `resolved_at` | Entry/context: `strategy_name`, `symbol`, `confidence`, `recommendation`, `score`, `entry_price`, regime fields, `source_tags`, `source_fingerprint`. Outcome: `exit_price`, `outcome`, `pnl_pct`, `resolved_at` | Do not treat `created_at` as a candle timestamp without checking producer. Outcome fields must never leak into entry evidence. Capture scorer/evaluator version and cohort separately. |
| `trades` | `id` | `created_at`, `closed_at` | Entry: `composite_signal_id`, `symbol`, `side`, `quantity`, `entry_price`, stop/take-profit, `mode`, `entry_source`, `entry_metadata`. Outcome: status, exit, close reason, gross/net PnL and fees | Separate paper/shadow from actual execution by `mode` and verified status. Do not use PnL/close fields as entry evidence. |
| `indicator_snapshots` | `id` | `created_at`; inspect producer for actual candle-close time | `symbol`, `timeframe`, RSI/MACD/Bollinger fields, `price`, `signal`, `raw` | Do not infer candle time from insertion time. Raw JSON is not bulk-copied; extract only bounded, documented fields. |
| `council_signals` | `id` | `source_created_at`, `synced_at` | `source_id`, `symbol`, verdict/conviction, price, reflection | Distinguish upstream creation from sync/knowledge time. Verify whether the source record was available before entry. |
| `council_lessons` | `id` | `created_at` | `source_trade_id`, symbol, entry context, lesson; also has outcome and realized PnL | Post-mortem/lesson is outcome-derived unless proven otherwise; never treat it as entry-time knowledge for its own source trade. |
| `asset_sentiment_snapshots` | `id` | `observed_at`, `created_at` | source, mention counts, sentiment/velocity/shock metrics | Require `observed_at` and a defensible availability time. Do not copy `raw` wholesale. |
| `asset_news_events` | `id` | `event_at`, `created_at` | source/title/url, sentiment/relevance/novelty/shock, fingerprint | `event_at` is event time, not necessarily publication/availability time. Validate URL/source publication time before admitting as entry evidence. Do not copy `raw` wholesale. |
| `asset_flow_snapshots` | `id` | `bucket_at`, `created_at` | asset, buy/sell/total USD, flow score/state, source | Use `bucket_at` for the measured bucket only after confirming its exact window and when it becomes available. |
| `asset_price_snapshots` | `id` | `observed_at`, `created_at` | asset, price, source | Prefer explicit `observed_at`; validate freshness and availability delay. |
| `whale_flow_snapshots` | `id` | `bucket_at`, `created_at` | accumulation/distribution/neutral %, flow score, state, sample size | Global context is only eligible if its bucket was complete and available by entry. |
| `whale_flow_transitions` | `id` | `detected_at`, `confirmation_at`, `created_at` | from/to snapshots, previous/new state, deltas, velocity, classification | A later `confirmation_at` or persistence classification cannot be backdated to `detected_at`. Store detection and confirmation as separate events. |
| `whale_flow_transition_context` | `id` | `captured_at`, `created_at` | linked transition, lookback, indicator/signal/prediction/sentiment/news contexts | Context is point-in-time only if captured and all embedded components were available before the case entry. Treat embedded JSON as untrusted, versioned input; select fields explicitly. |
| `event_flow_transmissions` | `id` | `event_at`, `created_at`, `updated_at` | source link, flow deltas/velocities, price returns 15m–24h, transmission class, quality | Forward returns and post-event deltas are outcomes, not entry predictors for the same event. Store feature windows and outcome horizons separately. |
| `whale_flow_shock_followups` | `id` | `shock_at`, `created_at`, `updated_at` | transition link, flow/price responses, time-to-peak, quality | Follow-up responses are outcome/path observations; never include them in the shock's initial entry snapshot. |
| `pipeline_runs` | `id` | `started_at`, `completed_at` | job/status/duration and aggregate counters; `result` JSONB | Keep only small summaries, error codes, hashes and source pointers. Never bulk-import full `result` payloads. |
| `whale_alerts` | Must verify current DDL before mapping | Must verify | Candidate context only | Do not ingest until identity, timestamps, and update semantics are documented. |

## 4. Cohort rules — do not pool implicitly

### Legacy
- Use only when a row is confirmed to predate the V2/V3 fingerprint contract or has a verified legacy producer.
- Missing fingerprint alone is not sufficient proof of Legacy; otherwise assign `Unknown`.
- Preserve original strategy name, scorer/config version if recoverable, and provenance quality.

### V2
- Identify only using a verified V2 fingerprint/producer contract. Prior source conventions include `v2|` prefixes, but verify against current DDL/data and historical code before using.
- Do not assume V2 evaluator behavior equals V3.
- Retain the original V2 observations, including unresolved records, without regenerating or mutating them.

### V3
- Prior convention is `source_fingerprint LIKE 'v3|%'`; confirm the exact prefix and producer before classifying each record.
- V3 benchmark assumptions previously documented: TP +4%, SL −3%, 72h horizon, nominal $1,000 position, historical candle close entry. Store this as a named/versioned evaluation configuration, not an unqualified fact about every record.
- A case is not evaluated merely because it is old or because its text outcome is terminal. Require a real resolver timestamp, defined maturity/horizon, valid entry/exit prices, evaluator version and reproducible result.
- Open V3 records remain open until the source evaluator establishes an outcome. Never classify immature/open as losses.

### Unknown / incompatible
- Use `Unknown` whenever the cohort cannot be proven.
- A finding must use one cohort, one compatible scorer version and one evaluator version. Any combined analysis must explicitly state a prespecified harmonization method and report stratified results as well.

## 5. Outcome state machine (proposed)

Use mutually exclusive states, not free-text inference:
- `observing`: entry exists; horizon has not completed.
- `resolved_verified`: terminal outcome has resolver timestamp and passed data-quality checks.
- `matured_unresolved`: defined horizon passed but no valid terminal result exists.
- `censored`: source disappears or coverage ends before outcome can be established.
- `invalid`: impossible timestamps/prices or violated source contract.
- `review_required`: conflicting/missing evaluator data prevents safe classification.

Keep `maturity_at` (expected horizon boundary), `resolved_at` (actual source resolver event), and `ingested_at` (IRL receipt) separate. Do not fill one with another.

## 6. Outcome/evaluator contract

Every evaluated case must carry:
- `evaluator_id` and immutable `evaluator_version`;
- entry timestamp/price provenance and candle interval;
- TP/SL/expiry configuration and exact threshold semantics;
- candle ordering and TP/SL collision policy if both are touched within one candle;
- gross return, fees, slippage assumptions and net return in explicitly named units;
- resolution reason, resolved time, maturity horizon and censoring/exclusion flags;
- price/source completeness and calculation fingerprint.

Do not equate `pnl_pct`, `net_pnl`, or an outcome label across source tables without validating units, sign convention, fee treatment and evaluator version. If those are unknown, retain raw values with `quality_status=unverified` and exclude from validated findings.

## 7. Evidence-linked findings contract

A finding cannot be `validated` unless:
1. It references unique case IDs and evidence IDs.
2. All cases are evaluated and eligible under a single declared cohort/scorer/evaluator contract.
3. Evidence supports the claim and is admissible at the relevant entry time.
4. Sample size matches the referenced cases exactly; exclusions and missingness are reported.
5. Uncertainty and chronological out-of-sample validation are reported.
6. Reproduction instructions identify source query/filters, time window, versions, thresholds and calculations.
7. The finding has no unresolved look-ahead, duplicate, timestamp or outcome-quality flags.

LLM output may propose a candidate finding but cannot promote it to validated without deterministic checks.

## 8. Source-side facts versus open questions

**Observed in read-only source schema on 2026-10-20:** the tables and columns listed above exist in the canonical project `yckewtpfttvwiptmmrfq`. These are source-side field names only.

**Still unresolved:** IRL's own database project ref; exact Lovable migration target; source primary/foreign-key behavior beyond inspected IDs; whether any source fields are overwritten; actual signal availability timing; source scorer/evaluator version coverage; TP/SL same-candle collision semantics; net PnL/fee semantics by cohort; source table retention policies and complete dependency graph.

No IRL schema or production import should be created until those blockers are closed and the user-facing contract is reviewed.
