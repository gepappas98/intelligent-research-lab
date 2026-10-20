# Research evidence → conclusions → IRL intelligence

## Purpose and scope
IRL stores **research knowledge**, not a copy of the source database. Source records remain in the canonical research system. When the user chooses a manual refresh, targeted read-only queries and code/history review derive compact findings. Only conclusions, outcomes, implementation learnings and provenance are transferred.

## Operating model

```text
Existing source evidence + code/commit history (remain at source)
        │
        ▼
Manual, targeted analysis (named cohort, version, window, assumptions)
        │
        ▼
Measured observations + limitations + counterevidence
        │
        ▼
Append-only conclusion / lesson record
        │
        ▼
IRL intelligence index and strategy knowledge
        │
        ▼
Next falsifiable hypothesis (user-triggered manual run)
```

No full database dump, table mirror, bulk raw JSON, cron, scheduled automation or recurring refresh is part of this workflow.

## What each conclusion must retain
- Stable `conclusion_id` and UTC recorded timestamp.
- Source project ref; source table and record/run IDs when available; code commit/PR; matching/scorer version.
- Exact cohort (Legacy/V2/V3/paper/shadow/live), timeframe and frozen evaluation window.
- Hypothesis and test/control/counterfactual.
- Observed facts separated from interpretation.
- Sample count, wins/losses/expiry/open/unresolved counts, PnL unit, mean/total net PnL, fees/slippage and drawdown when available.
- Implementation status: proposed, implemented, deployed, observed, replicated, contradicted or retired. Do not equate implementation with success.
- Counterevidence, missingness, confidence/limitations, failure condition and next falsification test.
- Links to earlier or later conclusions that confirm, revise or contradict this finding.

If an original run ID, precise window or source identity is unavailable, mark it as missing/provisional. Never invent provenance to make a result appear reproducible.

## Evidence classes and interpretation
- Historical/shadow benchmark is not realized paper or live profit.
- Open-position PnL is not realized profit.
- Paper trades and live trades are separate.
- Legacy, V2 and V3 cohorts must never be blended without an explicitly justified common protocol.
- Null/unresolved outcomes are not zero, wins, or losses.
- Preserve adverse findings, failed triggers, defects and abandoned ideas; negative evidence is research knowledge.
- Correlation does not establish causality. Separate discovery samples from out-of-sample confirmation.
- Generated synthesis must resolve to conclusion IDs and evidence provenance; it must not overwrite the underlying ledger.

## IRL organization
- `research/RESEARCH_FINDINGS_AND_INTELLIGENCE_LEDGER_2026-10-20.md`: consolidated findings and implementation lessons.
- `research/SOURCE_BACKED_FINDINGS_2026-10-20.md`: manual point-in-time aggregate findings from targeted source queries.
- `research/NEXT_RESEARCH_TESTS.md`: next falsification tests.
- `docs/MATCHING_CONCLUSIONS_LEDGER.md`: append-only evidence/provenance contract.
- `docs/VERSIONED_RESEARCH_DATA_POLICY.md`: authoritative conclusions-only/manual-refresh policy.

## Manual refresh contract
When the user explicitly asks to continue or refresh:
1. Identify the exact source project and read-only evidence available.
2. Inspect relevant existing code history and targeted aggregate outcomes only.
3. Keep cohorts and PnL units separate; note source/time-window limitations.
4. Add a compact, source-linked finding or falsification task to the private IRL branch.
5. Re-read the committed artifact and verify its content.
6. Report only material completion or blockers; do not stop for repetitive status updates.

Do not schedule work, create background jobs, modify production trading behavior, or write to/reset the canonical source as part of research transfer.

## Current status
The conclusions-only policy is authoritative. Initial findings and next-test artifacts exist, but some historical claims lack original run IDs and exact matching metadata. The pipeline should be described as partially documented, not fully automated or fully reconciled, until those provenance gaps are closed.
