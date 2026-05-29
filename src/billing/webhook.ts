import type { Context } from "hono";
import {
  planFromVariantId,
  verifyLemonSqueezySignature,
  type LemonSqueezyWebhookPayload,
} from "../billing/lemonsqueezy.js";
import { downgradeCustomer, upsertCustomerFromSubscription } from "../db/customers.js";

export async function handleLemonSqueezyWebhook(c: Context): Promise<Response> {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const rawBody = await c.req.text();
  const signature = c.req.header("X-Signature");

  if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload;
  const event = payload.meta.event_name;
  const attrs = payload.data.attributes;

  const email =
    (attrs.user_email as string | undefined) ??
    (attrs.customer_email as string | undefined) ??
    payload.meta.custom_data?.email;

  const variantId =
    (attrs.variant_id as string | number | undefined) ??
    (attrs.first_subscription_item as { variant_id?: number } | undefined)?.variant_id;

  const lsCustomerId = String(attrs.customer_id ?? "");
  const lsSubscriptionId = payload.data.type === "subscriptions" ? payload.data.id : String(attrs.subscription_id ?? "");

  if (!email) {
    return c.json({ ok: true, skipped: "no email in payload" });
  }

  switch (event) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_payment_success": {
      const plan = planFromVariantId(variantId);
      if (!plan) {
        return c.json({ ok: true, skipped: "unknown variant" });
      }
      const status = attrs.status as string | undefined;
      if (status === "cancelled" || status === "expired" || status === "unpaid") {
        downgradeCustomer(email);
        return c.json({ ok: true, action: "downgraded" });
      }
      const customer = upsertCustomerFromSubscription({
        email,
        plan,
        lsCustomerId: lsCustomerId || undefined,
        lsSubscriptionId: lsSubscriptionId || undefined,
        status: "active",
      });
      return c.json({ ok: true, action: "activated", customerId: customer.id, plan: customer.plan });
    }
    case "subscription_cancelled":
    case "subscription_expired": {
      downgradeCustomer(email);
      return c.json({ ok: true, action: "downgraded" });
    }
    default:
      return c.json({ ok: true, skipped: event });
  }
}
