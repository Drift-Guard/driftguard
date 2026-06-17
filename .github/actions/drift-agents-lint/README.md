# drift-agents-lint

Offline CI validation for `.driftguard/agents.yaml` (CP-2.1 / RES-4.2). No API key required.

## Usage

```yaml
- uses: actions/checkout@v4
- uses: kioie/driftguard/.github/actions/drift-agents-lint@v0.3.3
  with:
    manifest: .driftguard/agents.yaml
```

Scan a directory for `agents.yaml` / `*.agents.yaml`:

```yaml
- uses: kioie/driftguard/.github/actions/drift-agents-lint@v0.3.3
  with:
    manifest: .driftguard
```

## Validates

- `version: 1`, required `agents[]` entries
- Policy preset names (`notify-only`, `production-guard`, …) or inline `policies` block
- `runtime_webhook` must be HTTPS
- Duplicate `id` / `slug`
- `a2a.cardUrl` requires matching `a2a_card` watch + `mcp.skillToolMap`
- `mcp` watch requires `mcp.configPath`
- Watch entries (`type` + `url`) per [examples/a2a/agents.yaml](../../../examples/a2a/agents.yaml)

Guide: [agent-binding-manifest.md](../../../docs/guides/agent-binding-manifest.md)

## CLI equivalent

```bash
npm run build && driftguard lint-agents .driftguard/agents.yaml
```

Hosted docs: [driftguard.org/docs/reference/agents-yaml](https://driftguard.org/docs/reference/agents-yaml)
