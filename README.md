# Intelligent Research Observatory

A responsive, research-only command center for viewing signal/trade outcomes, strategy cohorts, source freshness, data-quality issues and Council lessons.

## Open in Lovable

1. Connect this GitHub repository to a **new, separate Lovable project**.
2. Let Lovable install the dependencies and preview the Vite/React UI.
3. The first load is intentionally a clearly labelled **Demo preview**. Those rows and metrics are illustrative; they are not production data.
4. To enable live reads, add these Vite environment variables in the Lovable project settings:
   - `VITE_SUPABASE_URL`: URL of the explicitly approved research/archive Supabase project.
   - `VITE_SUPABASE_ANON_KEY`: that project's public anon key, with read-only SELECT policies.
5. Refresh the page. The connection indicator changes to **Source connected**. Unmapped tables are shown explicitly in Data Quality.

## Read-only source integration

The UI only calls Supabase `select()`; it contains no insert/update/delete, RPC, Edge Function invocation, trade execution, or strategy mutation. Never put a service-role key in a browser app. Use a public anon key and enforce SELECT-only RLS policies on the approved source.

Table discovery uses these candidate names, in order:

| UI area | Candidate tables |
| --- | --- |
| Trade outcomes | `trades`, `paper_trades`, `trade_outcomes` |
| Council lessons | `council_lessons`, `ai_council_lessons`, `research_lessons` |
| Research evidence | `research_evidence`, `signal_evidence`, `evidence_snapshots` |
| V3 / strategy variants | `strategy_variant_signals`, `variant_signals`, `v3_benchmark_results` |
| CMC context | `cmc_observations`, `cmc_snapshots`, `coinmarketcap_snapshots` |

The schema is not migrated by this repository. If the source uses different names, update the candidate arrays in `src/App.tsx` after verifying the actual schema. The client loads up to 150 recent rows per source for an initial UI prototype; this is not a complete historical export or statistical-grade calculation. A production analytics layer should use audited views and pagination/aggregations.

## Research safeguards

- Research-only: no orders and no writes to execution tables.
- Keep entry-time snapshots separate from later outcomes.
- Preserve source IDs and timestamps where available; don't merge duplicate events by symbol alone.
- Use V3-aligned MTF comparisons; do not blend Legacy/V2 into active cohort scores.
- CMC is market context/discovery, never a standalone BUY vote.
- Treat lessons as hypotheses; no automatic strategy switching or threshold updates.
- Demo values are never presented as live data.

## Local development

```bash
npm install
npm run dev
npm run build
```

Required environment variables are optional for demo preview and required for live reads.
