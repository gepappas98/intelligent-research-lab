# Intelligent Research Lab

An independent, research-only platform for evaluating crypto signals, strategies, entry ranks, market conditions and outcome paths.

## Core principles

- **Research only:** no trade execution and no writes to the Trading Command Center execution tables.
- **Immutable initial snapshots:** capture only information available at the signal time; never rewrite the initial snapshot when the outcome changes.
- **Separate later events and outcomes:** retain meaningful changes and outcome revisions as separate, traceable records.
- **Bitemporal provenance:** distinguish when something happened from when the system learned about it.
- **No look-ahead bias:** later-known information may explain an outcome path, but must not be presented as known at entry.
- **Reproducibility:** version completion rules, calculations, samples and experiments.
- **Data quality first:** expose missingness and uncertainty; never fabricate historical context or silently treat incomplete outcomes as losses or wins.
- **Storage safety:** avoid copying large upstream payloads; monitor table, TOAST, index sizes and growth.

## Project status

**Phase:** P0 forensic audit and data-contract definition.  
**No application code, schema migrations or production data changes are authorized by this repository bootstrap.**

Read [the preliminary P0 Infrastructure & Data Audit](docs/P0_AUDIT.md) for observed facts, unresolved questions and next steps.

## Planned research areas

1. Source inventory and data-quality checks.
2. Immutable observation snapshots and subsequent observation events.
3. Versioned outcome evaluation, including net PnL and costs.
4. Sequential samples and comparable cohorts.
5. Strategy Lab, Entry Rank Lab and Condition Discovery.
6. Statistical uncertainty, chronological out-of-sample validation and experiment registry.

## Initial implementation boundary

Start read-only against existing sources. Confirm GitHub, Lovable, Vercel and Supabase project identities before connecting anything. Keep IRL physically and logically isolated from live/paper execution paths. No automatic strategy switching or execution integration is part of v1.
