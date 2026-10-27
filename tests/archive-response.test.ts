import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readBoundedArchiveResponse } from "../src/lib/archive-response.ts";

test("parses valid JSON within limit", async () => {
  const result = await readBoundedArchiveResponse(new Response(JSON.stringify({ ok: true })), 100);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, { ok: true });
});

test("rejects invalid JSON", async () => {
  const result = await readBoundedArchiveResponse(new Response("{broken"), 100);
  assert.deepEqual(result, { ok: false, error: "invalid_json" });
});

test("rejects an empty body", async () => {
  const result = await readBoundedArchiveResponse(new Response(""), 100);
  assert.deepEqual(result, { ok: false, error: "empty_body" });
});

test("stops reading when stream exceeds byte limit", async () => {
  let pulls = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls++;
      controller.enqueue(new TextEncoder().encode("123456"));
    },
    cancel() {},
  });
  const result = await readBoundedArchiveResponse(new Response(stream), 5);
  assert.deepEqual(result, { ok: false, error: "body_too_large" });
  assert.equal(pulls, 1);
});
