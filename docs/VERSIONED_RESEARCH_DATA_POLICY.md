# Research Knowledge Transfer Policy — conclusions only

## Purpose
Intelligent Research Lab (IRL) is a research and intelligence repository. The deliverable transferred from the source project is **the accumulated research knowledge**: what was tested, what worked or failed, which strategies/techniques/triggers were applied, what outcomes were observed, and what remains uncertain.

**Do not export or mirror the source database.** No bulk table dumps, raw event histories, copied full JSON payloads, or database bootstrap archive are required for this workflow. The canonical source database remains intact and is queried only when the user chooses to perform a manual research refresh.

## Required research artifacts
- Conclusions and lessons with stable IDs and manual recording timestamps.
- Strategy/technique/trigger catalog: hypothesis, actual implementation/version, status, and measured outcome.
- Outcome evidence: sample size, cohort/version, evaluation window, outcome definition, PnL unit, expectancy, drawdown when available, costs/fees assumptions, and unresolved count.
- Provenance: source project ref, source table or run/record IDs where safely available, source code commit/PR, matching/scorer version, and exact window. If provenance is missing, explicitly label it missing rather than inventing it.
- Counterevidence, confidence, limitations, and a concrete next falsification test.
- Clear evidence classes: historical benchmark, shadow result, paper position opened, resolved paper trade, realized PnL, and live result. Never conflate them.

## Interpretation rules
- Keep Legacy, V2, V3 and actual paper-execution cohorts separate.
- Do not call unrealized PnL realized profit.
- Do not call a historical simulation a live result.
- Preserve negative results, failed triggers, null outcomes, defects and abandoned hypotheses; these are research knowledge too.
- No silent overwrites: append new findings and supersede earlier conclusions explicitly with provenance.
- Do not infer causality from correlation or promote an edge from an in-sample result alone.
- Distinguish measured facts from interpretation and from future hypotheses.

## Manual-only refresh
The user decides when a research refresh happens. Do not schedule cron jobs, automations, background refreshes, or recurring exports. A manual refresh may run targeted read-only queries to derive new conclusions; store the compact conclusions and provenance, not the source rows.

## Security and source integrity
- Canonical source project ref: `yckewtpfttvwiptmmrfq`.
- Never write to, reset, truncate, or delete from the source database for this workflow.
- Never commit credentials, `.env` files, service-role keys, auth/session material, or sensitive wallet identifiers.
- Do not copy secrets or sensitive personal data into research artifacts.

## Current status
The conclusions-only ledger and source-backed findings snapshots have been started in `research/`. Some historical claims still lack original run IDs, exact windows or complete matching provenance. Treat those as provisional until the relevant evidence is retrieved. The next task is to enrich the conclusions catalog from existing code history and targeted source-backed aggregates—not to run a database export.
