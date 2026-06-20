import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { validateAgainstProfile, type ConsumerProfile } from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, "..", "fixtures", "ingress");

function loadProfile(name: string): ConsumerProfile {
  const path = join(fixturesRoot, "profiles", `profile.${name}.json`);
  return JSON.parse(readFileSync(path, "utf8")) as ConsumerProfile;
}

const manifest = JSON.parse(readFileSync(join(fixturesRoot, "cases.json"), "utf8")) as {
  cases: Array<{
    id: string;
    profile: string;
    payload: unknown;
    expect: { ok: boolean; severity: string; code?: string };
  }>;
};

test("ingress golden corpus", () => {
  const good = manifest.cases.filter((c) => c.expect.ok);
  const bad = manifest.cases.filter((c) => !c.expect.ok);
  assert.equal(good.length, 27, "good case count");
  assert.equal(bad.length, 49, "bad case count");

  for (const c of manifest.cases) {
    const profile = loadProfile(c.profile);
    const profileMode =
      c.profile === "n8n-normalized-lead" ? "cli" : "hosted";
    const result = validateAgainstProfile(c.payload, profile, { profileMode });
    assert.equal(result.ok, c.expect.ok, `${c.id}: ok`);
    assert.equal(result.severity, c.expect.severity, `${c.id}: severity`);
    if (c.expect.code) {
      assert.ok(
        result.errors.some((e) => e.code === c.expect.code),
        `${c.id}: expected code ${c.expect.code}, got ${result.errors.map((e) => e.code).join(",")}`,
      );
    }
  }
});

test("profile depth limit rejects oversized schema", () => {
  let schema: Record<string, unknown> = { type: "object", properties: { leaf: { type: "string" } } };
  for (let i = 0; i < 40; i++) {
    schema = { type: "object", properties: { nested: schema } };
  }
  const result = validateAgainstProfile(
    { nested: { leaf: "x" } },
    { id: "deep", version: 1, schema },
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.code === "profile_invalid"));
});

test("tool_call_envelope returns extracted arguments in normalized", () => {
  const profile = loadProfile("mcp-tool-call");
  const result = validateAgainstProfile(
    { name: "search_docs", arguments: { query: "ingress" } },
    profile,
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.normalized, { query: "ingress" });
});

test("normalization maps aliases before validate", () => {
  const profile = loadProfile("n8n-normalized-lead");
  const result = validateAgainstProfile(
    { email_address: "a@b.c", full_name: "Ada", source: "form", phone: "555", company: "Co" },
    profile,
    { profileMode: "cli" },
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.normalized, { email: "a@b.c", name: "Ada", source: "form", phone: "555", company: "Co" });
});
