import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return new Response(JSON.stringify({ error: "server_configuration_missing" }), { status: 500, headers });

  try {
    const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.from("research_archive_documents").select("id, payload, created_at, generated_at");
    if (error) return new Response(JSON.stringify({ error: "archive_read_failed" }), { status: 500, headers });

    const groups = new Map<string, { document_count: number; latest_created_at: string | null; snapshot_rows_declared_max: number; batch_records_declared: number }>();
    for (const row of data ?? []) {
      const p = row.payload && typeof row.payload === "object" ? row.payload as Record<string, unknown> : {};
      const rawType = p.record_type ?? p.archive_type ?? p.kind ?? "unclassified";
      const type = typeof rawType === "string" && rawType.trim() ? rawType.trim().slice(0, 120) : "unclassified";
      const g = groups.get(type) ?? { document_count: 0, latest_created_at: null, snapshot_rows_declared_max: 0, batch_records_declared: 0 };
      g.document_count++;
      const created = typeof row.generated_at === "string" ? row.generated_at : (typeof row.created_at === "string" ? row.created_at : null);
      if (created && (!g.latest_created_at || created > g.latest_created_at)) g.latest_created_at = created;
      const sourceRows = Number(p.source_row_count ?? 0);
      if (Number.isFinite(sourceRows) && sourceRows > g.snapshot_rows_declared_max) g.snapshot_rows_declared_max = sourceRows;
      const batchRecords = Number(p.record_count ?? p.rows ?? 0);
      if (Number.isFinite(batchRecords) && batchRecords > 0) g.batch_records_declared += batchRecords;
      groups.set(type, g);
    }

    const byType = [...groups.entries()].map(([record_type, values]) => ({ record_type, ...values }))
      .sort((a, b) => b.document_count - a.document_count || a.record_type.localeCompare(b.record_type));

    return new Response(JSON.stringify({
      source: "research_archive_documents",
      access_mode: "read_only_aggregate",
      document_count: data?.length ?? 0,
      category_count: byType.length,
      by_type: byType,
      payload_values_exposed: false,
      generated_at: new Date().toISOString(),
    }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "archive_summary_failed" }), { status: 500, headers });
  }
});