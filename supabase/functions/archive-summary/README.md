# Archive summary Edge Function

This function is intentionally limited to a count-only response. It does not return document titles, notes, source project references, or any `payload` values.

## Security model
- Deploy only to the Archive project `ragdznxfozdpxetwisrd`.
- JWT verification is explicitly enabled in `supabase/config.toml`.
- The service-role credential is read only from the Supabase Edge Function server environment; it must never be added to `VITE_*` variables.
- The function performs a read-only exact count against `public.research_archive_documents`.
- The browser validates the response shape before displaying the count.

## Deploy
The GitHub Actions workflow `.github/workflows/deploy-archive-summary.yml` is manual (`workflow_dispatch`). Add the repository Actions secret `SUPABASE_ACCESS_TOKEN`, then run **Deploy Archive Summary Edge Function**. The workflow pins the target project ref to the Archive project and deploys only `archive-summary`.

Configure these public frontend variables in the Observatory hosting environment:
- `VITE_ARCHIVE_SUPABASE_URL=https://ragdznxfozdpxetwisrd.supabase.co`
- `VITE_ARCHIVE_SUPABASE_ANON_KEY=<the Archive project's anon/publishable key>`

Do not use the production project URL or production credentials for this Archive connection. The normal dashboard data source remains independently configured.

## Verification
After deployment, call the function with a valid Supabase JWT and confirm the response includes `document_count` and `payload_values_exposed: false`. An unauthenticated request should be rejected by the Supabase gateway. Never expose service-role credentials or disable JWT verification to make the UI work.
