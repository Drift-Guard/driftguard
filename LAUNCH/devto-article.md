---
title: "Optic Is Dead — I Built an MCP-Native Schema Monitor"
published: false
description: "When Optic shut down, API drift detection became a gap. Here's DriftGuard — monitoring REST APIs and MCP server tool schemas for breaking changes."
tags: openapi, mcp, devops, saas
---

Optic handled a problem every integration team knows: **your API spec changed, and nobody told the client**.

When Optic shut down, teams scrambled. oasdiff covers CI spec diffs beautifully. FlareCanary monitors live endpoints. But there's a gap nobody's talking about:

**MCP server tool schemas change too — and AI agents break silently.**

## The problem with silent schema drift

If you're building with Cursor, Claude, or any MCP client, your agent depends on tools like:

- GitHub MCP (`create_pull_request`, `search_code`, ...)
- Custom internal MCP servers
- Third-party SaaS MCP integrations

When a tool's `inputSchema` changes — a new required field, a removed tool, a type change — your agent doesn't throw a helpful error. It just... fails weirdly.

Same story for REST APIs you don't control: Stripe webhooks, GitHub API responses, partner endpoints.

## What I built: DriftGuard

[DriftGuard](https://github.com/kioie/driftguard) monitors:

1. **REST API responses** — infers schema from JSON, diffs over time
2. **MCP server tools** — polls `tools/list`, detects tool additions/removals/schema changes

Changes are classified as **breaking**, **warning**, or **info**.

```bash
# Quick diff
npm run check -- diff '{"user":{"id":1,"email":"a@b.com"}}' '{"user":{"id":1}}'

# Result: breakingCount: 1 — email field removed
```

## MCP-native by design

DriftGuard ships as an MCP server. Your Cursor agent can:

- `register_watch` — add a URL to monitor
- `check_watch` — run immediate drift check
- `compare_json` — diff two payloads inline
- `list_drift_events` — see recent changes

This isn't bolted on. It's the distribution strategy — agents discovering and using drift monitoring autonomously.

## Open core + hosted Pro

| Tier | Price | What you get |
|------|-------|--------------|
| Free | $0 | Self-host, 3 watches, daily checks |
| Pro | $19/mo | 25 watches, hourly checks, hosted |
| Team | $49/mo | 100 watches, 15-min checks |

I'm based in Kenya, so payments run through **Lemon Squeezy** (Merchant of Record) — they handle global VAT, I get paid to my Kenyan bank in KES. No US LLC needed.

## How it compares

| Tool | Best for | MCP support |
|------|----------|-------------|
| oasdiff | CI spec diff | ❌ |
| FlareCanary | Live API monitoring | Partial |
| Specway | Spec hosting + alerts | ❌ |
| **DriftGuard** | APIs + MCP tools | ✅ Native |

**My recommendation:** oasdiff in CI for specs you control + DriftGuard for everything you depend on but don't control.

## Try it

```bash
git clone https://github.com/kioie/driftguard
cd driftguard && npm install && npm run dev
```

Or add the MCP server to Cursor — config in the repo README.

---

*Building in public from Nairobi. Follow the journey on GitHub: [kioie/driftguard](https://github.com/kioie/driftguard)*
