# IRL Research Data Transfer Runbook

**Status:** operational plan ready; production export/import not yet executed  
**Source:** canonical TCC Supabase project `yckewtpfttvwiptmmrfq`  
**Target:** IRL isolated database (project identity currently unverified)  
**Data safety:** source is read-only; no source deletion or source schema change is part of this runbook.

## Hard gates

- [ ] Identify a real IRL backend project ref from its owner/project settings, not a stale `.env` value.
- [ ] Confirm the target is separate from `yckewtpfttvwiptmmrfq` and has sufficient free database/storage capacity.
- [ ] Confirm a private, encrypted local artifact destination with access controls.
- [ ] Freeze a consistent source snapshot boundary for the export.
- [ ] Record source schema/migration revision and extraction code/query hashes.
- [ ] Validate exact counts, source IDs, null fingerprints, duplicate fingerprints and deterministic logical row hashes before import.
- [ ] Build an idempotent target import and verify counts/hashes after import.
- [ ] Preserve all source rows; never delete source data as part of migration.

Until the first three gates pass, do not export row payloads into GitHub, do not write to any Supabase project, and do not create paid infrastructure.

## Latest source snapshot for planning

Read-only snapshot at 2026-10-20 11:34 UTC:
- Database size: 526,126,227 bytes (~502 MB).
- Largest relations: `strategy_shadow_diagnostics` ~93 MB; `composite_signals` ~75 MB; `strategy_variant_signals` ~40 MB; `pipeline_runs` ~36 MB; `whale_alerts` ~33 MB; `market_candles` ~30 MB; `accumulation_shadow_observations` ~25 MB.
- Archive tables combined are only a few MiB; deleting them would not solve the space pressure.
- Table row counts in the snapshot came from planner statistics, not exact counts. They are for prioritization only.

## Export tiers

### Tier 1 — core strategy outcomes
Export first:
- `strategy_config` (configuration snapshots; current row observed as `conservative`, weights 1.2/1.2/1.2, prediction weight 0, auto-switch enabled, interval 1h).
- `strategy_variant_signals`
- `composite_signals`
- `trades`
- `council_signals`
- `council_lessons`

Retain source IDs, fingerprints, signal/entry context, regime/session/source tags, strategy name, scorer version when available, outcome, PnL fields, resolution time, and all foreign/source links. Do not treat `created_at` as point-in-time availability without evidence.

### Tier 2 — research-only experiment evidence
- `strategy_shadow_diagnostics`
- `early_entry_variant_decisions`
- `accumulation_shadow_observations`
- `repeated_buy_research_ledger`
- `event_flow_study_snapshots`

Keep decision reasons, variant identity, bounded metric fields, timestamp, and any trade/source ID references. Preserve the feature fields actually used by each experiment version.

### Tier 3 — market context and provenance
- `whale_alerts`
- `whale_flow_snapshots`
- `whale_flow_transitions`
- `whale_flow_transition_context`
- `whale_flow_shock_followups`
- `asset_flow_snapshots`
- `asset_price_snapshots`
- `asset_sentiment_snapshots`
- `asset_social_snapshots`
- `asset_news_events`
- `event_flow_transmissions`
- `indicator_snapshots`
- `market_candles` (only the history windows needed for reproducibility, with storage budget recorded)

### Tier 4 — bounded operational telemetry
- `pipeline_runs`: export IDs, timestamps, status, function/job name, bounded error fields, and a pointer/hash for relevant output. Do not copy full large `result` JSON payloads by default.

## Snapshot manifest requirements

For every table:
- exact count within the same consistent snapshot;
- primary-key count and duplicate count;
- distinct source-ID count;
- null fingerprint count and duplicate non-null fingerprint count where applicable;
- minimum/maximum event/observed/created/resolved timestamps, each labelled by actual column semantics;
- schema fingerprint;
- deterministic logical row-set SHA-256 using a canonical field order and stable null/number/timestamp encoding;
- export file byte size and SHA-256;
- rejected row count and explicit reason;
- extraction query/code revision and snapshot boundary.

A digest over IDs alone is not enough to prove payload integrity. Include all selected normalized field values in the logical row hash, while preserving original source values separately where needed.

## Temporal and cohort rules

- Preserve Legacy, V2, V3 and Unknown as separate cohorts.
- Record scorer and evaluator versions and the exact query/window definition.
- Never merge legacy and V2 function results without resolving their different fingerprint filters and `created_at` lookback semantics.
- Entry evidence is admissible only when the measurement's observed and available timestamps are defensibly known and satisfy `observed_at <= available_at <= entry_at`.
- If source availability time is unknown, retain the row as unverified context but exclude it from strict point-in-time backtests.
- Store initial entry snapshots immutably. Store outcomes, corrections and resolution events separately.
- An open/immature/unresolved sample is not a loss.
- Record fees, slippage, benchmark exit rules and maturity logic per evaluator version.

## Target import rules

- Import to a verified, isolated IRL project only.
- Use stable identity `(source_system, source_project_ref, source_table, source_record_id, source_record_version)`.
- Use idempotent batches with checkpoints and explicit rejected-row logs.
- Keep original source IDs as text.
- Keep RLS default-deny; do not copy the source archive's permissive SELECT policies or broad SECURITY DEFINER grants.
- Verify imported counts and hashes against the manifest after each tier.
- No cron-based automatic import until manual dry-run and reconciliation pass.
- Do not merge any branch or apply any migration to TCC as part of the transfer.

## Completion definition

The transfer is complete only when:
1. The strategy/knowledge docs are in IRL.
2. A private source export exists with verified per-table counts and hashes.
3. The actual IRL destination is proven separate from TCC.
4. The target schema is applied only to IRL and import is idempotent.
5. Counts, IDs and hashes reconcile after import.
6. A reproducible cohort report can be regenerated from imported data.
7. Source records remain intact.


## Exact-count preflight observations (separate read-only statements, not a consistent export snapshot)

The following exact-count queries were run against the canonical source on 2026-10-20. They are diagnostic preflight observations only; because they were separate statements while collectors may continue running, they are **not** a single MVCC snapshot and must not be used as the final import manifest.

| Table | Exact rows in its query | Distinct IDs | Fingerprints |
|---|---:|---:|---|
| `composite_signals` | 16,139 | 16,139 | 16,139 non-null / 16,139 distinct |
| `strategy_variant_signals` | 67,587 | 67,587 | 67,587 non-null / 67,587 distinct |
| `trades` | 230 | 230 | not applicable |
| `council_signals` | 4,429 | 4,429 | not applicable |
| `council_lessons` | 224 | 224 | not applicable |
| `strategy_shadow_diagnostics` | 111,517 | 111,517 | not applicable |
| `accumulation_shadow_observations` | 55,409 | 55,409 | not applicable |
| `early_entry_variant_decisions` | 2,450 | 2,450 | not applicable |
| `repeated_buy_research_ledger` | 2,632 | 2,632 | not applicable |
| `asset_sentiment_snapshots` | 30,480 | 30,480 | not applicable |
| `asset_social_snapshots` | 24,900 | 24,900 | not applicable |
| `asset_flow_snapshots` | 37,560 | 37,560 | not applicable |
| `asset_price_snapshots` | 37,560 | 37,560 | not applicable |
| `market_candles` | 89,258 | 89,258 | not applicable |
| `whale_alerts` | 57,223 | 57,223 | not applicable |
| `whale_flow_snapshots` | 10,866 | 10,866 | not applicable |
| `whale_flow_transitions` | 4,510 | 4,510 | not applicable |
| `whale_flow_transition_context` | 4,510 | 4,510 | not applicable |
| `whale_flow_shock_followups` | 4,478 | 4,478 | not applicable |
| `event_flow_study_snapshots` | 55,615 | 55,615 | not applicable |
| `research_evidence` | 3,019 | 3,019 | 3,019 non-null / 3,019 distinct |
| `research_cases` | 3,000 | 3,000 | 2,801 non-null / 2,801 distinct; 199 null |

Timestamp ranges in the core tables are recent in the current source snapshot: `composite_signals` spans 2026-10-14 12:40 UTC to 2026-10-20 11:30 UTC; `strategy_variant_signals` spans 2026-10-14 15:30 UTC to 2026-10-20 11:30 UTC; `strategy_shadow_diagnostics` spans 2026-10-11 19:50 UTC to 2026-10-20 11:30 UTC. This may reflect retention, a reset, or current table scope; the query alone does not establish why. Before claiming all historical knowledge is preserved, inspect source migration/retention history and determine whether older cohorts exist in another table, backup, branch or export. Do not infer that older rows never existed.

Final export manifest must be recomputed in one consistent snapshot, using exact counts and canonical rowset hashes; these preflight figures are not substitutes for that step.
