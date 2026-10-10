# Supabase Project Identity Map

**Verified:** 2026-10-10  
**Scope:** Trading Command Center source repository, Lovable project, Vercel production deployment, connected Supabase projects and Lovable's attached database tool.  
**Method:** Read-only inspection. No production data, schemas, execution logic or deployment settings were changed.

## Executive finding

The canonical Supabase project used by the Trading Command Center browser client and its active Edge Functions is:

`yckewtpfttvwiptmmrfq`  
URL: `https://yckewtpfttvwiptmmrfq.supabase.co`

The latest Lovable project commit and the latest Vercel production deployment both reference commit `20d94cee54b48a13bf50843715de30d67aba64e7`. That commit's Supabase client explicitly pins the browser runtime to the canonical URL and publishable key when build-time environment variables differ.

However, the database accessed through Lovable's `query_database` tool has a materially different dataset and schema inventory. Its actual Supabase project reference could not be established through the available project-management API. Treat this as a separate/stale Lovable database context until its project ref and the configured migration connection are verified. Do not run migrations through that context.

## Verified mapping

| Surface | Observed identity | Evidence | Conclusion |
|---|---|---|---|
| Canonical Trading Command Center Supabase | `yckewtpfttvwiptmmrfq` | Supabase project list/details; `supabase/config.toml`; browser client constants; active Edge Functions; current production data counts | **Canonical runtime project** |
| GitHub source | `gepappas98/pixel-perfect-pixels`, branch `main`, commit `20d94cee54b48a13bf50843715de30d67aba64e7` | Read `src/integrations/supabase/client.ts`, `supabase/config.toml`; deployment metadata points to the same SHA | Source explicitly pins runtime to canonical project |
| Lovable app | Project ID `6d1cd604-982a-4237-98b3-1276c19ca6f7`, “Pixel Perfect Pixels”; latest commit SHA matches the Vercel production SHA above | Lovable project metadata and direct read of `src/integrations/supabase/client.ts` | Browser runtime code points to canonical project; attached database tool is a separate concern |
| Vercel production | Project `pixel-perfect-pixels`; latest production deployment commit `20d94cee54b48a13bf50843715de30d67aba64e7` | Vercel deployment metadata | Deployed source contains canonical-project guard |
| Lovable attached database tool | Database name `postgres`, PostgreSQL 17.6, 21 public tables; 3,570 `composite_signals`, 641 `pipeline_runs`, 746 `strategy_variant_signals`, 0 `trades`; latest observed signal/run timestamps 2026-10-07 | Read-only `query_database` queries and table-count comparison | Dataset is materially different from canonical Supabase. Exact project ref is **not yet verified**. |
| `gbbrmzstuhdizfvabjvz` | Found in tracked GitHub `.env` and Lovable project's `.env` | Read-only source inspection | Stale/foreign configuration value relative to canonical runtime. The connected Supabase project API denied access to this ref, so do not claim it is definitively the attached database's ref. |
| `opwkbdbpqgtgcrmqqmbq` | Supabase project named `polymarket-quant-bot-lite`; zero Edge Functions returned in inspection | Supabase project list/details and Edge Function listing | Separate project; not the Trading Command Center canonical runtime. |

## Canonical-project evidence

1. `supabase/config.toml` sets `project_id = "yckewtpfttvwiptmmrfq"`.
2. `src/integrations/supabase/client.ts` defines the canonical URL `https://yckewtpfttvwiptmmrfq.supabase.co` and checks both configured URL and publishable key against canonical values. If they do not both match, the client substitutes the canonical pair.
3. The same commit includes `src/lib/mcp-diagnostic.server.ts` with `CANONICAL_SUPABASE_PROJECT_REF = "yckewtpfttvwiptmmrfq"`.
4. The latest Vercel production deployment and latest Lovable project revision both reference commit `20d94cee54b48a13bf50843715de30d67aba64e7`.
5. The Supabase project has the expected active functions, including `trading-pipeline-orchestrator`, `trade-executor`, `event-flow-lab`, `whale-watch`, `signal-combiner`, and `variant-resolver`.
6. Current read-only inventory of canonical project: 50 public tables; `composite_signals` 30,537 rows; `pipeline_runs` 2,253 rows; `strategy_variant_signals` 15,164 rows; `trades` 344 rows. Latest observed `created_at` values for those tables were around 2026-10-10 06:00 UTC.

## Important distinction: browser runtime vs Lovable database/migration context

The browser client source is pinned to the canonical project, but the Lovable database tool returns a different dataset. The project's `drizzle.config.ts` uses `process.env.LOVABLE_DB_MIGRATION_URL` for migration operations. The configured value of that secret was not read or exposed, and the Vercel environment-variable listing was blocked by a scope authorization error.

Therefore:
- **Confirmed:** the deployed browser client source points to `yckewtpfttvwiptmmrfq`.
- **Confirmed:** the canonical Supabase project's Edge Functions and larger, current dataset are on `yckewtpfttvwiptmmrfq`.
- **Confirmed:** the Lovable database tool points to a materially different database state.
- **Not yet confirmed:** the exact Supabase project ref behind Lovable's attached database tool, and the target of `LOVABLE_DB_MIGRATION_URL`.
- **Not yet confirmed from Vercel environment metadata:** the environment variable values. The Vercel API returned HTTP 403 for the `gepappas-projects` scope. This does not block identifying the effective browser runtime because the inspected source explicitly falls back to the canonical project.

## Safety actions

1. Do not apply migrations or schema changes through the Lovable database tool until its project identity is established.
2. Do not change the canonical browser client: its current guard is the protection against silent redirection to a foreign environment.
3. Keep the stale `gbbr...` values documented as configuration drift. Do not infer that this ID is the Lovable attached database ref without direct evidence.
4. Next, verify the actual configured target of `LOVABLE_DB_MIGRATION_URL` through an authorized metadata-only path that does not expose credentials, and re-authenticate the Vercel integration to the correct `gepappas-projects` scope if environment metadata is still needed.
5. Keep the Intelligent Research Lab physically separate. Do not point IRL at either existing database or copy production data until its own isolated backend is explicitly selected.

## References

- [Canonical browser client at verified commit](https://github.com/gepappas98/pixel-perfect-pixels/blob/20d94cee54b48a13bf50843715de30d67aba64e7/src/integrations/supabase/client.ts)
- [Supabase project config](https://github.com/gepappas98/pixel-perfect-pixels/blob/main/supabase/config.toml)
- [Vercel project](https://vercel.com/gepappas-projects/pixel-perfect-pixels)
- [Lovable project](https://lovable.dev/projects/6d1cd604-982a-4237-98b3-1276c19ca6f7)
