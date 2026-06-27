# Security & trust

Public posture for the **open-source client** and how it relates to **hosted DriftGuard**. No hosted infrastructure secrets or operator runbooks in this repo — see [OPEN_CORE.md](../../OPEN_CORE.md).

**Report client vulnerabilities:** [GitHub Issues](https://github.com/Drift-Guard/driftguard/issues) on `Drift-Guard/driftguard`. Do not disclose hosted control-plane details publicly.

---

## Data boundaries

| Data | Where it lives | OSS exposure |
|------|----------------|--------------|
| **Local JSON you diff** | Your machine / CI runner | Never sent unless you call hosted tools or `explain_drift` |
| **`mcp.json` preview** | Parsed offline by `parse_mcp_config` | No network |
| **API key** (`dg_…`) | Your MCP env or CI secrets | Sent only to configured `DRIFTGUARD_API` (default `https://driftguard.org`) |
| **Watch payloads & history** | Hosted storage | Accessed via API key; not in public repo |
| **Billing & tenant data** | Private `driftguard-cloud` repo | Not in OSS |

Custom API base requires `DRIFTGUARD_ALLOW_CUSTOM_API=1` — prevents hostile MCP configs from redirecting your token. See [Reference — env vars](../reference/README.md#environment-variables).

---

## OSS client posture

| Topic | Status |
|-------|--------|
| **Public repo contents** | Client, docs, examples only — audited [May 2026](./PUBLIC-REPO-AUDIT.md) |
| **Secrets in repo** | None committed; Gitleaks in CI |
| **Hosted infra in git** | `cloud/` gitignored; control plane in private repo |
| **MCP stdio** | Logs to stderr only; no secrets in tool responses |
| **Dependencies** | `npm audit` in CI |

---

## Hosted vs OSS (security reviewer FAQ)

| Question | Answer |
|----------|--------|
| Can I self-host full monitoring from this repo? | **No** — continuous watches, MCP polling, alerts, and console are hosted SaaS |
| What does the OSS MCP server do with my key? | Proxies authenticated requests to the hosted API — [hosted API index](../reference/hosted-api.md) |
| Where are webhook signing keys documented? | Hosted console / API docs on [driftguard.org](https://driftguard.org) |
| Semantic / NL drift classification? | Hosted roadmap — not in OSS structural diff |

---

## Documents in this folder

| Doc | Audience | Content |
|-----|----------|---------|
| [PUBLIC-REPO-AUDIT.md](./PUBLIC-REPO-AUDIT.md) | Maintainers, security | History scrub, proprietary content removal |
| [SECRET-ROTATION-CHECKLIST.md](./SECRET-ROTATION-CHECKLIST.md) | Operators (hosted) | Post-scrub rotation — **hosted secrets only** |
| [on-demand-snapshot.md](./on-demand-snapshot.md) | FuseGuard Gate 2B | On-demand snapshot API security checklist |

Operator runbooks for production Workers live in the private **`driftguard-cloud`** repository.

---

## Trust links

| Resource | URL |
|----------|-----|
| Trial (no card for eval) | [driftguard.org/start](https://driftguard.org/start) |
| Pricing & Team features | [driftguard.org/pricing](https://driftguard.org/pricing) |
| Open core boundary | [OPEN_CORE.md](../../OPEN_CORE.md) |
| Contributing | [CONTRIBUTING.md](../../CONTRIBUTING.md) |

---

## Related hub pages

| Doc | Purpose |
|-----|---------|
| [Policies](../policies/README.md) | Coverage and breaking-change guardrails |
| [Platform admin](../guides/platform-admin.md) | API keys and alert config (hosted) |
| [Changelog](../changelog/README.md) | Client release notes and breaking MCP policy |
