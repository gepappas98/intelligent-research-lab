# Next Research Tests — manual batch queue

Run these in order when the user requests a new research batch. This is a conclusions-only workflow: targeted read-only analysis, no raw database export, no scheduled refresh, no production strategy changes.

1. **Reconcile paper PnL and provenance.** Join resolved cases to canonical trade IDs, entry source, timestamps, exit reason, fees and net PnL. Persist query/window/cohort metadata and stable source IDs in the resulting conclusion.
2. **Resolve repeated-buy missing outcomes.** The captured ledger had 2,652 rows and 2,622 null net-PnL values; do not infer strategy quality until outcome maturity and unresolved reasons are explained.
3. **Measure gate rejection reasons before tuning.** For Early Entry, count rejections at telemetry freshness, transition age, both breadth-change conditions, and whale turning-positive separately; compare offline-only counterfactuals without changing production logic. For Event → Flow, reconcile WAITING_DATA / NOT_CONFIRMED / ALREADY_OPEN / COOLDOWN / OPEN_FAILED / OPENED counts to saved input timestamps and eventual outcomes. Rejected candidates are not labelled wins/losses.
4. **Diagnose Standard BUY and Event Flow Paper.** Segment by regime, symbol concentration, gate diagnostics, entry context and exit reason. Preserve adverse findings; do not change gates before diagnosis.
5. **Evaluate Early Entry decisions.** Link `NO_ENTRY` and `PAPER_OPEN` decisions to eventual outcomes and persisted gate diagnostics. Confirm canonical regime telemetry freshness and deployed code version; current 6-case resolved sample is too small for an edge claim.
6. **Replicate CMC Paper.** The captured 114-case sample was slightly positive (+$232.8319 total net, +$2.0424 mean); verify fee accounting/cohort and evaluate frozen logic on a later non-overlapping window.
7. **Recompute V2 benchmark accounting.** Freeze window/cohort filters, keep expired cases explicit, verify recorded PnL semantics and report unresolved fraction and net-of-cost expectancy. Never merge with V3 or executed paper trades.
8. **Check storage compaction effect.** Compare serialized `pipeline_runs` size growth in new runs after summary compaction; do not rewrite historical runs for this research transfer.
9. **Retain full provenance gaps.** Any old aggregate without run IDs, exact query/window, or stable source IDs remains provisional. Do not invent missing metadata.
10. **Promote findings only after falsification.** Record counterevidence and test on an independent window before changing status from exploratory to replicated.
11. **Micro-gate ablation (offline only):** split ordinary micro-trend rejection from the stricter BTC-downtrend confirmed-bounce gate and whale-divergence override. Record per-gate inputs/freshness/reason and join to eventual net-of-fee outcomes; compare frozen variants only on a non-overlapping window. Missing BTC data must remain “unconfirmed,” not be relabeled bearish.
12. **Benchmark contract audit:** verify the deployed dashboard calls the V3-specific RPC and records source-fingerprint prefix, window, outcome treatment (including expired), PnL units and query timestamp. Source code alone does not prove deployment parity.
13. **MTF coverage sensitivity:** stratify resolved outcomes by available 4h/1h/1d frame count and direction. A score of +1 can arise from only one available bullish frame because missing frames are excluded from the denominator. Preserve coverage metadata and test any minimum-coverage threshold offline.
14. **Research-mode risk counterfactual:** confirm the deployed caller still maps paper mode to researchMode=true, then count cases that would have hit normal-mode max-position, daily-loss, portfolio-risk, or loss-streak brakes. The loss-streak check uses gross pnl while equity/daily calculations can fall back to fee-aware net_pnl; quantify discrepancies before comparing cohorts.

15. **Whale Flow Shock horizon integrity:** verify the canonical production migration/version and refresh status before using follow-up labels. For every `complete_15m/1h/4h/24h` row, require both its matching flow delta and BTC return; report label counts, paired-field null counts, and refresh time. Treat the historical 546-labeled/144-priced 24h audit as a dated finding, not current truth. No production migration or refresh in this research step.

16. **Execution audit counterfactual coverage:** inspect representative `pipeline_runs.result.execution_audit.events` and risk-engine outputs for the same run. Determine whether normal-mode risk metrics, equity, open-position exposure, realized PnL, and the timestamped decision inputs are recoverable per candidate. Do not infer “would pass” from no rejection when paper research mode bypasses brakes. Mark missing inputs unknown; design only compact, versioned research telemetry without altering execution.

17. **V3 benchmark RPC/deployment parity:** verify the deployed migration definition and published panel version; confirm the dashboard, auto-switch and diagnostic all use `get_variant_performance_v3`. Record the exact fingerprint prefix, window, expired-outcome treatment, PnL unit and query timestamp. The generic `get_variant_performance` excludes both V2 and V3 prefixes at the reviewed source revision and must not be treated as V3. Source wiring alone is not production verification; no migration or deploy in this research step.

18. **Resolver maturity and fetch-failure audit:** establish which resolver PR/code revision is actually deployed; count matured rows still open, fetch-failure events, rows blocked for no relevant candle, and terminal outcomes by resolver version. Keep missing-data cases unresolved and do not infer expiry/loss or fabricate prices. Do not change resolver deployment or historical rows in this research step.
19. **Execution-capacity observation coverage:** quantify how many candidate/rejection paths create `execution_capacity_observations` and which fields are recoverable by pipeline run. Treat this as a max-open rejection log, not a complete candidate ledger; reconcile with execution audit and mark absent normal-risk counterfactual inputs unknown. No production telemetry or execution change.

20. **Whale Flow Shock paired-horizon coverage:** verify whether migration `20261009050000_fix_whale_flow_shock_data_quality.sql` is applied in canonical production; count rows labeled complete by horizon and rows with both flow delta and matching BTC return. Keep raw snapshots/transitions unchanged. Do not use incomplete paired horizons for causal/predictive conclusions; no production migration or refresh without explicit approval.

21. **Execution-audit fallback integrity:** quantify pipeline runs where trade-executor returned no `execution_audit` and the orchestrator synthesized the default empty audit. Separate audit-present from fallback-generated records; mark candidate counts and coverage unknown for fallback rows rather than interpreting zero counters as true zero. Read-only audit; no execution or production code changes.

22. **Pipeline/executor status consistency:** read-only count runs whose top-level `pipeline_runs.status` is completed while the stored `trade-executor` stage has `ok=false` or non-2xx status. Cross-tabulate audit presence/status and actual opened trades. Do not classify these as successful zero-entry runs; no production code changes.

23. **V3 expiry-aware performance reporting:** for each V3 preset and identical window, report wins, losses, expired, open, decision win rate `wins/(wins+losses)`, all-resolved win share `wins/(wins+losses+expired)`, expiry share, and PnL contribution from expired cases. Preserve the current cohort and outcome rows; analysis/reporting only.

24. **V3 ambiguous-outcome coverage:** count `outcome='ambiguous'` separately by preset and source fingerprint; compare it with `resolved + open` shown by the panel. Report terminal cases and scored cases separately, preserve `pnl_pct=NULL`, and do not coerce ambiguity to a financial outcome. Read-only analysis/reporting.

25. **V3 runtime-settings provenance:** compare the panel fallback constants with canonical `pipeline_settings` values and identify runs/windows where runtime settings are missing or differ. Separate runtime-confirmed from fallback-only assumptions; read-only, no setting changes.

26. **Resolver partial-write reconciliation:** compare `candidates`, `resolved`, `db_update_failed` audit events, candle-fetch blocks, and remaining open rows by invocation. Quantify successful, failed, and blocked outcomes separately; read-only.

27. **Gross-versus-net V3 counterfactual:** document the current gross-return definition and, only where fee assumptions are evidenced, compute a separate net-return sensitivity with explicit assumptions. Keep original `pnl_pct` unchanged; don't compare gross V3 directly with fee-adjusted paper PnL as if identical.

28. **Resolver batch starvation and selection coverage:** for matured and regular open cohorts, reconstruct selected IDs per invocation and measure oldest age, repeat selections, time-to-resolution, and never-selected rows under changing counts. If historical per-ID audit is unavailable, mark coverage unknown; no production changes.

29. **V3 strategy-name coverage:** list all distinct strategy names returned by the V3 RPC and compare them with the panel's fixed `PRESET_ORDER`; quantify rows/cases/PnL belonging to names not rendered. Read-only; no automatic rename or reclassification.

30. **V3 maturity-matched comparison:** report entry-age distribution, resolved/open/expired/ambiguous coverage by strategy, and results on matched entry cohorts with a common follow-up horizon. Keep open outcomes censored and preserve the original rolling-seven-day view as a separate descriptive metric.

31. **Early Entry whale-flow query coverage:** measure one-hour `whale_alerts` volume against the 3,000-row cap, inspect whether query ordering is deterministic, and compare accumulation/distribution totals with a reproducible bounded cohort. Record row count, time coverage, and state differences; offline/read-only, no production gate changes.
