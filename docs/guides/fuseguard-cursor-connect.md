# Connect Cursor to FuseGuard daemon

Route MCP tool traffic through the local FuseGuard proxy for offline policy, loops, and budgets — with optional cloud fleet sync.

## mcp.json snippet

```json
{
  "mcpServers": {
    "fuseguard-proxy": {
      "url": "http://127.0.0.1:9477"
    }
  }
}
```

Start the daemon first:

```bash
fuseguard daemon start --port 9477
```

## Enrollment (hosted policy)

```bash
fuseguard device enroll --token <from-console>
```

Policy bundles pull on daemon start and on heartbeat when enrolled.

## Environment

| Variable | Purpose |
|----------|---------|
| `FUSEGUARD_POLICY_PATH` | Local policy bundle path |
| `FUSEGUARD_RATE_MAX_PER_MINUTE` | Rate limit |
| `FUSEGUARD_BUDGET_CAP_USD` | Spend cap per run |
| `DRIFTGUARD_API_KEY` | Hosted preflight + sync |

See [fuseguard-cloud-quickstart](./fuseguard-cloud-quickstart.md) for console enrollment.
