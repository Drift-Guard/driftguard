import crypto from "node:crypto";
import { getDb } from "./index.js";

function generateApiKey(): string {
  return `dg_${crypto.randomBytes(24).toString("hex")}`;
}

export interface CustomerRow {
  id: string;
  email: string;
  plan: "free" | "pro" | "team";
  api_key: string;
  ls_customer_id: string | null;
  ls_subscription_id: string | null;
  status: "active" | "cancelled" | "expired";
  created_at: string;
  updated_at: string;
}

function migrateCustomers(database: ReturnType<typeof getDb>): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
      api_key TEXT NOT NULL UNIQUE,
      ls_customer_id TEXT,
      ls_subscription_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customers_api_key ON customers(api_key);
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
  `);

  const watchCols = database
    .prepare(`PRAGMA table_info(watches)`)
    .all() as Array<{ name: string }>;
  if (!watchCols.some((c) => c.name === "customer_id")) {
    database.exec(`ALTER TABLE watches ADD COLUMN customer_id TEXT REFERENCES customers(id)`);
  }
}

export { migrateCustomers };

export function upsertCustomerFromSubscription(input: {
  email: string;
  plan: "pro" | "team";
  lsCustomerId?: string;
  lsSubscriptionId?: string;
  status?: "active" | "cancelled" | "expired";
}): CustomerRow {
  const database = getDb();
  const now = new Date().toISOString();
  const existing = database
    .prepare(`SELECT * FROM customers WHERE email = ?`)
    .get(input.email) as CustomerRow | undefined;

  if (existing) {
    database
      .prepare(
        `UPDATE customers
         SET plan = ?, ls_customer_id = COALESCE(?, ls_customer_id),
             ls_subscription_id = COALESCE(?, ls_subscription_id),
             status = ?, updated_at = ?
         WHERE email = ?`,
      )
      .run(
        input.plan,
        input.lsCustomerId ?? null,
        input.lsSubscriptionId ?? null,
        input.status ?? "active",
        now,
        input.email,
      );
    return database.prepare(`SELECT * FROM customers WHERE email = ?`).get(input.email) as CustomerRow;
  }

  const row: CustomerRow = {
    id: crypto.randomUUID(),
    email: input.email,
    plan: input.plan,
    api_key: generateApiKey(),
    ls_customer_id: input.lsCustomerId ?? null,
    ls_subscription_id: input.lsSubscriptionId ?? null,
    status: input.status ?? "active",
    created_at: now,
    updated_at: now,
  };

  database
    .prepare(
      `INSERT INTO customers (id, email, plan, api_key, ls_customer_id, ls_subscription_id, status, created_at, updated_at)
       VALUES (@id, @email, @plan, @api_key, @ls_customer_id, @ls_subscription_id, @status, @created_at, @updated_at)`,
    )
    .run(row);

  return row;
}

export function downgradeCustomer(email: string): void {
  getDb()
    .prepare(
      `UPDATE customers SET plan = 'free', status = 'expired', updated_at = ? WHERE email = ?`,
    )
    .run(new Date().toISOString(), email);
}

export function getCustomerByApiKey(apiKey: string): CustomerRow | undefined {
  return getDb()
    .prepare(`SELECT * FROM customers WHERE api_key = ? AND status = 'active'`)
    .get(apiKey) as CustomerRow | undefined;
}

export function getCustomerByEmail(email: string): CustomerRow | undefined {
  return getDb()
    .prepare(`SELECT * FROM customers WHERE email = ?`)
    .get(email) as CustomerRow | undefined;
}

export function countWatchesForCustomer(customerId: string): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) as count FROM watches WHERE customer_id = ?`)
    .get(customerId) as { count: number };
  return row.count;
}

export function countFreeWatchesWithoutCustomer(): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) as count FROM watches WHERE customer_id IS NULL`)
    .get() as { count: number };
  return row.count;
}
