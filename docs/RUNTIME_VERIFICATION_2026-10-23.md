# Runtime verification addendum — 2026-10-23

This addendum records follow-up runtime checks after the 2026-10-22 IRL destination review. It does not authorize merge, deployment, source mutation, or cleanup.

## Verified project boundary
- IRL archive target: Supabase project `ragdznxfozdpxetwisrd` (`intelligent-research-lab`).
- Canonical Trading Command Center production: `yckewtpfttvwiptmmrfq`.
- The archive-table permission migration and `rls_auto_enable()` EXECUTE revocation were applied to IRL only. Production was not modified.
- `research_archive_documents`: 436 rows and 436 distinct document keys at the latest check; service_role has SELECT/INSERT/UPDATE only; no DELETE/TRUNCATE grants. RLS is enabled with no policies, which is intentional for API-deny-by-default and service-role-only access; re-check grants/RLS before any policy change.
- Migration-history / repository filename mismatch needs reconciliation: runtime migration history records `20261022214807 lock_archive_document_store`, while the PR branch file is `20261022210000_lock_archive_document_store.sql`. Do not merge this mismatch blindly; align migration history and repository naming without reapplying an unreviewed migration.
- `public.rls_auto_enable()` EXECUTE was revoked from PUBLIC, anon and authenticated in migration `20261022215155_revoke_public_execute_rls_auto_enable`; the migration file is recorded on the PR branch. PR remains open and unmerged.

## Backup workflow
- The full-repository backup workflow is present on production repo main after PR #140, commit `4ae407ec2528456dc7baf210394643002a7cea1d`.
- Run `39853061499` failed because `ARCHIVE_SUPABASE_URL` and `ARCHIVE_SUPABASE_SERVICE_ROLE_KEY` were empty in the `research-lab-archive` environment. No successful full-repository backup artifact or `code-backup-latest` pointer was verified.
- A separate validation run passing build/type checks is not evidence that archive upload succeeded. Configure the two environment secrets to the verified IRL project, then manually rerun the workflow. Never point these secrets at production.

## Current source data checks (read-only)
- `research_cases`: 8,638 rows; 0 missing `source_id`; cohort labels include 6,023 V3 and 2,250 V2, with the remainder outside those two labels. Keep cohorts separate.
- `strategy_variant_signals`: 71,768 rows; 70,658 resolved and 1,110 unresolved at query time. These totals differ from older snapshots; use query timestamps and evaluator/resolver lineage when comparing.
- `early_entry_variant_decisions`: 3,505 rows; 26 linked trades; 0 broken trade links. Decisions without trades are not automatically errors and must retain NO_ENTRY / decision semantics.
- `research_cases.evidence_ids`: 8,674 evidence references checked; zero unresolved IDs at the previous verification snapshot.
- `council_lessons`: 29 of 313 source_trade_id values do not match current `trades.id`; none matched `trade_alerts.trade_id`. All 29 have a same-symbol trade somewhere in history, but only 1 had a same-symbol trade within ±24 hours of the lesson timestamp. This suggests historical ID drift or lineage mismatch; do not relink by symbol alone and do not delete lessons. Next step: inspect each lesson's entry_context, symbol, timestamps and historical trade source IDs, then classify as verified alias, historical missing trade, or unresolved.
- The two historical sentiment cleanup migrations (`20261008123000`, `20261008123001`) remain unrecovered as SQL source files. Do not reconstruct and rerun them from their names; continue read-only recovery through historical commits, branches, backup manifests and deployment records.

## Point-in-time and retention safeguards
- Existing archive logic that derives `observed_at` and `available_at` from `created_at` does not prove feature availability at entry. Mark these records unverified for strict point-in-time evaluation unless source evidence proves timing.
- Preserve all historical rows. Keep `allow_archive=false` and `allow_source_delete=false`; no production/source cleanup, schema changes, strategy changes, merges or deploys were performed in this follow-up.
- V3 benchmark, Early Entry, CMC, Event→Flow, Council lessons and legacy/V2 data must remain separately identified, with source IDs, event/observed/available/ingested timestamps and evaluator version retained.
