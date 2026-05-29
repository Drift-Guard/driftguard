# Payments from Kenya — Minimum Compliance Path

DriftGuard sells to **global customers** (USD) but you live in **Kenya** and want **local payouts** with **minimal compliance overhead**.

## Recommended: Lemon Squeezy (Merchant of Record)

**Use Lemon Squeezy as your sole payment processor.** Do not use Stripe directly unless you register a US LLC (unnecessary complexity for a solo founder in Kenya).

| Why Lemon Squeezy | Detail |
|-------------------|--------|
| Kenya payouts | Bank transfer supported; choose **KES** as payout currency |
| MoR = less compliance | They are the seller; they handle VAT/GST in 200+ countries |
| No US entity needed | Sign up as an individual in Kenya |
| SaaS subscriptions | Built-in recurring billing |
| Setup time | ~30 minutes |
| Fee | 5% + $0.50 per transaction (includes global tax handling) |

**What you still owe in Kenya:** Declare the USD/KES income you receive as business or freelance income. Lemon Squeezy handles *customer-facing* tax; KRA is *your* side. Keep payout statements for records. No VAT registration needed until you hit KRA thresholds (~KES 5M/year for VAT registration).

### What NOT to use (for now)

| Option | Why skip |
|--------|----------|
| **Stripe (direct)** | Kenya not supported for merchant accounts; needs US LLC + Mercury |
| **Paystack** | Great for KES/local buyers; poor fit for global USD SaaS subs |
| **Paddle** | Works but slower payouts; Lemon Squeezy is faster for indies |
| **Crypto/x402** | Extra compliance uncertainty in Kenya; revisit later |

---

## 15-minute setup checklist

### 1. Create Lemon Squeezy account
1. Go to https://lemonsqueezy.com and sign up (use your Kenyan address)
2. Verify email
3. **Settings → Payouts → Add bank account** (Kenyan bank, select **KES** payout currency)

### 2. Create products

Create two subscription products in your store:

| Product | Price | Env variable |
|---------|-------|--------------|
| DriftGuard Pro | $19/month | `LEMONSQUEEZY_VARIANT_PRO` |
| DriftGuard Team | $49/month | `LEMONSQUEEZY_VARIANT_TEAM` |

Also note your **Store slug** (e.g. `driftguard`) → `LEMONSQUEEZY_STORE_SLUG`

### 3. Configure webhook

**Settings → Webhooks → Create webhook**

- **URL:** `https://YOUR_DOMAIN/api/webhooks/lemonsqueezy`
- **Secret:** generate random string → `LEMONSQUEEZY_WEBHOOK_SECRET`
- **Events:** `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_payment_success`

### 4. Set environment variables

```bash
LEMONSQUEEZY_STORE_SLUG=driftguard
LEMONSQUEEZY_VARIANT_PRO=123456
LEMONSQUEEZY_VARIANT_TEAM=789012
LEMONSQUEEZY_WEBHOOK_SECRET=your-signing-secret
```

### 5. Test checkout

1. Enable **Test mode** in Lemon Squeezy
2. Visit `/pricing` on your deployed app
3. Complete test purchase
4. Verify webhook fires → customer gets API key via `/api/me`

---

## How billing works in DriftGuard

```
Customer clicks "Upgrade" on /pricing
        ↓
Lemon Squeezy checkout (they handle tax + payment)
        ↓
Webhook → /api/webhooks/lemonsqueezy
        ↓
Customer record created with plan + API key (dg_...)
        ↓
Customer uses API key in Authorization header
        ↓
Pro/Team limits applied automatically
```

After payment, customers retrieve their API key:
```bash
curl -H "Authorization: Bearer dg_YOUR_KEY" https://your-app/api/me
```

---

## Kenya tax basics (not legal advice)

- **Income tax:** Report Lemon Squeezy payouts as business income on your annual return
- **VAT:** Only register if turnover exceeds KRA threshold (~KES 5M/year)
- **Records:** Export Lemon Squeezy payout reports monthly; store in Google Drive
- **PIN:** Ensure your KRA PIN is linked to your bank for clean transfers

Consult a Kenyan accountant once MRR exceeds ~$500/month. Until then, keep records and declare income.

---

## Secondary channel: MCPize (optional)

List the DriftGuard MCP server on https://mcpize.com before **June 10, 2026** for 85% revenue share. MCPize uses Stripe internally but handles MoR for you — another zero-compliance path. Can run **alongside** Lemon Squeezy for MCP-specific sales.

---

## Founding member pricing

Launch offer: **$15/mo locked forever** (vs $19 list). Create a separate Lemon Squeezy variant at $15 and use it in marketing. Switch the env var after launch week.
