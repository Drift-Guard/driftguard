# DriftGuard — 7-Day Monetization Playbook

## Product thesis

**Problem:** Optic shut down. Developers and AI agents depend on third-party APIs and MCP tools that change without notice. Production breaks silently.

**Solution:** DriftGuard = continuous schema drift monitoring for REST APIs + MCP servers.

**Why we'll win:**
1. **Timing** — Optic migration wave (active NOW on Dev.to, HN)
2. **MCP-native** — Only tool with first-class MCP tool schema monitoring
3. **Agent distribution** — MCP server lets Cursor/Claude users discover us organically
4. **Open core** — Free self-host drives GitHub stars → paid hosted conversion

---

## Revenue model

| Tier | Price | Target customer |
|------|-------|-----------------|
| Free (self-host) | $0 | Indie devs, OSS adoption |
| Pro (hosted) | $19/mo | Solo devs monitoring Stripe/GitHub/MCP deps |
| Team | $49/mo | Small teams with 5+ integrations |

**Target:** 50 Pro users = **$950 MRR** in 90 days (conservative)

---

## Week 1 execution plan

### Day 1 (Today) — Build + Ship MVP ✅
- [x] Core diff engine
- [x] MCP server
- [x] REST API + landing page
- [x] GitHub repo public
- [ ] Deploy to Fly.io

### Day 2 — Distribution launch
- [ ] **Show HN:** "DriftGuard – Monitor MCP and API schema changes (post-Optic)"
- [ ] **Dev.to article:** "Optic is dead. Here's what I built for the MCP era."
- [ ] **Reddit:** r/programming, r/MachineLearning, r/LocalLLaMA
- [ ] **Product Hunt** prep (launch Day 4)

### Day 3 — Integrations
- [ ] GitHub Action for OpenAPI spec diff in CI (free, drives awareness)
- [ ] List MCP server on **MCPize** (85% revenue share, founding member before June 10)
- [ ] Slack webhook integration for Pro tier

### Day 4 — Product Hunt launch
- [ ] Launch on Product Hunt (Tuesday-Thursday optimal)
- [ ] Offer **founding member pricing:** $15/mo locked forever (vs $19)

### Day 5 — Content + SEO
- [ ] Comparison pages: "DriftGuard vs oasdiff", "DriftGuard vs FlareCanary"
- [ ] "Monitor Stripe webhooks for schema changes" tutorial
- [ ] "Monitor your MCP servers in Cursor" tutorial

### Day 6 — Outbound
- [ ] Find 20 companies that posted about Optic migration on GitHub issues
- [ ] Comment helpfully + mention DriftGuard
- [ ] DM 10 MCP server authors on GitHub — offer free Pro for feedback

### Day 7 — Payment live
- [ ] Stripe/Lemon Squeezy checkout for Pro
- [ ] Email drip for free users who hit watch limit
- [ ] Review metrics, double down on best channel

---

## Payment setup — Kenya (recommended)

**Use Lemon Squeezy only.** See [PAYMENTS_KENYA.md](./PAYMENTS_KENYA.md) for the full guide.

Why Lemon Squeezy from Kenya:
- Bank payouts to Kenyan accounts (USD → KES conversion)
- Merchant of Record — they handle global VAT/GST (you don't register in 200 countries)
- No US LLC or Stripe Atlas needed
- ~30 min setup

Quick steps:
1. Sign up at https://lemonsqueezy.com with Kenyan address
2. Add Kenyan bank under Settings → Payouts (select KES)
3. Create Pro ($19) and Team ($49) subscription products
4. Set webhook → `/api/webhooks/lemonsqueezy`
5. Copy env vars from [LAUNCH/lemonsqueezy-setup.md](./LAUNCH/lemonsqueezy-setup.md)

### ~~Option A: Lemon Squeezy~~ ✅ Implemented
Webhook handler + API keys + `/pricing` + `/activate` pages are live in code.

### ~~Option B: Stripe (direct)~~ ❌ Skip from Kenya
Requires US LLC. Not worth it for solo founder.

### Option C: MCPize marketplace (optional add-on)
1. Sign up at https://mcpize.com before **June 10, 2026** for 85% founding member rate
2. List DriftGuard MCP server as paid add-on for hosted watches
3. Zero payment infrastructure — runs alongside Lemon Squeezy

---

## Key metrics to track

| Metric | Week 1 target | Month 1 target |
|--------|---------------|----------------|
| GitHub stars | 100 | 500 |
| Registered watches | 50 | 500 |
| Email signups | 30 | 200 |
| Paying customers | 3 | 25 |
| MRR | $57 | $475 |

---

## Competitive positioning

| Tool | Strength | DriftGuard angle |
|------|----------|------------------|
| oasdiff | Best CI spec diff | We do live monitoring + MCP |
| FlareCanary | Live API monitoring | We're MCP-native + open core |
| HookSense | Webhook debugging | Different category |
| Specway | Spec hosting + alerts | We're developer/agent-first |

**Tagline:** *"The smoke detector for APIs and MCP tools."*

---

## Content hooks that will convert

1. "Your Cursor agent broke because an MCP tool changed its schema"
2. "Optic is dead — here's your migration path for live monitoring"
3. "Stop discovering Stripe API changes from production errors"
4. "Free MCP server that watches your other MCP servers"

---

## What I need from you (minimal manual tasks)

1. **Confirm GitHub repo name** — pushing to `kioie/driftguard` (or tell me different org)
2. **Set up Lemon Squeezy or Stripe** when ready for payments (Day 7)
3. **Approve Show HN post** before I submit
4. **Optional:** Custom domain `driftguard.dev` (~$12/yr)

Everything else I can execute autonomously.
