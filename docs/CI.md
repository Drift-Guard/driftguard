# CI distribution model

DriftGuard embeds **version pins** at every CI integration layer so pipelines stay reproducible and upgrades are explicit.

## Distribution layers

| Layer | Pin example | Use case |
|-------|-------------|----------|
| **GitHub Action ref** | `uses: kioie/driftguard/.github/actions/drift-diff@v0.3.1` | Primary CI path — version in git tag |
| **Action `version` input** | `version: '0.3.1'` | Override client semver inside composite steps |
| **npx / npm** | `npx driftguard@0.3.1 diff '…' '…'` | Shell scripts, custom runners |
| **GitHub Release tarball** | `driftguard-0.3.1.tgz` | Fallback when npm is unavailable (setup action uses this automatically) |
| **Client header** | `X-DriftGuard-Client-Version: 0.3.1` | Hosted API requests from CLI/MCP |

**Hosted service** (`driftguard-cloud`) uses an independent semver (e.g. `0.9.x`). The OSS client sends `X-DriftGuard-Client-Version` on Pro API calls; `/health` reports the service version.

## Pinning policy

- **Production CI:** pin the Action ref (`@v0.3.1`) or `npx driftguard@0.3.1` — never `@main` or `@latest`.
- **Renovate/Dependabot:** bump the tag when adopting a new client release.
- **Floating `@0` npm range:** acceptable for local dev only.

Print embed paths from a installed CLI:

```bash
driftguard version --json
```

## Offline JSON diff (no API key)

### GitHub Action

```yaml
jobs:
  schema-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: kioie/driftguard/.github/actions/drift-diff@v0.3.1
        with:
          before: '{"status":"ok","data":{"id":1,"name":"test"}}'
          after: '{"status":"ok","data":{"id":1}}'
```

Exit code **1** when `breakingCount > 0`.

Compare fixtures from files:

```yaml
      - uses: kioie/driftguard/.github/actions/drift-diff@v0.3.1
        with:
          before: ${{ hashFiles('fixtures/api-before.json') && '' }}
```

Prefer checking in JSON and using `run:` with `driftguard diff` when inputs are large — see [examples/workflows/drift-diff.yml](../examples/workflows/drift-diff.yml).

### npx

```bash
npx driftguard@0.3.1 diff "$BEFORE_JSON" "$AFTER_JSON"
```

### Shell (clone + build)

```bash
npm ci && npm run build
node dist/cli/check.js diff "$BEFORE" "$AFTER"
```

## Hosted coverage assert (Pro/Team)

Ensures dependencies found in repo files (e.g. `mcp.json`) are registered as DriftGuard watches.

### GitHub Action

```yaml
jobs:
  driftguard-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Read files to scan
        id: files
        run: |
          node <<'NODE'
          const fs = require('fs');
          const files = [
            { path: 'mcp.json', content: fs.readFileSync('mcp.json', 'utf8') },
          ];
          fs.writeFileSync(process.env.GITHUB_OUTPUT, 'json=' + JSON.stringify(files) + '\n', { flag: 'a' });
          NODE
      - uses: kioie/driftguard/.github/actions/drift-coverage@v0.3.1
        with:
          api-key: ${{ secrets.DRIFTGUARD_API_KEY }}
          files-json: ${{ steps.files.outputs.json }}
```

See [examples/workflows/drift-coverage.yml](../examples/workflows/drift-coverage.yml).

### npx

```bash
export DRIFTGUARD_API_KEY=dg_…
export DRIFTGUARD_FILES_JSON='[{"path":"mcp.json","content":"..."}]'
npx driftguard@0.3.1 assert-coverage
```

## Setup action (advanced)

Install the CLI in custom steps:

```yaml
- uses: kioie/driftguard/.github/actions/setup-driftguard@v0.3.1
  id: dg
  with:
    version: "0.3.1"
- run: driftguard version
```

Resolution order for `version`:

1. `inputs.version`
2. Action git ref (`@v0.3.1` → `0.3.1`)
3. `package.json` in the workspace (same-repo dev)

Install tries **npm** first, then **GitHub Release** `.tgz`.

## MCP in CI (agents)

For agent-driven pipelines, point MCP at a pinned release binary or use tools documented in [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md).

## Hosted API (direct)

| Endpoint | Auth | CI use |
|----------|------|--------|
| `POST /api/coverage/assert` | API key | Coverage gate (`assert-coverage` CLI wraps this) |
| `POST /api/diff` | Public (rate-limited) | JSON diff without local install |
| `POST /api/openapi/diff` | Public (rate-limited) | OpenAPI spec diff |
| `GET /health` | Public | Deploy smoke — service version |

Override hosted URL: `DRIFTGUARD_API` env or action `api` input.

## Version sync (maintainers)

On release, `scripts/sync-version.mjs` updates `server.json` from `package.json`. Tag `v*` triggers [release.yml](../.github/workflows/release.yml) (npm pack + GitHub Release assets).

## Upgrade funnel

Offline diff and coverage **preview** work without signup. Continuous monitoring, alerts, and MCP polling require [hosted Pro/Team](https://driftguard.eddy-d55.workers.dev/pricing).
