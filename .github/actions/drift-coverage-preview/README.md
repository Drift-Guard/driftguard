# DriftGuard Coverage Preview

Free CI scan for unmonitored API and MCP dependencies. Writes a job summary with console links and an auto-minted trial secret.

## Usage

```yaml
- uses: actions/checkout@v4
- uses: kioie/driftguard/.github/actions/drift-coverage-preview@v0.3.3
  with:
    scan-paths: mcp.json,.cursor/mcp.json,package.json
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `scan-paths` | No | `mcp.json,.cursor/mcp.json,package.json` | Repo files to scan when `files-json` is empty |
| `files-json` | No | — | Explicit `[{path, content}]` JSON |
| `fail-on-missing` | No | `false` | Fail job when gaps found |
| `repo` | No | `GITHUB_REPOSITORY` | Repo slug for console deep links |
| `version` | No | action tag | Client semver pin |

## Funnel

Non-blocking by default → Step Summary → trial secret → [Pro gate](./drift-coverage/README.md).

Docs: [docs/CI.md](https://github.com/kioie/driftguard/blob/main/docs/CI.md)
