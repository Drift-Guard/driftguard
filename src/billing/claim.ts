import type { Context } from "hono";
import { getCustomerByEmail } from "../db/customers.js";

export async function claimApiKey(c: Context): Promise<Response> {
  const body = await c.req.json<{ email: string }>().catch(() => ({ email: "" }));
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return c.json({ error: "Valid email required" }, 400);
  }

  const customer = getCustomerByEmail(email);
  if (!customer || customer.status !== "active" || customer.plan === "free") {
    return c.json(
      {
        error: "No active subscription found for this email. Wait a minute after checkout and try again.",
      },
      404,
    );
  }

  return c.json({
    email: customer.email,
    plan: customer.plan,
    apiKey: customer.api_key,
    usage: "Add header: Authorization: Bearer " + customer.api_key,
  });
}
