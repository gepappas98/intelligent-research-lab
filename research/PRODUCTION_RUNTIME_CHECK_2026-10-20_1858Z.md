# Production Runtime Follow-up — 2026-10-20 18:58 UTC

Scope: read-only review of canonical Supabase logs for 18:00–18:58 UTC. This file contains aggregate diagnostics only; no raw production rows, credentials, or payload dumps.

## Trading watchdog and exits

- `trade-position-watchdog` emitted 42 `status=ok` summaries in the inspected log grouping; latest at 18:57:06 UTC reported 36 open positions, zero exit-due, zero unavailable prices, zero raised/escalated alerts, no errors, and no live auto-close behavior.
- One paper stop-loss close was recorded at 18:43 UTC and one paper take-profit close at 18:48 UTC. The 18:50 `trade-exit` run reported 36 open BUY positions held, no missing prices, no legacy SELL positions, no live pending exchange orders, and no errors.
- These log observations are not a full trade-ledger reconciliation; reconcile against `trades` before using them as performance statistics.

## Council bridge

- `council-sync` had three outer Edge Function requests in the inspected interval, all HTTP 200, with mean execution around 1.82 seconds; latest at 18:50:09 UTC.
- Inner Lovable AI bridge logs included a transient HTTP 502 at 18:30:07 UTC, with successful calls at 18:10:12 and 18:50:09 UTC. The outer endpoint remained HTTP 200 in the three sampled requests. This supports resilience of the outer endpoint but does not by itself prove every fallback result was persisted.

## Database/API latency warning

- `postgrest_logs` contained 177 entries matching `Warp server error: Thread killed by timeout manager` during 18:00–18:58 UTC, with bursts around 18:16, 18:25, 18:31, 18:35, 18:45, 18:51, and 18:56.
- The generic PostgREST message did not include a request path, so this sample cannot identify the specific RPC/table causing the timeouts. Edge Function request logs in the same window showed no 500/502/503/504 status rows, but that does not prove PostgREST RPCs are healthy.
- Next diagnostic: correlate PostgREST timeouts with fresh direct calls to `get_research_archive_status`, `get_system_resource_stats`, `get_variant_performance_v3`, and snapshot-table reads; capture latency/status and avoid running a broad scan merely to test health.

## Change status

No production DDL, scoring, trade gate, retention policy, or live-order behavior changed during this check. Research-knowledge sync and execution-audit coverage fixes remain review/deployment-gated; production must not be assumed to run either change until a deployed stage/version and a subsequent successful run are verified.
