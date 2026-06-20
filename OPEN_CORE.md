# Open core boundary

DriftGuard uses an **open core** model.

## Terminology

| Term | Meaning |
|------|---------|
| **Open-source client** | This repo — local diff, MCP connector |
| **Hosted DriftGuard** | Managed SaaS — monitoring, alerts, console |
| ~~Self-host~~ | **Avoid** for the full product — it is not available from the public repo |

## Public (this repository)

- JSON schema inference and diff for local payloads
- CLI: `driftguard diff`, `driftguard mcp`
- MCP tools: `compare_json`, `parse_mcp_config`, `hosted_info`, `explain_drift`, `validate_payload`
- CLI: `driftguard validate` — offline ingress payload gate against pinned consumer profiles
- MCP proxy to hosted API when `DRIFTGUARD_API_KEY` is set

These are intentionally useful for **testing and agent workflows** but **not sufficient** to replicate hosted monitoring.

## Private (hosted service)

The following are **not published** and constitute the product:

- MCP protocol polling and tool schema extraction
- Continuous scheduling and multi-tenant watch management
- Drift classification pipeline for MCP tool changes
- Billing, API keys, and customer provisioning
- Alert delivery, drift history, web console
- **Product roadmap, GTM, pricing strategy, handbook, and control-plane task specs** (`driftguard-cloud` repo only — never in the public repo)
- **Competitive design research, moat analysis, and “parity with [vendor]” positioning** (cloud only — see [docs/policies/IP-BOUNDARY-POLICY.md](docs/policies/IP-BOUNDARY-POLICY.md))

## Funnel

```
OSS client (try offline) → free trial → set DRIFTGUARD_API_KEY → monitoring tools
```

**Single activation variable:** `DRIFTGUARD_API_KEY` (`dg_…`) unlocks all hosted MCP tools and CI gates. Advanced overrides (`DRIFTGUARD_API`, `DRIFTGUARD_ALLOW_CUSTOM_API`) are for staging or enterprise proxies only.

Trial: https://driftguard.org/start

## Contributing

Issues and PRs welcome for the **public client** only. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Report vulnerabilities in the public client via GitHub issues. Do not disclose hosted infrastructure details publicly.
