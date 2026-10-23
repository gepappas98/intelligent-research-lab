# Intelligent Research Observatory

A research-only, read-only Observatory for archive metadata, research outcomes, strategy cohorts, source quality and AI Council lessons. It must not execute orders or write to the production Research Lab.

## Runtime and data source

- The active application is `src/components/ObservatoryApp.tsx`, mounted through `src/App.tsx`.
- Synthetic demo trades, demo lessons, demo chart series and demo strategy rows are not used by the active application.
- Archive metadata is read through the deployed `archive-summary` and `archive-category-summary` Edge Functions in the isolated archive project `ragdznxfozdpxetwisrd`.
- The Edge Functions read `research_archive_documents` server-side using the project secret. A service-role key must never be shipped to the browser.
- The function source is tracked under `supabase/functions/`; tracking source in Git does not deploy a function. Verify deployed function versions separately.
- The browser client currently reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or the legacy `VITE_SUPABASE_ANON_KEY`) from the existing runtime environment. Do not add a new environment variable in Lovable if the existing project configuration already supplies these values. Never use a service-role key as a Vite variable.

## Read-only boundary and interpretation

- Archive summary endpoints return aggregate metadata only; they do not expose archived payload values.
- Raw candidate-table reads are best-effort previews, not a complete historical export. Do not treat their capped rows as statistically complete strategy performance.
- Preserve source identifiers and timestamps; do not deduplicate distinct records by symbol alone.
- Keep V3-aligned comparisons separate from Legacy/V2; CMC is context/discovery, not a standalone BUY vote.
- Lessons remain research hypotheses; no automatic strategy changes.
- The UI is not considered production-verified until the GitHub build and live archive responses have both been checked.

## Local development

```bash
npm install
npm run dev
npm run build
``
