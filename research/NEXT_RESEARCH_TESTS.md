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

32. **Archive status consistency:** inspect duplicate status keys in cleanup function responses and compare reported flags with control settings. Read-only; do not invoke cleanup.

33. **Event→Flow duplicate-entry exposure:** compare open Event→Flow trades against the newest-500 preflight window and audit same-asset opens by overlapping invocation time. Read-only; code risk is not proof it occurred.
34. **Early Entry confluence query integrity:** separately count query errors, empty results, stale inputs, and valid council/sentiment/price data; do not collapse query failure into absence.
35. **Early Entry trade-to-decision reconciliation:** join B/C paper trades to decision ledger rows using `trade_id` and `signal_key`; count orphan trades and orphan decisions; read-only.
36. **Candle collector universe coverage:** compare symbols selected from recent 5m indicator snapshots (including the 500-row cap) with intended tracked/watchlist and downstream candidate universes; quantify omitted assets and stale coverage.
37. **Archive runtime state verification:** inspect applied migration history and `research_archive_control` values before describing archive/cleanup as active. Do not enable archive or source deletion as part of this audit.

38. **Early Entry capped-input coverage:** measure row counts, distinct assets, age ranges, and cap-hit indicators for 1h indicators, 5m candles, council, sentiment, and prices; compare against the intended watchlist. Read-only.
39. **Research-case source-index trade-off:** inspect applied index state, index/table sizes, and representative source-lookup plans/timings. Do not recreate indexes until storage headroom is reviewed.

40. **CMC snapshot freshness:** report `dynamic_watchlist_snapshots.computed_at` and `cmc_listing_snapshots.captured_at` age at CMC paper entry; separate fresh Spot price from potentially stale CMC context.
41. **CMC active-position preflight coverage:** compare all open CMC paper trades against the newest-1,000 trade query and inspect same-symbol opens by invocation time. Read-only; don't infer duplicates from source alone.

42. **Manual-refresh policy parity:** verify whether the deployed pipeline includes the post-mortem `refresh_research_knowledge_cases(72)` call and whether the RPC is installed; record invocation frequency and side effects without calling it. Preserve the manual-refresh policy; no cron, deployment, or production changes.

43. **Archive state and materialization parity:** compare the source-reported 2026-10-20 controls/counts with a separately authorized live read after user-controlled Lovable sync. Keep `allow_archive=false` and `allow_source_delete=false`; no cleanup invocation.
44. **Event→Flow decision-history sufficiency:** verify whether any append-only decision source exists; compare current per-asset upsert state with available historical snapshots. Do not infer past gate frequencies from latest-state rows.
45. **Council lesson idempotency:** group `council_lessons` by `source_trade_id`, compare to `trades.post_mortem_generated`, and separately count duplicate lessons and flag-update inconsistencies. Read-only.
46. **Research knowledge sample coverage:** for each table read by `readKnowledge()`, compare exact count with returned sample count (250 default; 100 for evidence/findings), report truncation and errors, and keep bounded snapshots separate from full-history claims.

47. **Closed-candle taker imbalance:** compare Early Entry's current latest-per-symbol 5m candle selection with a closed-candle-only selection (`close_time <= observed_at`); quantify incomplete-candle contribution and score differences without changing production gates.
48. **Event→Flow global input coverage:** measure eligible RSS/flow/price rows and distinct assets against limits 100/200/200; quantify assets omitted from the latest-per-asset maps. Read-only.

49. **Council lesson consistency:** verify lesson outcomes against the linked trade result; count mismatches without editing historical rows.

50. **Knowledge refresh query scope:** inspect query plans and row counts for each source read by `refresh_research_knowledge_cases`; verify whether the 72-hour parameter bounds it, and measure full-table trade/signal scans. Do not invoke the RPC; read-only source/plan review first.
51. **Final migration function contract:** apply the full migration chain only in an ephemeral test database and assert the final `refresh_research_knowledge_cases` definition is V3-only if that remains the intended contract; confirm V2/Legacy are not auto-materialized. Never run against production as part of this test.
52. **Auto-switch sample eligibility:** unit-test every deterministic, AI, no-qualified-positive, and confirmed-Bear branch with cohorts at 7, 8, 24, and 25 resolved cases and positive/negative average PnL. Verify one consistent eligibility rule and that an undersampled preset cannot be selected unintentionally. No production switch.

53. **Legacy zero-net-PnL compatibility:** count closed trades where `net_pnl=0` and legacy `pnl<>0`; quantify the difference between archive-case PnL and the established fee-aware fallback. Read-only; no data repair.
54. **Migration regression fixture:** extend only the ephemeral integration test with V2, Legacy, Unknown and V3 fingerprints, and assert final post-chain behavior for each. Do not use production data.
55. **Lifecycle/economic outcome separation:** inventory consumers of `research_cases.outcome`; verify that trade rows labelled `closed` are not treated as win/loss labels and that PnL units/basis are handled by source table. Read-only.

56. **Early Entry exit-policy provenance:** compare B/C entry TP/SL values and active max-hold/stale-exit settings at close; keep the resulting cohort distinct from V3 +4%/−3%/72h benchmarks unless policy parity is demonstrated.
57. **V3 terminal/resolution invariant:** count rows where `outcome IN ('win','loss','expired')` but `resolved_at IS NULL`, and rows with a non-terminal outcome but non-null `resolved_at`. Compare RPC and knowledge-case coverage; read-only.

58. **Live archive backlog:** record the aggregate result of `get_research_archive_status(72,168)` with both archive/delete controls still false; compare eligible/archived/missing counts by table. Read-only; never call cleanup in non-dry-run mode.
59. **Live V3 case reconciliation:** reconcile all 2,115 source V3 rows to `research_cases` by stable source ID; classify missing cases separately from stale open cases for terminal source outcomes. No bulk refresh or source mutation.
60. **Live paper-trade case reconciliation:** compare all source trades with cases/evidence by stable IDs; classify missing open/closed cases and status/PnL/resolution mismatches. Preserve source rows and defer repair until manual-refresh policy is approved.
61. **Applied migration vs active function:** compare the migration ledger, checked-in migration files and live `pg_get_functiondef` output in a read-only audit; explain the V3-only runtime body vs broader checked-in migration without reapplying migrations.
62. **Refresh observability:** verify whether final orchestrator persistence overwrites `research_knowledge_sync` telemetry; design a compact merge/preserve contract and prove status is retained in ephemeral tests before any approved source deployment.

63. **Live execution-audit coverage:** for the latest 50 completed pipeline runs, reconcile eligible BUY, audited eligible, and uncovered counts; identify runs with eligible signals but zero audit coverage. Keep per-run denominators and no-inference rules.
64. **Recorded rejection taxonomy:** stratify recorded audit events by stage/reason and compare with uncovered-signal counts; report micro-data freshness, confidence, per-symbol-cap and sideways-gate counts without changing any production threshold.

65. **Archive timestamp provenance:** compare `last_archive_at` with the latest `captured_at` for retention-source tables only; ensure general trade/variant evidence cannot make an empty archive appear recently archived.

66. **Storage guard reconciliation:** compare `private.storage_capacity_guard_state.paused_jobs` with actual `cron.job.active` values and test whether a latched guard can re-pause reactivated jobs. Read-only first; no cron/guard changes without explicit approval.
67. **Storage footprint prioritization:** trend `pg_database_size` and table-plus-index sizes for shadow diagnostics, composite signals, variants, pipeline runs, whale alerts, candles and accumulation observations. Use exact sizes, not stale tuple estimates; no deletion.

68. **Storage watchdog re-entry:** inspect the guard's latch/reset policy and cron activation history; prove how a later threshold re-crossing is handled after a prior trigger and database shrink. Read-only/ephemeral simulation only; no production scheduling changes.

69. **Repeated-BUY outcome maturity:** reconcile 2,729 ledger rows by entry cohort and resolution state; keep 2,694 null-PnL rows unresolved and report resolved-only results separately. Do not impute missing PnL.
70. **Storage driver exact counts:** compare exact row counts, table-plus-index sizes and growth trends for diagnostics, composite signals, variants, pipeline runs, whale alerts, candles and accumulation observations; treat `pg_stat_user_tables` tuple estimates as approximate only.

71. **Retention-to-storage alignment:** compare the proposed nine-table archive scope with the largest live table-plus-index consumers; identify growth/retention controls for the largest tables before any cleanup proposal. No archive enablement or source deletion.

72. **Early-entry candle lineage / look-ahead audit:** inspect the exact scorer/collector code and `metrics.candle_symbols`; prove for each 5m/15m input whether the candle was closed and available at decision time. The first read-only join was inconclusive because decision rows do not provide a normalized source-candle ID/time tuple. Do not label this a confirmed defect or clean result until lineage is demonstrated. No production changes.

73. **Reject unfinished candles in early-entry paths:** regression-test `market-candle-collector`, `early-entry-variants`, and `early-entry-regime` so only candles with `close_time <= evaluation_time` can feed taker-buy imbalance, gates, scores, or candidate ranking. Collector must not treat the currently forming Binance kline as final. Record source candle open/close/capture timestamps in decision telemetry. Audit historical exposure before quantifying impact. Do not deploy a production fix without a separately reviewed change.


73. **Reject unfinished candles in production early-entry paths — deployed 2026-10-20**
   - Collector rejects `close_time >= capturedAt` before upsert.
   - Both `early-entry-variants` and `early-entry-regime` require `close_time < evaluationAt` and `captured_at <= evaluationAt` in SQL and repeat the checks in memory.
   - Regression file: `supabase/functions/tests/candle-integrity.test.ts` (Deno-native; run in GitHub Actions with `--allow-read=supabase/functions`).
   - Cases: exact close/evaluation equality rejected; just-closed candle accepted; delayed collection accepted only if captured before evaluation; capture after evaluation rejected; unfinished candle rejected; source assertions verify collector and both consumers.
   - Verification: 13/13 code-level assertions passed; deployed versions verified active (collector v3, variants v8, regime v13).
   - Preserve historical outcomes: exact affected decision/trade count remains unprovable because historical telemetry lacks immutable candle IDs/timestamps. No retroactive relabeling.
