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

**Phase:** P0 forensic audit, knowledge consolidation and transfer preparation.  
**Production row transfer has not run:** the isolated IRL destination is now independently verified as Supabase project `ragdznxfozdpxetwisrd` (`intelligent-research-lab`, `eu-west-3`, `ACTIVE_HEALTHY`), separate from production `yckewtpfttvwiptmmrfq`. The existing archive contains only partial historical snapshots; no source rows have been deleted.

Read [the preliminary P0 Infrastructure & Data Audit](docs/P0_AUDIT.md) for observed facts, unresolved questions and next steps.

## Planned research areas

1. Source inventory and data-quality checks.
2. Immutable observation snapshots and subsequent observation events.
3. Versioned outcome evaluation, including net PnL and costs.
4. Sequential samples and comparable cohorts.
5. Strategy Lab, Entry Rank Lab and Condition Discovery.
6. Statistical uncertainty, chronological out-of-sample validation and experiment registry.

## Initial implementation boundary

Start read-only against existing sources. Confirm GitHub, Lovable and Supabase project identities before connecting anything. Keep IRL physically and logically isolated from live/paper execution paths. No automatic strategy switching or execution integration is part of v1.

## Transfer and data-contract work (draft PR)

- [Consolidated research knowledge ledger](docs/RESEARCH_KNOWLEDGE_LEDGER.md)
- [Machine-readable strategy and experiment catalog](docs/STRATEGY_CATALOG.json)
- [Source-preserving research data transfer runbook](docs/RESEARCH_DATA_TRANSFER_RUNBOOK.md)
- [Source export execution plan and migration-history caveats](docs/EXPORT_EXECUTION_PLAN.md)

The following documents are being reviewed on branch `research/knowledge-transfer-p0`; they do not authorize a database migration or production import:

- [Research knowledge transfer and source caveats](docs/RESEARCH_KNOWLEDGE_TRANSFER.md)
- [P0 bitemporal data contract and Legacy/V2/V3 cohort rules](docs/DATA_CONTRACT_P0.md)
- [Wrong-repository incident containment and rollback gates](docs/WRONG_REPO_CONTAINMENT_AND_ROLLBACK.md)
- [Wrong-repository dependency inventory, callers, SQL routines and cron jobs](docs/WRONG_REPO_DEPENDENCY_INVENTORY.md)

The IRL destination identity is now confirmed by the official Supabase project-management API. Transfer is still blocked pending review of the target schema/privileges, private export destination, consistent source snapshot, and exact ID/hash reconciliation. Do not run a production export/import or source cleanup as part of this documentation change.

Current database identity blockers and the latest destination recheck are documented in [the Supabase project map](docs/SUPABASE_PROJECT_MAP.md).
