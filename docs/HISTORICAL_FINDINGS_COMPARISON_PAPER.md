# Historical Findings and Clean-Sample Comparison Paper

**Status:** Research note / provisional hypotheses  
**Project:** Intelligent Research Lab  
**Purpose:** Preserve findings produced during iterative development of the original Research Lab so they can later be compared with new, quality-controlled observations.  
**Important:** This document is not evidence that any strategy is profitable and must not be used as a direct trading rule.

## 1. Motivation

The Research Lab evolved while its collection, evaluation, and execution-related code was being developed and corrected. Historical observations may therefore contain a mixture of useful market information, incomplete measurements, implementation defects, inconsistent outcome rules, and other sources of bias.

Discarding all historical material would lose potentially useful research experience. Treating it as fully reliable would risk carrying old defects into future conclusions. The appropriate approach is to preserve the history, qualify its reliability, and test its hypotheses against newly collected data.

## 2. Research question

Which patterns suggested by the historical Research Lab remain observable in new, independently quality-checked samples, and which disappear, weaken, reverse, or cannot be tested?

The comparison should explicitly identify:
- findings that replicate in the new data;
- findings that partially replicate or depend on market regime;
- findings that diverge or reverse;
- findings that cannot be evaluated because of missing or unreliable fields;
- findings that remain inconclusive because sample sizes are too small.

## 3. Provisional historical observations

The following are hypotheses to revisit, not established facts:

1. A strong initial signal or bullish feature set alone may not adequately distinguish winners from losers.
2. Whale accumulation, bullish 4-hour technicals, and multi-timeframe confirmation have appeared in both positive and negative outcomes; this combination alone may therefore be insufficient to explain outcome differences.
3. Historical markout summaries showed materially different outcomes across selected result groups, but their interpretation depends on validating timestamps, sampling rules, missing outcomes, exit assumptions, and costs.
4. Strategy rankings and average PnL from the development-era dataset may be affected by data quality, implementation changes, overlapping observations, or inconsistent outcome completion.
5. Some old records may still contain useful initial features even where the eventual PnL or markout is not trustworthy.

Any numeric result quoted from historical dashboards or conversation notes must be re-extracted from its source table and query before it is treated as a reproducible result. Historical numbers must not be silently promoted into verified baseline metrics.

## 4. Provenance and quality classification

Each historical dataset or finding should carry, where evidence permits:
- source table / query / export and retrieval timestamp;
- relevant code or schema version, if known;
- observation period and sample definition;
- completeness of initial signal features;
- completeness and reliability of markouts / outcome labels;
- known pipeline, calculation, or deployment issues;
- quality classification and the reason for it.

Use descriptive classifications rather than invented precision:
- **Verified:** required inputs and outcome calculations have been independently checked.
- **Partially reliable:** some fields are usable, but one or more outcome or provenance limitations remain.
- **Unverified / contaminated:** known or suspected defects prevent reliable outcome interpretation.
- **Not evaluable:** insufficient data to test the finding.

A sample may have reliable initial features but an unreliable outcome. Classify these separately instead of discarding the entire sample by default.

## 5. Comparison protocol

1. Freeze a dated copy of the historical findings and the query definitions used to derive them.
2. Define new-data quality gates before looking at the new outcomes.
3. Preserve each new signal's initial snapshot immutably; record later events and outcomes separately.
4. Apply consistent, versioned markout and completion rules to the new cohort.
5. Compare like with like: same symbol universe where possible, same horizon, same outcome definition, and compatible market-regime conditions.
6. Report sample sizes, missingness, fees/cost assumptions, uncertainty, and effect sizes—not only averages or rankings.
7. Separate in-sample exploration from out-of-sample confirmation. Do not tune a hypothesis on the validation cohort and then present that same cohort as independent confirmation.
8. Do not change live or paper strategy weights merely because an unverified historical finding looks promising. Initially use historical findings to prioritize research questions; any later influence on strategy selection must be separately justified and tested.

## 6. Comparison result template

For each finding, record:

| Field | Description |
|---|---|
| Finding ID | Stable identifier for the hypothesis |
| Historical claim | What the development-era data appeared to show |
| Historical source | Tables, query/export, dates, and code/schema version if known |
| Historical quality | Verified / partially reliable / unverified / not evaluable |
| New-cohort definition | Inclusion rules and observation period fixed before evaluation |
| New result | Estimate, sample size, missingness, and uncertainty |
| Agreement | Replicated / partial / diverged / reversed / inconclusive |
| Possible explanation | Data quality, regime, universe, implementation, or sampling differences |
| Decision | Retain for research, refine, deprioritize, or reject—with rationale |
| Audit trail | Query/code commit and evaluation timestamp |

## 7. Guardrails

- Do not delete historical records solely because they are uncertain; preserve source data where possible and annotate or exclude it from specific analyses.
- Never overwrite the original signal snapshot with later-known information.
- Never treat missing markouts as zero return.
- Never mix simulated, legacy, and verified results without explicit labels.
- Never infer causation from an observed association alone.
- Keep this paper separate from the operational strategy configuration.
- Amend findings through dated revisions; retain prior conclusions so that changes in interpretation remain auditable.

## 8. Current conclusion

The historical development period should be treated as a source of research hypotheses and engineering lessons, not as a clean performance benchmark. The goal is to preserve what was learned, establish the provenance and limitations of each claim, and then measure where the historical picture agrees with or diverges from independently evaluated new data.

**Next step:** inventory the specific historical findings and reproduce their source queries before assigning final quality labels or quoting numeric baselines.
