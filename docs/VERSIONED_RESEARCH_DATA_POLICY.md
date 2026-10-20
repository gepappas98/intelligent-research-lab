# Versioned research data policy

The Intelligent Research Lab repository is private. The goal is to version actual historical research data alongside the strategy catalog and reproducibility metadata, with repeatable refreshes.

## Required contents
- Versioned, compressed, table-partitioned historical exports with stable primary keys and original timestamps.
- Strategy definitions, parameter snapshots, entry-time context, signal decisions, benchmark cohort identifiers, and outcome labels kept as separate datasets.
- A manifest containing source project ref, export timestamp, schema version, table names, row counts, time ranges, checksums, and incremental watermark.
- A reproducible import/rebuild script that creates an empty isolated IRL Supabase target and validates row counts and temporal/cohort invariants before completion.

## Git constraints
Never commit credentials, `.env` files, Supabase service-role keys, or auth/session material. Do not store a single database dump larger than GitHub's 100 MB per-file limit. Partition and compress table exports, check each part against the limit, and keep an append-only manifest. Because every update increases Git history, refreshes must be incremental by stable primary key or event timestamp and must include a documented correction/retraction strategy.

## Safety gates
The canonical source project is `yckewtpfttvwiptmmrfq`; it is export-only. Do not import into it, truncate it, or delete from it. Do not assume an unknown Supabase project is the IRL destination. The repo's versioned archive must be sufficient to bootstrap a new destination later. Before any source reset, require a completed archive, valid checksums, table-by-table counts, and a successful restore-and-reconcile test.

## Current status
This policy does not itself contain row payloads. The data archive is not complete until the export job has actually run against the verified source and committed the resulting private, partitioned data files plus manifest.