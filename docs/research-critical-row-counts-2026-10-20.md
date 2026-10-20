# Exact row-count audit — research-critical tables

- Captured from canonical Supabase project `yckewtpfttvwiptmmrfq`
- Captured UTC: 2026-10-20 (exact query; connector response did not return a timestamp)
- Read-only SQL. No rows modified.
- These are exact `COUNT(*)` results, unlike catalog `reltuples` estimates in `source-inventory-2026-10-20.md`.

| Table | Exact rows |
|---|---:|
| `council_lessons` | 226 |
| `early_entry_regime_observations` | 1,102 |
| `early_entry_variant_decisions` | 2,486 |
| `repeated_buy_research_ledger` | 2,652 |
| `research_cases` | 3,000 |
| `research_evidence` | 3,019 |
| `research_findings` | 0 |
| `strategy_shadow_diagnostics` | 113,217 |
| `whale_flow_shock_followups` | 4,529 |
| `whale_flow_transition_context` | 4,561 |
| `whale_flow_transitions` | 4,561 |

## Interpretation
- Research evidence and case records exist and should be preserved with their source IDs and timestamps.
- `research_findings` is currently empty; do not treat an empty derived findings table as absence of historical evidence.
- The diagnostics table alone has 113,217 exact rows and is approximately 95 MB on disk. It must not be silently omitted because it exceeds a per-file export threshold; export it in deterministic, non-overlapping chunks with row ranges/keys and per-chunk hashes, or use a native full PostgreSQL dump.
- Exact counts differ from catalog estimates; the export manifest must use exact counts, not `reltuples`.
- This is still an audit artifact, not a raw data export. Full export remains pending.
