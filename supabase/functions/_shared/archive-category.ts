export type ArchivePayloadMetadata = {
  record_type?: unknown;
  archive_type?: unknown;
  kind?: unknown;
};

/** Keep archive category precedence identical across summary and record retrieval. */
export function classifyArchiveType(
  payload: ArchivePayloadMetadata,
  fallback = "unclassified",
): string {
  for (const key of ["record_type", "archive_type", "kind"] as const) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 120);
  }
  return fallback;
}

/**
 * PostgREST OR filter. Categories are server-side allowlisted identifiers, not user input.
 * Supabase/PostgREST applies this as one OR expression, so a document matches once even if
 * more than one metadata field contains the same requested category.
 */
export function buildArchiveTypeOrFilter(categories: readonly string[]): string {
  const values = [...new Set(categories)].filter((value) => /^[a-z0-9_]+$/.test(value));
  if (!values.length) throw new Error("At least one valid archive category is required");
  const list = values.join(",");
  return [
    `payload->>record_type.in.(${list})`,
    `payload->>archive_type.in.(${list})`,
    `payload->>kind.in.(${list})`,
  ].join(",");
}

/** Validate the public application key in code when gateway JWT verification is disabled. */
export function isAuthorizedArchiveRequest(
  request: Request,
  configuredPublishableKeys: string | null | undefined,
): boolean {
  const suppliedKey = request.headers.get("apikey")?.trim();
  if (!suppliedKey || !configuredPublishableKeys) return false;

  try {
    const parsed: unknown = JSON.parse(configuredPublishableKeys);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    const keys = Object.values(parsed as Record<string, unknown>)
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    return keys.includes(suppliedKey);
  } catch {
    return false;
  }
}
