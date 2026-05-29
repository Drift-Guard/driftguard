# Open core boundary

DriftGuard uses an **open core** model.

## Public (this repository)

- JSON schema inference and diff for local payloads
- CLI for one-off comparisons
- MCP client that connects to the hosted service

These are intentionally useful but **not sufficient** to replicate hosted monitoring.

## Private (hosted service)

The following are **not published** and constitute the product moat:

- MCP protocol polling and tool schema extraction
- Continuous scheduling and multi-tenant watch management
- Drift classification pipeline for MCP tool changes
- Billing, API keys, and customer provisioning
- Alert delivery and drift history

## Contributing

Issues and PRs welcome for the **public client** only. The hosted service is not accepting external contributions.

## Security

If you discover a vulnerability in the public client, please open a GitHub issue. Do not disclose hosted infrastructure details publicly.
