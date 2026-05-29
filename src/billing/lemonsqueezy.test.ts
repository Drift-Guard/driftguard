import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it } from "node:test";
import { verifyLemonSqueezySignature, planFromVariantId } from "./lemonsqueezy.js";

describe("verifyLemonSqueezySignature", () => {
  it("validates correct signatures", () => {
    const secret = "test-secret";
    const body = '{"test":true}';
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    assert.equal(verifyLemonSqueezySignature(body, sig, secret), true);
  });

  it("rejects invalid signatures", () => {
    assert.equal(verifyLemonSqueezySignature("{}", "bad", "secret"), false);
  });
});

describe("planFromVariantId", () => {
  it("maps variant ids from env", () => {
    process.env.LEMONSQUEEZY_VARIANT_PRO = "111";
    process.env.LEMONSQUEEZY_VARIANT_TEAM = "222";
    assert.equal(planFromVariantId("111"), "pro");
    assert.equal(planFromVariantId("222"), "team");
    assert.equal(planFromVariantId("999"), null);
  });
});
