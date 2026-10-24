-- Archive project migration only. Heuristic labels support human review; they do not authorize deletion.
create or replace view public.research_archive_retention_audit
with (security_invoker = true) as
select
  d.id,
  d.document_key,
  d.title,
  d.source_project_ref,
  d.generated_at,
  d.created_at,
  coalesce(nullif(d.payload->>'record_type',''), 'unclassified') as record_type,
  case
    when d.payload ? 'source_table' or d.payload ? 'source_row_id' or d.payload ? 'source_id'
      or d.payload ? 'entry_context' or d.payload ? 'entry_metadata' then 'provenance_or_entry_context'
    when d.payload ? 'records' or d.payload ? 'snapshot_rows' or d.payload ? 'rows' then 'batch_or_snapshot'
    when d.payload ? 'summary' or d.payload ? 'metrics' then 'summary_or_derived'
    else 'unclassified_review'
  end as retention_review_class,
  case
    when coalesce(nullif(d.payload->>'record_type',''), '') = '' then 'needs_classification'
    when d.payload ? 'source_table' or d.payload ? 'source_row_id' or d.payload ? 'source_id'
      or d.payload ? 'entry_context' or d.payload ? 'entry_metadata' then 'preserve'
    else 'review_before_archive'
  end as retention_recommendation
from public.research_archive_documents d;
