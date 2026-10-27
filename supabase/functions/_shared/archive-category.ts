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
 * Return every requested category explicitly present in any supported metadata field.
 * Matching is independent of display-classification precedence so OR-filtered documents
 * cannot be silently dropped when a lower-priority field matches the requested category.
 */
export function matchingArchiveTypes(
  payload: ArchivePayloadMetadata,
  requested: readonly string[],
): string[] {
  const values = new Set<string>();
  for (const key of ["record_type", "archive_type", "kind"] as const) {
    const value = payload[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const normalized = value.trim().slice(0, 120);
    if (requested.includes(normalized)) values.add(normalized);
  }
  return [...values];
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
