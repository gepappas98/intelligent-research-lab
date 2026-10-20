# Next Research Tests — manual batch queue

Run these in order when the user requests a new research batch. This is a conclusions-only workflow: targeted read-only analysis, no raw database export, no scheduled refresh, no production strategy changes.

1. **Reconcile paper PnL and provenance.** Join resolved cases to canonical trade IDs, entry source, timestamps, exit reason, fees and net PnL. Persist query/window/cohort metadata and stable source IDs in the resulting conclusion.
2. **Resolve repeated-buy missing outcomes.** The captured ledger had 2,652 rows and 2,622 null net-PnL values; do not infer strategy quality until outcome maturity and unresolved reasons are explained.
3. **Diagnose Standard BUY and Event Flow Paper.** Segment by regime, symbol concentration, gate diagnostics, entry context and exit reason. Preserve adverse findings; do not change gates before diagnosis.
4. **Evaluate Early Entry decisions.** Link `NO_ENTRY` and `PAPER_OPEN` decisions to eventual outcomes and persisted gate diagnostics. Confirm canonical regime telemetry freshness and deployed code version; current 6-case resolved sample is too small for an edge claim.
5. **Replicate CMC Paper.** The captured 114-case sample was slightly positive (+$232.8319 total net, +$2.0424 mean); verify fee accounting/cohort and evaluate frozen logic on a later non-overlapping window.
6. **Recompute V2 benchmark accounting.** Freeze window/cohort filters, keep expired cases explicit, verify recorded PnL semantics and report unresolved fraction and net-of-cost expectancy. Never merge with V3 or executed paper trades.
7. **Check storage compaction effect.** Compare serialized `pipeline_runs` size growth in new runs after summary compaction; do not rewrite historical runs for this research transfer.
8. **Retain full provenance gaps.** Any old aggregate without run IDs, exact query/window, or stable source IDs remains provisional. Do not invent missing metadata.
9. **Promote findings only after falsification.** Record counterevidence and test on an independent window before changing status from exploratory to replicated.

