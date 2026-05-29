import crypto from "node:crypto";

export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: Record<string, string>;
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  };
}

export function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !signatureHeader) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(signatureHeader, "utf8"),
    );
  } catch {
    return false;
  }
}

export function planFromVariantId(variantId: string | number | undefined): "pro" | "team" | null {
  if (!variantId) return null;
  const id = String(variantId);
  if (process.env.LEMONSQUEEZY_VARIANT_PRO && id === process.env.LEMONSQUEEZY_VARIANT_PRO) {
    return "pro";
  }
  if (process.env.LEMONSQUEEZY_VARIANT_TEAM && id === process.env.LEMONSQUEEZY_VARIANT_TEAM) {
    return "team";
  }
  return null;
}

export function checkoutUrl(variantId: string, email?: string): string {
  const store = process.env.LEMONSQUEEZY_STORE_SLUG ?? process.env.LEMONSQUEEZY_STORE_ID;
  if (!store) {
    throw new Error("LEMONSQUEEZY_STORE_SLUG or LEMONSQUEEZY_STORE_ID not configured");
  }
  const base = `https://${store}.lemonsqueezy.com/checkout/buy/${variantId}`;
  if (!email) return base;
  return `${base}?checkout[email]=${encodeURIComponent(email)}`;
}

export function billingConfig(): {
  provider: "lemonsqueezy";
  currency: "USD";
  pro: { priceUsd: number; checkoutUrl: string | null; variantId: string | null };
  team: { priceUsd: number; checkoutUrl: string | null; variantId: string | null };
  foundingPriceUsd: number;
} {
  const proVariant = process.env.LEMONSQUEEZY_VARIANT_PRO ?? null;
  const teamVariant = process.env.LEMONSQUEEZY_VARIANT_TEAM ?? null;
  return {
    provider: "lemonsqueezy",
    currency: "USD",
    pro: {
      priceUsd: 19,
      variantId: proVariant,
      checkoutUrl: proVariant ? checkoutUrl(proVariant) : null,
    },
    team: {
      priceUsd: 49,
      variantId: teamVariant,
      checkoutUrl: teamVariant ? checkoutUrl(teamVariant) : null,
    },
    foundingPriceUsd: 15,
  };
}

export function generateApiKey(): string {
  return `dg_${crypto.randomBytes(24).toString("hex")}`;
}
