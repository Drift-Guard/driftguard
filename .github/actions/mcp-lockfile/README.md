# MCP lockfile check

Runs `driftguard check` against `driftguard-lock.json` — offline MCP `tools/list` drift gate (no API key).

```yaml
- uses: kioie/driftguard/.github/actions/mcp-lockfile@v1
  with:
    lockfile: driftguard-lock.json
    fail-on: breaking
```

Pair with hosted `register_watch` for post-deploy monitoring. See [mcp-lockfile-bridge.md](../../../docs/guides/mcp-lockfile-bridge.md).
