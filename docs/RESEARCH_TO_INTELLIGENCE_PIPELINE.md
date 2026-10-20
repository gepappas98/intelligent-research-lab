# Research evidence → matching → conclusions → intelligence

## Intended operating model

The source datasets are the evidence we repeatedly process. They are not themselves the intelligence conclusions. Each matching/analysis run compares source records, produces reproducible observations, and records conclusions that are then made available to the IRL intelligence knowledge layer.

```text
Original source records (immutable, row-preserving)
        │
        ▼
Matching / analysis run (versioned method + parameters)
        │
        ├── Run manifest: exact source IDs, snapshot checksums, time window,
        │   code revision, parameters, execution timestamp
        │
        ▼
Observations and comparison results (reproducible, evidence-linked)
        │
        ▼
Conclusion records (append-only; uncertainty and counterevidence included)
        │
        ▼
IRL Intelligence knowledge layer (searchable, versioned, source-linked)
        │
        ▼
New hypotheses / next matching run (feedback loop)
```

## Responsibilities of each layer

### 1. Original source records
- Preserve original values, JSON payloads, timestamps, identifiers, and row relationships exactly as received/stored.
- Do not replace source rows with summaries or overwrite them with interpretation.
- Maintain a stable source identity and a checksum for each exported chunk/snapshot.
- A corrected source record is represented by the source system's own updated state plus export/version metadata; preserve prior snapshots when they are needed to reproduce past conclusions.

### 2. Matching/analysis run
Every run must be reproducible. Record:
- `matching_run_id`, run timestamp, code commit, algorithm/version and parameters.
- Exact source snapshot/checksums and the source record IDs actually used.
- Event-time, observed-time, available-time, decision-time and entry-time boundaries where relevant.
- Matching rules, joins, deduplication rules, exclusions and missing-data handling.
- Output row counts and checksums.

A run must never silently mix Legacy, V2 and V3 cohorts or use information that was unavailable at the historical decision time.

### 3. Observations and comparison results
Store measured facts separately from interpretation. Include both supporting and contradicting observations, sample sizes, missingness, unresolved cases and uncertainty. Preserve enough intermediate output to reproduce the conclusion without rerunning an undocumented manual process.

### 4. Conclusions
Every conclusion is a new append-only record with:
- stable `conclusion_id`, `matching_run_id`, method/version and creation timestamp;
- links to the exact source records and comparison-result records;
- hypothesis, observation summary, conclusion, confidence/uncertainty, counterevidence and limitations;
- status such as `exploratory`, `replicated`, `contradicted` or `retired`;
- next test and links to any later conclusion that revises or contradicts it.

Never silently edit or erase a previous conclusion. A revised conclusion points back to the earlier one and explains what changed. Correlation is not causation; paper benchmark assumptions are not realized performance.

### 5. IRL Intelligence knowledge layer
The intelligence layer consumes **conclusion records and their evidence links**, not untraceable prose and not raw source rows as if they were conclusions. It should:
- index conclusions by asset, strategy, feature, market regime, cohort, timeframe, hypothesis and outcome;
- retain provenance links to source snapshots, source IDs and matching runs;
- distinguish exploratory findings from replicated evidence and validated results;
- surface contradictions and confidence limits alongside positive findings;
- use prior conclusions to propose the next analysis, while keeping the next run independent and reproducible.

The intelligence layer may generate a synthesis, but every claim must resolve to one or more stored conclusion IDs and ultimately to source evidence. Generated synthesis is not allowed to overwrite the underlying records.

## Storage layout in the private IRL repository

Recommended logical structure (physical chunking may differ to stay within Git limits):

- `data/source-snapshots/<snapshot-id>/` — exact source exports and manifest.
- `data/matching-runs/<matching-run-id>/manifest.json` — algorithm, commit, parameters, source snapshot references, time window.
- `data/matching-runs/<matching-run-id>/observations.*` — reproducible measured results and intermediate comparisons.
- `data/conclusions/<conclusion-id>.json` — one append-only conclusion per record, or deterministic chunked JSONL.
- `knowledge/index.*` — rebuildable search/index artifacts derived from conclusions; never the sole copy of evidence.
- `schemas/` — versioned contracts and validators.

Use deterministic serialization, checksums, stable IDs and explicit schema versions. Do not place secrets, credentials, access tokens or connection strings in the repository. “Exact source data” means no analytical filtering or rewriting; security-sensitive material must be handled by a separately reviewed secure-export policy, not casually committed.

## Refresh contract

Each refresh should:
1. identify new/changed source rows using a verified key/change strategy;
2. store the exact source snapshot/chunk and update its manifest;
3. run the matching process against explicitly named inputs;
4. validate row counts, IDs, timestamps, cohort boundaries and checksums;
5. append observations and conclusions;
6. update/rebuild the intelligence index from the conclusion ledger;
7. publish a run report with successes, skips, errors and unresolved checks.

Do not claim automatic refresh until a real job has run end-to-end and the resulting source chunks, run manifest, conclusions and intelligence index have been verified. Never reset or delete source data as part of this workflow.

## Current implementation status
This document defines the target contract; it is not proof that the pipeline is already automated. The repository still needs a verified row-preserving export, a real matching-run output adapter, conclusion persistence, and an end-to-end test before the process can be described as operational.
