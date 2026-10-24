-- Archive-project migration: apply to ragdznxfozdpxetwisrd, NOT the canonical trading source.
-- Read-only, provenance-preserving aggregate over the existing sync manifest.
create or replace view public.research_archive_coverage_audit
with (security_invoker = true) as
select
  m.source_table,
  m.source_project_ref,
  m.archive_project_ref,
  m.source_row_count,
  m.archive_row_count,
  m.inserted_count,
  m.updated_count,
  m.unchanged_count,
  m.error_count,
  m.status as sync_status,
  coalesce((m.verification->>'transfer_completed')::boolean, false) as transfer_completed,
  coalesce((m.verification->>'archive_content_verified')::boolean, false) as archive_content_verified,
  m.source_min_timestamp,
  m.source_max_timestamp,
  m.archive_min_timestamp,
  m.archive_max_timestamp,
  m.started_at,
  m.finished_at,
  m.updated_at,
  case
    when coalesce((m.verification->>'transfer_completed')::boolean, false)
      and coalesce((m.verification->>'archive_content_verified')::boolean, false)
      and m.error_count = 0 then 'verified'
    when m.status = 'pending' or m.finished_at is null then 'pending'
    when m.error_count > 0 then 'error'
    else 'unverified'
  end as audit_state
from public.research_sync_manifest m
where m.source_project_ref = 'yckewtpfttvwiptmmrfq'
  and m.archive_project_ref = 'ragdznxfozdpxetwisrd';
