# @drift-guard npm org — acquisition chase (OSS-6)

Async playbook for securing and operating the **`@drift-guard`** scoped namespace on npm. Primary publish path is already **`@drift-guard/driftguard`** — this doc covers org hygiene and optional name transfers.

## Current state

| Name | Status |
|------|--------|
| `@drift-guard/driftguard` | **Target primary** — CLI + MCP (`server.json` identifier) |
| `@drift-guard/cli` | **Defensive alias** — same bins |
| `@drift-guard/diff-core` | Library (publish when diff-core semver stabilizes) |
| Unscoped `driftguard` | [sjamcox](https://www.npmjs.com/package/driftguard) — unrelated; optional transfer via npm support |
| `driftguard-cli` | Third-party; deprecate message after scoped publish |

## Org checklist

1. **Create or verify** npm org `drift-guard` with 2FA required for all members.
2. **Add maintainers** with publish access only — no personal publish tokens on laptops.
3. **Create Automation token** scoped to publish; store as GitHub secret `NPM_TOKEN` on `Drift-Guard/driftguard`.
4. **Run publish prep** before every tag:

   ```bash
   npm ci && npm run build && npm run check:npm-publish
   ```

5. **Tag release** (triggers [release workflow](../.github/workflows/release.yml)):

   ```bash
   git tag v0.3.3   # match package.json
   git push origin v0.3.3
   ```

6. **Verify**:

   ```bash
   npm view @drift-guard/driftguard version
   npm view @drift-guard/cli version
   npx -y @drift-guard/driftguard@latest mcp   # stdio handshake
   ```

## Unscoped name transfer (optional)

If npm grants transfer of unscoped `driftguard`:

1. Do **not** repoint docs until transfer completes.
2. Publish scoped packages first; keep `@drift-guard/driftguard` as canonical identifier in `server.json`.
3. Optionally publish a `driftguard` meta-package that depends on `@drift-guard/driftguard` with a deprecation notice on old versions only.

## Migration from legacy scoped names

Older internal specs referenced `@Drift-Guard/driftguard-mcp`. **Do not** publish under `@kioie/*` — all consumer docs use `@drift-guard/driftguard`.

## Related

- [npm-org-defense.md](./npm-org-defense.md) — squatting defense and token hygiene
- [DISCOVERY.md](./DISCOVERY.md) · [npm-org-chase.md](./npm-org-chase.md) § OSS-2
- [DISCOVERY.md](./DISCOVERY.md) — MCP client npx template
