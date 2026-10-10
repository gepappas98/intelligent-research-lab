# P0 Infrastructure & Data Audit

**Project:** Intelligent Research Lab (IRL)  
**Repository:** https://github.com/gepappas98/intelligent-research-lab  
**Audit status:** Initial reconnaissance — not a full security or semantic audit  
**Rule:** Read-only inspection only. No database schema, data, execution logic, or deployed application has been changed.

## 1. Repository baseline

- Repository is private and accessible to the connected GitHub integration.
- Default branch: `main`.
- Initial repository contained only `README.md` and `LICENSE`; no application code or migrations were present at the time of inspection.
- IRL is a separate project. Do not copy the existing application or point this repository at a production Supabase project until the architecture and isolation plan are approved.

## 2. Source-system identity — unresolved P0

The existing application is available at `gepappas98/pixel-perfect-pixels`. Prior project history indicates that Lovable, Vercel, the repository and Supabase may not all reference the same backend.

Observed during reconnaissance:
- The existing repository contains a tracked `.env` file with Supabase-related variable names.
- The Supabase project ID values in that file did not match the two project IDs initially inspected through the connected Supabase account.
- The environment file values were not copied into this document.
- The file inspected contained publishable-key variable names; this check did **not** establish that a privileged service-role key was exposed.
- A literal deployment URL could not be verified from the inspected environment-file representation.

**Required action:** identify the authoritative Supabase project IDs separately for the deployed Lovable app, Vercel deployment, GitHub configuration, scheduled jobs and Edge Functions. Do not assume project equivalence from names alone.

## 3. Database size and growth risk

Read-only SQL inspection of the Supabase project labelled as the main Trading Command Center project returned:

- Database size: approximately **435 MB** (456,223,891 bytes) at inspection time.
- `pipeline_runs` is the dominant storage concern: prior inspection reported approximately **229 MB** total relation size, with roughly **228 MB** associated with TOAST storage.
- 2,006 `pipeline_runs` rows had a non-null `result`; average stored result size was about **83 KB**, 95th percentile about **111 KB**, maximum about **116 KB**.

This is a point-in-time measurement, not a growth-rate forecast. Before setting a collection pause threshold, measure daily growth and available provider limits. Do not delete or rewrite historical payloads as part of this audit.

## 4. Source data inventory — preliminary counts

The following counts came from read-only queries and should be rechecked against the authoritative project after project identity is confirmed.

| Source table | Observed rows / state | Research implication |
|---|---:|---|
| `composite_signals` | 30,537 rows | Candidate signal source; verify identity, time semantics and immutable-at-entry fields |
| `strategy_variant_signals` | 15,164 total; 8,771 resolved; 6,393 unresolved | Candidate research outcomes; validate resolution and PnL semantics before reuse |
| `trades` | 344 rows; all returned as open in the inspected grouping | Not a verified final-outcome source based on this query alone |
| `pipeline_runs` | 2,006 rows with non-null result | Large payload storage; avoid copying complete run JSON into IRL |
| Recent pipeline runs | 553 completed rows in the inspected 24-hour window; latest observed start 2026-10-10 06:00:01 UTC | Status/error fields alone do not prove end-to-end data correctness |

### Preliminary signal-field coverage

From 30,537 `composite_signals` rows:

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

## 6. Open questions before schema design

- Which Supabase project is the source of truth for each deployed application and Edge Function?
- What is the actual primary key and update behavior of each candidate source table?
- Which timestamps represent event time, source update time, ingestion time and resolution time?
- How are signal, entry, episode, shadow position and trade related?
- What exactly triggers `resolved_at`, and are outcomes recalculated after resolution?
- How are TP/SL, expiry, candle ordering, fees and slippage implemented in each existing evaluator?
- Which historical context values can be reconstructed reliably, and which are genuinely unavailable?
- What are the provider's current hard storage limits and maintenance headroom?

## 7. Next steps

1. Confirm the authoritative project IDs and deployment mapping.
2. Inspect relevant DDL, indexes, constraints, foreign keys, triggers, RPCs, RLS policies, Edge Function source and schedules.
3. Trace signal identity and outcome lifecycle end to end with representative records.
4. Produce a field-level data dictionary and source-to-IRL mapping.
5. Approve the data contract and storage budget.
6. Only then draft a schema migration for a separate IRL database/schema.

## Safety boundary

This document records preliminary findings, not a certification of system health or data correctness. The audit did not alter the existing Trading Command Center, execute trades, write to its tables, or apply migrations.
