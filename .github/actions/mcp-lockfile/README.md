# MCP lockfile check

Runs `driftguard check` against `driftguard-lock.json` — offline MCP `tools/list` drift gate (no API key).

## Usage

```yaml
- uses: actions/checkout@v4
- uses: Drift-Guard/driftguard/.github/actions/mcp-lockfile@v0.3.3
  with:
    lockfile: driftguard-lock.json
    fail-on: breaking
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `lockfile` | `driftguard-lock.json` | Path to committed lockfile |
| `fail-on` | `breaking` | Severity threshold: `breaking`, `suspicious`, `warning`, or `info` |
| `config` | *(empty)* | Optional `mcp.json` path passed to `driftguard lock` when refreshing |

## Governance repos

Fail on semantic drift (description rewrites, enum relabels):

```yaml
- uses: Drift-Guard/driftguard/.github/actions/mcp-lockfile@v0.3.3
  with:
    lockfile: driftguard-lock.json
    fail-on: suspicious
```

## Refresh after reviewed drift

```bash
driftguard lock --config mcp.json -o driftguard-lock.json
# or: driftguard lock --url https://mcp.example.com/mcp
driftguard lock --update
git add driftguard-lock.json && git commit -m "chore: refresh MCP lockfile"
```

Pair with hosted `register_watch` for post-deploy monitoring. See [mcp-lockfile-bridge.md](../../../docs/guides/mcp-lockfile-bridge.md) and [CI.md](../../../docs/CI.md).
