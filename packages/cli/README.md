# @drift-guard/cli

**Alias install path.** The primary npm package is [`@drift-guard/driftguard`](https://www.npmjs.com/package/@drift-guard/driftguard).

This package re-exports the same `driftguard` and `driftguard-mcp` binaries so org-scoped installs work under a familiar name:

```bash
npx -y @drift-guard/cli@0.3.3 mcp
npx -y @drift-guard/driftguard@0.3.3 diff '{"a":1}' '{"a":1,"b":2}'
```

Prefer `@drift-guard/driftguard` for new integrations. See [docs/DISCOVERY.md](../../docs/DISCOVERY.md) and [docs/npm-org-defense.md](../../docs/npm-org-defense.md).
