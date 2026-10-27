import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildArchiveTypeOrFilter, classifyArchiveType, isAuthorizedArchiveRequest } from "../supabase/functions/_shared/archive-category.ts";

test("classification prefers record_type, then archive_type, then kind", () => {
  assert.equal(classifyArchiveType({ record_type: "primary", archive_type: "secondary", kind: "tertiary" }), "primary");
  assert.equal(classifyArchiveType({ archive_type: "secondary", kind: "tertiary" }), "secondary");
  assert.equal(classifyArchiveType({ kind: "tertiary" }), "tertiary");
});

test("classification trims values and falls back for empty metadata", () => {
  assert.equal(classifyArchiveType({ record_type: "  ", archive_type: "  valid  " }), "valid");
  assert.equal(classifyArchiveType({}), "unclassified");
});

test("PostgREST filter searches all three classification fields", () => {
  const filter = buildArchiveTypeOrFilter(["research_cases", "council_lessons", "research_cases"]);
  assert.equal(filter, "payload->>record_type.in.(research_cases,council_lessons),payload->>archive_type.in.(research_cases,council_lessons),payload->>kind.in.(research_cases,council_lessons)");
});

test("PostgREST filter rejects categories outside the safe archive identifier format", () => {
  assert.throws(() => buildArchiveTypeOrFilter(["research_cases,evil"]), /valid archive category/);
});


test("publishable key authorization accepts configured keys only from the apikey header", () => {
  const configured = JSON.stringify({ default: "sb_publishable_test_key", dashboard: "sb_publishable_other_key" });
  const allowed = new Request("https://example.test/functions/v1/archive-category-summary", {
    headers: { apikey: "sb_publishable_test_key", authorization: "Bearer sb_publishable_test_key" },
  });
  const wrongKey = new Request("https://example.test/functions/v1/archive-category-summary", {
    headers: { apikey: "sb_publishable_wrong_key" },
  });
  const bearerOnly = new Request("https://example.test/functions/v1/archive-category-summary", {
    headers: { authorization: "Bearer sb_publishable_test_key" },
  });
  assert.equal(isAuthorizedArchiveRequest(allowed, configured), true);
  assert.equal(isAuthorizedArchiveRequest(wrongKey, configured), false);
  assert.equal(isAuthorizedArchiveRequest(bearerOnly, configured), false);
  assert.equal(isAuthorizedArchiveRequest(allowed, null), false);
  assert.equal(isAuthorizedArchiveRequest(allowed, "not-json"), false);
});
