import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "server_configuration_missing" }), { status: 500, headers });
  }

  const db = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { count, error } = await db
    .from("research_archive_documents")
    .select("id", { count: "exact", head: true });

  if (error) {
    return new Response(JSON.stringify({ error: "archive_read_failed" }), { status: 500, headers });
  }

  return new Response(JSON.stringify({
    source: "archive",
    document_count: count ?? 0,
    access_mode: "read_only",
    payload_values_exposed: false,
    generated_at: new Date().toISOString(),
  }), { headers });
});
