# npm org defense

How DriftGuard protects scoped package names under the `@drift-guard` npm organization.

Org acquisition and publish checklist: [npm-org-chase.md](./npm-org-chase.md). Run `npm run check:npm-publish` before tagging.

## Why scoped packages

Only members of the **`drift-guard` npm org** can publish packages matching `@drift-guard/*`.

| Package | Role |
|---------|------|
| `@drift-guard/driftguard` | **Primary** — CLI, MCP server, `server.json` registry identifier |
| `@drift-guard/cli` | **Defensive alias** — same bins, occupies `@drift-guard/cli` under org control |
| `@drift-guard/diff-core` | Shared diff semantics (library) |

## Org hygiene

1. **Require 2FA** for all org members (npm → Organization → Require two-factor authentication).
2. **Minimal membership** — only maintainers who need publish access.
3. **Automation token in GitHub only** — store `NPM_TOKEN` as a repo secret; never commit or share in chat. Use an npm **Automation** token scoped to publish.
4. **No personal tokens on laptops** for production publishes — prefer tag-triggered [release workflow](../.github/workflows/release.yml).

## Publish immediately after merge

When DISC-001 merges to `main`:

1. Confirm `NPM_TOKEN` is set in GitHub repo secrets.
2. Tag and push (or re-run release workflow):

   ```bash
   git checkout main && git pull
   npm run sync-version
   git tag v0.3.3   # or current semver
   git push origin v0.3.3
   ```

3. Verify both packages:

   ```bash
   npm view @drift-guard/driftguard version
   npm view @drift-guard/cli version
   ```

Release workflow publishes **`@drift-guard/driftguard` first**, then **`@drift-guard/cli`**.

## Deprecate stale unscoped names

After scoped packages are live, deprecate the old third-party unscoped CLI name (not owned by this org):

```bash
npm deprecate driftguard-cli@0.1.1 "Use @drift-guard/cli or @drift-guard/driftguard — https://github.com/Drift-Guard/driftguard"
```

(Requires npm credentials if you own that package; otherwise document the migration path only.)

## Unscoped `driftguard` — not claimed

The unscoped npm name **`driftguard`** is currently published by [sjamcox](https://www.npmjs.com/package/driftguard) (unrelated package). **Do not** document or market an unscoped install path until a transfer is negotiated. Optional future: request transfer via npm support; until then, all official docs use `@drift-guard/driftguard`.

## MCP Registry

After publish, update [server.json](../server.json) identifier (via `npm run sync-version`) and run `mcp-publisher publish`. Registry install args should use `@drift-guard/driftguard@<version>` — see [DISCOVERY.md](./DISCOVERY.md).
