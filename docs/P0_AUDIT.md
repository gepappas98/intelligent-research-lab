# P0 Infrastructure & Data Audit

**Project:** Intelligent Research Lab (IRL)  
**Repository:** https://github.com/gepappas98/intelligent-research-lab  
**Audit status:** Initial reconnaissance plus verified runtime project mapping; data semantics audit remains open  
**Rule:** Read-only inspection only. No database schema, data, execution logic, or deployed application has been changed.

## 1. Repository baseline

- Repository is private and accessible to the connected GitHub integration.
- Default branch: `main`.
- IRL is a separate project. Do not copy the existing application or point this repository at a production Supabase project until the architecture and isolation plan are approved.
- Project identity evidence is documented in [Supabase Project Identity Map](SUPABASE_PROJECT_MAP.md).

## 2. Source-system identity — runtime resolved; Lovable DB context remains open

The authoritative Supabase project for the Trading Command Center browser runtime and active Edge Functions is **`yckewtpfttvwiptmmrfq`** (`https://yckewtpfttvwiptmmrfq.supabase.co`).

Evidence:
- `supabase/config.toml` in `gepappas98/pixel-perfect-pixels` sets `project_id = "yckewtpfttvwiptmmrfq"`.
- `src/integrations/supabase/client.ts` explicitly pins the browser client to the canonical URL and publishable key if build-time values do not match both canonical values.
- `src/lib/mcp-diagnostic.server.ts` defines the same canonical project ref.
- Latest Lovable project commit and latest Vercel production deployment both reference `20d94cee54b48a13bf50843715de30d67aba64e7`.
- The canonical project has the expected active Edge Functions, including `trading-pipeline-orchestrator`, `trade-executor`, and `event-flow-lab`.

**Configuration drift found:** `gbbrmzstuhdizfvabjvz` appears in the tracked GitHub `.env` and Lovable project's `.env`, but it is not the canonical runtime target. The connected Supabase project-management API denied access to that ref, so its exact ownership and whether it is the Lovable attached database's ref remain unconfirmed.

**Separate Lovable database context found:** read-only queries through Lovable's attached database tool returned 21 public tables, 3,570 `composite_signals`, 641 `pipeline_runs`, 746 `strategy_variant_signals`, and zero `trades`, with latest signal/run timestamps on 2026-10-07. The canonical Supabase project returned 50 public tables, 30,537 `composite_signals`, 2,253 `pipeline_runs`, 15,164 `strategy_variant_signals`, and 344 `trades`, with latest rows on 2026-10-10. These are materially different database states.

The app's `drizzle.config.ts` reads `LOVABLE_DB_MIGRATION_URL`; the configured value was not exposed or verified. Vercel environment metadata could not be retrieved because the integration received HTTP 403 for the `gepappas-projects` scope. This does not negate the verified browser runtime mapping, but the migration target must be separately verified before running migrations.

See [the full evidence and project map](SUPABASE_PROJECT_MAP.md).

## 3. Database size and growth risk

Read-only SQL inspection of the canonical Trading Command Center Supabase project returned an earlier point-in-time database size of approximately **435 MB** (456,223,891 bytes). An earlier relation-size inspection reported:
- `pipeline_runs`: approximately **229 MB** total relation size.
- About **228 MB** associated with TOAST storage.
- 2,006 `pipeline_runs` rows had non-null `result`; average result payload about **83 KB**, p95 about **111 KB**, maximum about **116 KB**.

These are earlier measurements and not a current growth-rate forecast. Re-measure before setting a collection pause threshold. Do not delete or rewrite historical payloads as part of this audit.

## 4. Source data inventory — current read-only snapshot

Counts below were queried from the canonical project `yckewtpfttvwiptmmrfq` on 2026-10-10. They are point-in-time values and can change as collection continues.

| Source table | Observed rows / state | Research implication |
|---|---:|---|
| `composite_signals` | 30,537 rows | Candidate signal source; verify identity, time semantics and immutable-at-entry fields |
| `strategy_variant_signals` | 15,164 rows | Candidate research outcomes; validate resolution and PnL semantics before reuse |
| `trades` | 344 rows | Candidate execution records; outcome/closure semantics still need verification |
| `pipeline_runs` | 2,253 rows | Large payload storage; avoid copying complete run JSON into IRL |
| `public` tables | 50 | Canonical source schema inventory |

### Preliminary signal-field coverage

From 30,537 `composite_signals` rows in the earlier read-only coverage query:

- 24,875 had a fingerprint.
- 22,974 had a recorded price-at field.
- 28,245 had an indicator snapshot link.
- 9,615 had a prediction-market snapshot link.
- 22,895 had an AI Council signal link.

Coverage varies by field. IRL must track field-level availability and question-specific eligibility. Missing historical values must not be filled from current values.

## 5. Required IRL data contract

Before building ingestion or outcome calculations, define and test:

1. **Identity:** stable source system + source record ID/version, with a documented deterministic fallback only when needed.
2. **Bitemporal timestamps:** event/valid time separately from ingestion/knowledge time.
3. **Immutable initial snapshot:** conditions available at the initial signal time are stored once and never overwritten by later outcomes.
4. **Separate subsequent records:** material observation events and outcome revisions are stored separately with provenance and version.
5. **Outcome state machine:** versioned completion rules; distinguish observing, verified closed, horizon reached, censored, invalid and review-required cases.
6. **Net outcome:** define gross PnL, fees, slippage and other costs; distinguish simulated/shadow estimates from actual execution.
7. **No look-ahead bias:** later-known conditions may explain the path but cannot be treated as known at signal time.
8. **Idempotency:** safe retry does not duplicate observations or events.
9. **Data quality:** completeness, freshness, provenance, timestamp validity and explicit exclusion reasons.
10. **Storage guardrails:** measure daily growth, include TOAST and indexes, alert/throttle noncritical ingestion before the agreed safe ceiling.

## 6. Remaining questions before schema design

- What exact Supabase project ref backs Lovable's attached database tool, and what target is configured in `LOVABLE_DB_MIGRATION_URL`?
- Is Vercel environment metadata needed after the source-level canonical guard is confirmed? If so, restore access to the correct Vercel scope before reading metadata.
- What are the actual primary keys and update behavior of each candidate source table?
- Which timestamps represent event time, source update time, ingestion time and resolution time?
- How are signal, entry, episode, shadow position and trade related?
- What exactly triggers `resolved_at`, and are outcomes recalculated after resolution?
- How are TP/SL, expiry, candle ordering, fees and slippage implemented in each existing evaluator?
- Which historical context values can be reconstructed reliably, and which are genuinely unavailable?
- What are the provider's current hard storage limits and maintenance headroom?

## 7. Next steps

1. Verify Lovable's migration connection target without exposing the secret value; do not run migrations until verified.
2. Inspect relevant DDL, indexes, constraints, foreign keys, triggers, RPCs, RLS policies, Edge Function source and schedules on the canonical source project.
3. Trace signal identity and outcome lifecycle end to end with representative records.
4. Produce a field-level data dictionary and source-to-IRL mapping.
5. Approve the data contract and storage budget.
6. Only then draft a schema migration for a separate IRL database/schema.

## Safety boundary

This document records observed facts and remaining questions, not a certification of system health or data correctness. The audit did not alter the existing Trading Command Center, execute trades, write to its tables, or apply migrations.


## 8. Addendum — wrong-repository archive state and dependency trace (2026-10-20)

This addendum supersedes earlier source-size/count snapshots only where explicitly stated. Earlier measurements above remain historical observations, not current values.

### Latest source-side archive snapshot

Read-only inspection of the canonical Trading Command Center project `yckewtpfttvwiptmmrfq` reported:

- Database size: **504,605,843 bytes (~481 MB)**.
- `research_evidence`: 3,019 rows; `research_cases`: 3,000 rows; `research_findings`: 0 rows; `research_archive_control`: 1 row.
- Archive capture and source deletion are both disabled.
- Retention preflight: 29,790 eligible source rows, 0 archived and 29,790 missing evidence. Coverage is incomplete; do not enable retention or delete source rows.
- Permissive `SELECT USING (true)` policies for `anon` and `authenticated` were observed on the archive tables. No policy changes have been made.
- The archive-specific applied migration history and cron dependencies are documented in [the containment plan](WRONG_REPO_CONTAINMENT_AND_ROLLBACK.md) and [dependency inventory](WRONG_REPO_DEPENDENCY_INVENTORY.md).

### Confirmed source application dependency paths

Read-only GitHub inspection of the current source `main` found:

1. `src/lib/pipeline.server.ts` calls `refresh_research_knowledge_cases({ p_lookback_hours: 72 })` after post-mortem generation, with an 8-second timeout and fail-open handling. A failure is logged/recorded; the code says the trading flow continues unchanged.
2. `src/lib/research-knowledge.functions.ts` reads `research_evidence`, `research_cases` and `research_findings`, and calls `get_research_archive_status(72,168)`.
3. `src/components/trading/ResearchKnowledgePanel.tsx` imports the server reader and displays the bounded research snapshot; the component is mounted from `src/routes/index.tsx` and `src/pages/AIReport.tsx`.
4. `src/lib/_tests_/research-knowledge.test.ts` covers pure temporal eligibility, cohort isolation, outcome maturity, evidence linkage and fail-closed archival contracts. Retain these tests where useful even if the wrong-repository persistence integration is later decoupled.
5. The archive-specific SQL functions are not isolated from the app yet. Dropping tables/functions before a separately reviewed caller-decoupling change would leave the current reader dependent on missing tables and the pipeline attempting a missing RPC.

### Material semantic limitation

The deployed refresh function uses source `created_at` as both `observed_at` and `available_at` for trades, composite signals and variant signals. Current source inspection does not establish that this is the actual event time or earliest strategy-availability time. The function also does not independently compute the 72-hour maturity boundary from entry time. Treat these generated archive timestamps/maturity labels as unverified; do not import them as authoritative IRL point-in-time facts.

### Current decision

Continue documentation and read-only source tracing only. No production export has yet been created or verified; no IRL writable database has been positively identified; no data has been copied; no source rows, archive tables, functions, policies, cron jobs, trading logic or deployments have been changed by this audit. The next safe phase remains destination identity verification and a secure, checksum-verified export plan before any rollback is considered.
