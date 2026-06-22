# DriftGuard Coverage Assert

CI gate — fails the job until all discovered dependencies are monitored on hosted DriftGuard (Pro API key or 1-endpoint trial).

## Usage

```yaml
- uses: actions/checkout@v4
- uses: Drift-Guard/driftguard/.github/actions/drift-coverage@v0.3.3
  with:
    api-key: ${{ secrets.DRIFTGUARD_API_KEY }}
    scan-paths: mcp.json,.cursor/mcp.json,package.json
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | One of key/trial | — | Pro/Team API key (`dg_…`) |
| `trial-session` | One of key/trial | — | Trial UUID (1 endpoint only) |
| `scan-paths` | No | default MCP paths | Repo files to scan |
| `files-json` | No | — | Explicit scan payload |
| `repo` | No | `GITHUB_REPOSITORY` | Console deep link slug |

Requires [DriftGuard Pro](https://driftguard.org/pricing) for multi-endpoint repos.

Docs: [docs/CI.md](https://github.com/Drift-Guard/driftguard/blob/main/docs/CI.md)
