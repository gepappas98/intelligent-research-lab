# Execution Audit Coverage Defect — Signal IDs vs Event Confidence

**Observed:** 2026-10-20 UTC, canonical Supabase `yckewtpfttvwiptmmrfq`.
**Scope:** read-only inspection of recent `pipeline_runs.result.stages` and the active `trade-executor` code. No trading behavior was changed.

## Production evidence

The `trade-executor` summary computes `audited_eligible_signals` by filtering audit events on `Number(event.confidence) >= MIN_CONFIDENCE`. However, gate events such as `PER_SYMBOL_CAP`, `MICRO_TF_GATE`, and `MARKET_REGIME_GATE` commonly include `signal_id` but omit the optional `confidence` field. The summary therefore mistakes an existing decision record for an uncovered signal.

In the last 24 hours, 12 inspected recent runs showed the following pattern:

| Run start UTC | Eligible signals reported | Audit events | Distinct eligible signal IDs with an event | Reported audited | Reported uncovered |
|---|---:|---:|---:|---:|---:|
| 17:50 | 5 | 5 | 5 | 0 | 5 |
| 17:40 | 16 | 17 | 16 | 1 | 15 |
| 17:30 | 13 | 14 | 13 | 1 | 12 |
| 17:20 | 11 | 11 | 11 | 1 | 10 |
| 17:10 | 10 | 10 | 10 | 2 | 8 |
| 17:00 | 10 | 10 | 10 | 2 | 8 |
| 16:50 | 14 | 14 | 14 | 1 | 13 |
| 16:40 | 10 | 10 | 10 | 2 | 8 |
| 16:30 | 12 | 12 | 12 | 3 | 9 |
| 16:20 | 12 | 12 | 12 | 3 | 9 |
| 16:10 | 4 | 6 | 4 | 1 | 3 |

The distinct eligible IDs were independently checked by joining audit event IDs to `composite_signals.confidence >= 0.6`. For these observed runs, every eligible signal had a matching audit event, despite the reported uncovered counts. In the 17:50 run, all five events lacked `confidence`, which caused the summary to report zero audited and five uncovered even though all five stable signal IDs were present.

## Root cause

The metric uses an optional descriptive field on the audit event as the join key for coverage. That field is not populated on every gate path. The stable `signal_id` is present and is the correct identity for measuring whether an eligible signal received a decision record.

## Proposed correction

Draft [PR #135](https://github.com/gepappas98/pixel-perfect-pixels/pull/135) adds a pure `summarizeEligibleSignalAudit` helper that:

- defines eligibility from source signal confidence;
- builds the eligible set by stable signal ID;
- counts matching audit event IDs regardless of whether an event repeats the confidence field;
- de-duplicates event IDs; and
- reports uncovered signals only when an eligible ID has no event.

Three regression tests cover gate events without confidence, a genuinely missing event, and duplicate events. This is telemetry-only: it does not change scoring, quality gates, exposure limits, trade entry/exit decisions, or live orders.

## Validation state

The first CI run for PR #135 passed the new execution-audit tests (3/3) but failed the pre-existing candle-integrity test because its local helper omitted `captured_at >= close_time`. That helper has been corrected in the PR branch to match the already-required production invariant. Recheck CI for the latest commit before review/merge.

## Change status

No production deployment or trading decision was changed. The defect is in the reported audit coverage metric; the underlying observed gate decisions already have signal IDs. Do not interpret the reported `uncovered_eligible_signals` as evidence that the signals were unprocessed until this accounting bug is corrected and the next production run is checked.
