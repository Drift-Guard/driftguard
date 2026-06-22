# Lockfile bridge (`driftguard lock` / `check`)

**Status:** Spec (implementation tracked in OSS `kioie/driftguard`)  
**Goal:** Git-friendly MCP tool-schema baselines for CI without a hosted API key; optional hosted `register_watch` for post-deploy monitoring.

## Problem

CI validates *your code against the current server* at deploy time. It cannot catch a third-party MCP server changing `tools/list` on Saturday night. Lockfile tools address the **pre-deploy half**; DriftGuard hosted watches address the **post-deploy half**.

## Commands (planned)

| Command | API key | Purpose |
|---------|---------|---------|
| `driftguard lock [--config mcp.json] [--url URL] [-o driftguard-lock.json]` | No | Snapshot `tools/list` (or parse `mcp.json` URLs) into a deterministic lockfile |
| `driftguard check [--lock driftguard-lock.json] [--fail-on suspicious\|warning\|breaking]` | No | Diff live catalog vs lockfile; exit non-zero on configured severity |
| `driftguard lock --update` | No | Refresh lockfile after reviewed drift (same as `lock` with write) |

Optional hosted monitoring (key required): `register_watch` / `suggest_watches` for continuous polling — see [agent-mcp.md](./agent-mcp.md).

## Lockfile format (`driftguard-lock.json` v1)

Deterministic JSON committed to git. Compatible with the ecosystem pattern used by MCP lockfile tools (sorted keys, stable tool ordering).

```json
{
  "lockfileVersion": 1,
  "generator": "@driftguard/driftguard",
  "generatedAt": "2026-06-21T12:00:00.000Z",
  "servers": [
    {
      "name": "stripe",
      "transport": "streamable-http",
      "url": "https://mcp.stripe.com/mcp",
      "tools": [
        {
          "name": "search_products",
          "description": "Search the product catalog",
          "inputSchema": { "type": "object", "properties": { "query": { "type": "string" } } }
        }
      ]
    }
  ]
}
```

**Rules:**

- `tools` sorted by `name` ascending.
- `inputSchema` normalized via `stableStringify` from `@driftguard/diff-core`.
- Stdio servers: entry records `command` + `args` + resolved env keys (names only, not values); lock requires local `tools/list` probe (offline `parse_mcp_config` cannot stdio today).
- One file may contain multiple servers from `mcp.json`.

## Diff semantics

Uses `diffMcpTools` from `@driftguard/diff-core`:

| Severity | Examples |
|----------|----------|
| `breaking` | Tool removed, param removed, type change, required added, enum value removed |
| `suspicious` | Large description rewrite, enum relabel (add + remove) |
| `warning` | Minor description edit, input schema removed |
| `info` | New optional tool/field, enum value added |

Default `check` failure threshold: `breaking`. `--fail-on suspicious` for governance-heavy repos.

## CI integration

### GitHub Actions (planned)

```yaml
- uses: kioie/driftguard/.github/actions/mcp-lockfile@v1
  with:
    lockfile: driftguard-lock.json
    fail-on: breaking
```

Reuses existing drift-diff Action patterns; SARIF/Markdown report output is a follow-up.

### Pair with hosted watch

```text
PR:     driftguard check     → gate merge on lockfile diff
Prod:   register_watch (MCP) → alert when vendor drifts between your deploys
```

## Implementation notes

- **Offline first:** `lock` / `check` use `compare_json` / `diffMcpTools` only; no `DRIFTGUARD_API_KEY`.
- **Transport:** Streamable HTTP first; stdio via subprocess `tools/list` in a later slice.
- **Discovery:** `parse_mcp_config` seeds server list from `mcp.json`; `lock --url` for single-server repos.

## Out of scope (v1)

- Live `tools/call` conformance (see [mcp-conformance-partners.md](./mcp-conformance-partners.md)).
- Fuzzy tool-rename detection across unrelated names (future enhancement).

## Definition of done

- [x] `driftguard lock` writes `driftguard-lock.json` from a live MCP HTTP endpoint
- [x] `driftguard check` exits 1 on breaking drift vs lockfile
- [x] Unit tests mirror `packages/diff-core/tests/mcp.test.ts` severity cases
- [x] [CI.md](../CI.md) documents lockfile + watch dual diagram
- [x] [agent-mcp.md](./agent-mcp.md) links lockfile as step 2a before hosted watch
