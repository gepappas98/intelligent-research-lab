export const MAX_ARCHIVE_BODY_BYTES = 1_000_000;

export type ArchiveParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: "body_too_large" | "invalid_json" | "empty_body" | "read_failed" };

export async function readBoundedArchiveResponse(
  response: Response,
  maxBytes = MAX_ARCHIVE_BODY_BYTES,
): Promise<ArchiveParseResult> {
  if (!response.body) {
    try {
      const text = await response.text();
      if (!text) return { ok: false, error: "empty_body" };
      if (new TextEncoder().encode(text).byteLength > maxBytes) return { ok: false, error: "body_too_large" };
      try { return { ok: true, value: JSON.parse(text) as unknown }; }
      catch { return { ok: false, error: "invalid_json" }; }
    } catch {
      return { ok: false, error: "read_failed" };
    }
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("archive response exceeded size limit").catch(() => undefined);
        return { ok: false, error: "body_too_large" };
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    return { ok: false, error: "read_failed" };
  } finally {
    reader.releaseLock();
  }

  if (total === 0) return { ok: false, error: "empty_body" };
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}
