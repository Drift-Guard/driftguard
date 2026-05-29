import type { Context, Next } from "hono";
import { getCustomerByApiKey, type CustomerRow } from "../db/customers.js";

declare module "hono" {
  interface ContextVariableMap {
    customer: CustomerRow;
  }
}

export function extractApiKey(c: Context): string | undefined {
  const auth = c.req.header("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return c.req.header("x-api-key") ?? undefined;
}

export async function optionalApiKey(c: Context, next: Next): Promise<Response | void> {
  const key = extractApiKey(c);
  if (key) {
    const customer = getCustomerByApiKey(key);
    if (customer) c.set("customer", customer);
  }
  await next();
}

export async function requireApiKey(c: Context, next: Next): Promise<Response | void> {
  const key = extractApiKey(c);
  if (!key) {
    return c.json({ error: "Missing API key. Use Authorization: Bearer dg_..." }, 401);
  }
  const customer = getCustomerByApiKey(key);
  if (!customer) {
    return c.json({ error: "Invalid or inactive API key" }, 401);
  }
  c.set("customer", customer);
  await next();
}
