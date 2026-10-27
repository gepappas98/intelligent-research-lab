import { classifyArchiveType } from "../_shared/archive-category.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const PAGE_SIZE = 1000;
const MAX_DOCUMENTS = 40000;
const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedSummary: { body: string; expiresAt: number } | null = null;
type AggregateRow = {
  id: string;
  record_type: string | null;
  archive_type: string | null;
  kind: string | null;
  source_row_count: string | number | null;
  record_count: string | number | null;
  rows: string | number | null;
  created_at: string | null;
  generated_at: string | null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return new Response(JSON.stringify({ error: "server_configuration_missing" }), { status: 500, headers });
  if (cachedSummary && cachedSummary.expiresAt > Date.now()) return new Response(cachedSummary.body, { status: 200, headers });

  try {
    const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const groups = new Map<string, { document_count: number; latest_created_at: string | null; snapshot_rows_declared_max: number; batch_records_declared: number }>();
    let documentCount = 0;
    let scanLimitReached = false;

    // Keyset pagination on the primary key avoids repeated OFFSET scans. Only metadata is projected.
    let lastId: string | null = null;
    while (documentCount < MAX_DOCUMENTS) {
      let query = db.from("research_archive_documents")
        .select("id,record_type:payload->>record_type,archive_type:payload->>archive_type,kind:payload->>kind,source_row_count:payload->>source_row_count,record_count:payload->>record_count,rows:payload->>rows,created_at,generated_at")
        .order("id", { ascending: true })
        .limit(Math.min(PAGE_SIZE, MAX_DOCUMENTS - documentCount));
      if (lastId) query = query.gt("id", lastId);
      const { data, error } = await query;
      if (error) return new Response(JSON.stringify({ error: "archive_read_failed", detail: error.message }), { status: 502, headers });

      const page = (data ?? []) as unknown as AggregateRow[];
      documentCount += page.length;
      for (const row of page) {
        const type = classifyArchiveType(row);
        const group = groups.get(type) ?? { document_count: 0, latest_created_at: null, snapshot_rows_declared_max: 0, batch_records_declared: 0 };
        group.document_count++;
        const created = typeof row.generated_at === "string" ? row.generated_at : row.created_at;
        if (created && (!group.latest_created_at || created > group.latest_created_at)) group.latest_created_at = created;
        const sourceRows = Number(row.source_row_count ?? 0);
        if (Number.isFinite(sourceRows) && sourceRows > group.snapshot_rows_declared_max) group.snapshot_rows_declared_max = sourceRows;
        const batchRecords = Number(row.record_count ?? row.rows ?? 0);
        if (Number.isFinite(batchRecords) && batchRecords > 0) group.batch_records_declared += batchRecords;
        groups.set(type, group);
      }
      if (page.length < PAGE_SIZE) break;
      lastId = page[page.length - 1].id;
      if (documentCount >= MAX_DOCUMENTS) scanLimitReached = true;
    }

    const byType = [...groups.entries()].map(([record_type, values]) => ({ record_type, ...values }))
      .sort((a, b) => b.document_count - a.document_count || a.record_type.localeCompare(b.record_type));

    const body = JSON.stringify({
      source: "research_archive_documents",
      access_mode: "read_only_aggregate",
      document_count: documentCount,
      category_count: byType.length,
      by_type: byType,
      payload_values_exposed: false,
      scan_limit_reached: scanLimitReached,
      generated_at: new Date().toISOString(),
    });
    cachedSummary = { body, expiresAt: Date.now() + CACHE_TTL_MS };
    return new Response(body, { headers });
  } catch {
    return new Response(JSON.stringify({ error: "archive_summary_failed" }), { status: 500, headers });
  }
});
