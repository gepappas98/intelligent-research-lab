-- Speed up bounded archive-record retrieval by indexing the three supported category metadata fields.
-- These indexes support equality/IN predicates and newest-first ordering without changing RLS or data.
create index if not exists research_archive_documents_record_type_created_at_idx
  on public.research_archive_documents ((payload ->> 'record_type'), created_at desc);

create index if not exists research_archive_documents_archive_type_created_at_idx
  on public.research_archive_documents ((payload ->> 'archive_type'), created_at desc);

create index if not exists research_archive_documents_kind_created_at_idx
  on public.research_archive_documents ((payload ->> 'kind'), created_at desc);
