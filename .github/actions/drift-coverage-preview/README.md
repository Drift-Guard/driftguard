# DriftGuard Coverage Preview

Free CI scan for unmonitored API and MCP dependencies. Writes a GitHub Step Summary with console links and an optional auto-minted trial secret.

Part of the **hook → preview → Pro gate** funnel — non-blocking by default. Pair with [drift-diff](../drift-diff/README.md) for offline breaking checks and [drift-coverage](../drift-coverage/README.md) for the Pro gate.

## Usage

**Simplest path** — scan common config files in the checkout:

```yaml
- uses: actions/checkout@v4
- uses: Drift-Guard/driftguard/.github/actions/drift-coverage-preview@v0.3.3
  with:
    scan-paths: mcp.json,.cursor/mcp.json,package.json
```

**Explicit payloads** — when files are generated in an earlier step:

```yaml
- uses: Drift-Guard/driftguard/.github/actions/drift-coverage-preview@v0.3.3
  with:
    files-json: '[{"path":"mcp.json","content":"..."}]'
```

Copy [examples/workflows/driftguard-starter.yml](../../../examples/workflows/driftguard-starter.yml) for a one-file starter workflow.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `scan-paths` | No | `mcp.json,.cursor/mcp.json,package.json` | Repo files to scan when `files-json` is empty |
| `files-json` | No | — | Explicit `[{path, content}]` JSON |
| `fail-on-missing` | No | `false` | Fail job when gaps found |
| `repo` | No | `GITHUB_REPOSITORY` | Repo slug for console deep links |
| `version` | No | action tag | Client semver pin |

## Behavior

| | **drift-diff** | **drift-coverage-preview** |
|---|---|---|
| Network | No | Yes (hosted scan) |
| API key | No | No |
| Blocks CI | On breaking diff | Only if `fail-on-missing: true` |
| Output | Job log JSON | Job log + Step Summary |

Stdout is JSON with `missingCount`, discovered endpoints, and `upgrade` links. When trial minting is enabled (default), the summary may include a `DRIFTGUARD_TRIAL_SESSION` secret hint for the Pro gate.

## Funnel

Non-blocking by default → Step Summary → trial secret → [Pro gate](./drift-coverage/README.md).

Docs: [docs/CI.md](https://github.com/Drift-Guard/driftguard/blob/main/docs/CI.md) · Marketplace path: [docs/GITHUB_MARKETPLACE.md](https://github.com/Drift-Guard/driftguard/blob/main/docs/GITHUB_MARKETPLACE.md)
