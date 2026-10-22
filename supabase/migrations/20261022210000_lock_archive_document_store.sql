-- Reproducible schema and least-privilege access for the IRL archive document store.
-- Safe for the already-existing archive table: CREATE TABLE IF NOT EXISTS preserves rows.
-- No source/production database is referenced by this migration.

create table if not exists public.research_archive_documents (
  id uuid primary key default gen_random_uuid(),
  document_key text not null unique,
  title text not null,
  source_project_ref text not null,
  generated_at timestamptz not null default now(),
  payload jsonb not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.research_archive_documents enable row level security;

-- Archive payloads must never be accessible through anon/authenticated API roles.
-- The scheduled uploader uses only the dedicated archive project's service-role key.
revoke all privileges on table public.research_archive_documents from public, anon, authenticated;
grant all privileges on table public.research_archive_documents to service_role;

comment on table public.research_archive_documents is
  'Private, provenance-bearing archive documents and immutable source snapshots; service-role access only.';
