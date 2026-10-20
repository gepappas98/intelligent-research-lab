# Canonical source inventory — 2026-10-20

## Provenance
- Source project ref: `yckewtpfttvwiptmmrfq`
- Canonical URL: `https://yckewtpfttvwiptmmrfq.supabase.co`
- Captured UTC: `2026-10-20T13:32:39.109844Z`
- PostgreSQL: `17.6`
- Public relations: 66 total = 64 tables + 2 views
- Table storage reported by PostgreSQL: 481,804,288 bytes (about 459.4 MiB; excludes other database/system overhead)
- This is a catalog inventory only, NOT a data export. No source rows were changed.

## Live count spot-check (separate exact count query)
- `whale_alerts`: 58,358
- `composite_signals`: 16,368
- `trades`: 234
- `pipeline_runs`: 869
- `public` tables: 64

The estimates below come from PostgreSQL catalog statistics (`reltuples`), not exact COUNT(*). They are for sizing and prioritization only. Negative/unknown catalog estimates are shown as 0 in the compact inventory query and must not be interpreted as empty tables.

## Largest tables by total relation size
| Table | Estimated rows | Bytes |
|---|---:|---:|
| strategy_shadow_diagnostics | 111,946 | 99,213,312 |
| composite_signals | 16,293 | 79,806,464 |
| strategy_variant_signals | 67,576 | 43,122,688 |
| pipeline_runs | 856 | 38,060,032 |
| whale_alerts | 58,318 | 35,717,120 |
| market_candles | 89,622 | 31,555,584 |
| accumulation_shadow_observations | 54,773 | 26,230,784 |
| asset_sentiment_snapshots | 28,646 | 16,859,136 |
| asset_social_snapshots | 24,240 | 16,228,352 |
| asset_flow_snapshots | 34,650 | 13,205,504 |
| event_flow_study_snapshots | 56,065 | 12,492,800 |
| cmc_listing_snapshots | 18,200 | 11,632,640 |
| asset_price_snapshots | 34,650 | 11,354,112 |
| whale_flow_transitions | 4,561 | 9,494,528 |
| whale_flow_transition_context | 4,392 | 7,241,728 |
| repeated_buy_research_ledger | 2,645 | 3,760,128 |
| whale_flow_shock_followups | 4,529 | 3,375,104 |
| whale_flow_snapshots | 10,033 | 3,268,608 |
| early_entry_variant_decisions | 2,366 | 3,235,840 |
| research_evidence | 3,019 | 2,039,808 |
| council_signals | 4,194 | 1,908,736 |
| early_entry_regime_observations | 1,081 | 1,818,624 |
| indicator_snapshots | 693 | 1,785,856 |
| research_cases | 3,000 | 1,548,288 |
| asset_news_events | 1,099 | 1,384,448 |
| trades | 227 | 671,744 |
| influential_social_events | 247 | 557,056 |
| entry_context_snapshots | 233 | 516,096 |
| prediction_snapshots | 22 | 442,368 |
| market_regime_telemetry | 687 | 360,448 |
| cmc_macro_snapshots | 168 | 270,336 |
| council_lessons | 168 | 196,608 |
| trade_alerts | 196 | 163,840 |
| dynamic_watchlist_snapshots | 9 | 147,456 |
| tracked_asset_membership_history | 60 | 131,072 |
| event_flow_transmissions | 51 | 122,880 |
| shadow_conflicts | 0 estimate | 122,880 |
| social_source_fetch_state | 6 | 122,880 |
| influential_social_chain_quality | 24 | 114,688 |
| influential_social_transmission_links | 0 estimate | 114,688 |
| trade_position_alerts | 2 | 114,688 |
| tracked_assets | 46 | 106,496 |
| event_flow_paper_decisions | 38 | 90,112 |
| influential_social_market_observations | 0 estimate | 90,112 |
| whale_flow_turns | 0 estimate | 90,112 |
| hot_whale_signals | unknown | 65,536 |
| influential_social_lead_lag_stats | unknown | 65,536 |
| influential_social_sources | unknown | 65,536 |
| market_sentiment_snapshots | 7 | 65,536 |
| pipeline_settings | unknown | 65,536 |
| research_alerts | unknown | 65,536 |
| social_source_connectors | unknown | 65,536 |
| strategy_config | 1 | 65,536 |
| system_audit_reports | unknown | 65,536 |
| execution_capacity_observations | unknown | 40,960 |
| research_findings | unknown | 40,960 |
| ai_status | unknown | 32,768 |
| data_plane_unification_audit | unknown | 32,768 |
| global_risk_events | unknown | 32,768 |
| mtf_gate_rejections | unknown | 32,768 |
| research_archive_control | unknown | 32,768 |
| shadow_mtf_gates | unknown | 32,768 |
| equity_snapshots | unknown | 24,576 |
| social_source_probe_runs | unknown | 24,576 |

## Views (not base-table exports)
- `cmc_listing_research_observations`
- `portfolio_summary`

## Transfer decision / next step
1. Do not use this inventory as a substitute for the raw export.
2. Export all 64 base tables from the verified canonical project, preserving exact values and primary keys. Export schema separately.
3. Do not silently drop large tables, JSONB payloads, research/diagnostic tables, or tables with unknown estimates. Inspect potential secrets/credential-bearing tables separately and document any justified exclusions.
4. For each exported table, record exact row count, byte size, SHA-256, primary key/unique-key metadata, and timestamp min/max where applicable. Verify counts and checksums after restore.
5. Preserve source untouched. Manual refresh only; no scheduled export.
6. Existing Lovable read-query connector previously pointed at a different DB (22 tables, only 129 whale alerts, 0 composite signals, 0 trades, 3 pipeline runs); do not use it as source. This catalog was queried directly through the canonical Supabase project connector.

## Status
`inventory-only / export-not-yet-performed`
