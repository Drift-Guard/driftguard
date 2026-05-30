# CI distribution model

DriftGuard CI is designed as a **hook → trial → paid** funnel. Embed a version pin in your pipeline, get value immediately, then upgrade when you need full coverage gates.

**Pin policy:** `uses: kioie/driftguard/...@v0.3.2` or `npx driftguard@0.3.2` — never `@main`.

---

## The funnel

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. HOOK (free, unlimited)                                       │
│    drift-diff / compare_json                                    │
│    → Teams see breaking schema changes in CI                     │
├─────────────────────────────────────────────────────────────────┤
│ 2. PREVIEW (free, non-blocking by default)                      │
│    drift-coverage-preview / coverage-preview                    │
│    → Discovers N endpoints, 0–1 covered on trial                │
│    → Prints console + trial links in GitHub Step Summary          │
├─────────────────────────────────────────────────────────────────┤
│ 3. TRIAL (1 endpoint, full Pro in console)                      │
│    /start?from=ci&import=…                                      │
│    → CI deep link pre-fills first missing watch                 │
├─────────────────────────────────────────────────────────────────┤
│ 4. GATE (paid or trial-limited)                                 │
│    drift-coverage + DRIFTGUARD_API_KEY                          │
│    → Fails CI until all discovered deps are watched             │
│    → Trial: only 1 endpoint — multi-deps forces Pro upgrade     │
└─────────────────────────────────────────────────────────────────┘
```

| Tier | Action / command | API key | Blocks CI? | Endpoint limit |
|------|------------------|---------|------------|----------------|
| **Hook** | `drift-diff` | No | On breaking diff only | Unlimited diff |
| **Preview** | `drift-coverage-preview` | No | Optional (`fail-on-missing`) | Shows all; covers 0 |
| **Trial gate** | `drift-coverage` + trial session | Trial header | Yes | **1 endpoint** |
| **Pro gate** | `drift-coverage` + API key | `dg_…` | Yes | Plan limit (50 Pro) |

---

## Layer 1 — Hook (free)

```yaml
- uses: kioie/driftguard/.github/actions/drift-diff@v0.3.2
  with:
    before: '{"status":"ok","data":{"id":1,"name":"test"}}'
    after: '{"status":"ok","data":{"id":1}}'
```

```bash
npx driftguard@0.3.2 diff "$BEFORE" "$AFTER"
```

---

## Layer 2 — Preview (free, hooks upgrade)

Scans `mcp.json`, OpenAPI specs, and URLs in repo files. **Does not block** your pipeline by default — it writes a Step Summary with unmonitored endpoints and one-click console links.

```yaml
- uses: actions/checkout@v4
- name: Build scan payload
  id: scan
  shell: bash
  run: |
    node <<'NODE'
    const fs = require('fs');
    const paths = ['mcp.json', '.cursor/mcp.json', 'package.json'].filter((p) => fs.existsSync(p));
    const files = paths.map((path) => ({ path, content: fs.readFileSync(path, 'utf8') }));
    require('fs').appendFileSync(process.env.GITHUB_OUTPUT, `files-json=${JSON.stringify(files)}\n`);
    NODE
- uses: kioie/driftguard/.github/actions/drift-coverage-preview@v0.3.2
  with:
    files-json: ${{ steps.scan.outputs.files-json }}
    # fail-on-missing: true   # optional — turn on after upgrading
```

Console link (from Step Summary): `/console?from=ci&import=…` — opens with CI import banner.

---

## Layer 3 — Trial (console, 1 endpoint)

After preview, click **Start free trial** in the Step Summary or open:

`https://driftguard.org/start?from=ci`

The wizard pre-fills the first endpoint your CI discovered. Trial includes full Pro features on **one** watch (30-min checks, webhooks, export).

For CI gate with trial (1 endpoint only):

```yaml
- uses: kioie/driftguard/.github/actions/drift-coverage@v0.3.2
  with:
    trial-session: ${{ secrets.DRIFTGUARD_TRIAL_SESSION }}
    files-json: ${{ steps.scan.outputs.files-json }}
```

If CI finds **multiple** endpoints, the gate fails with an upgrade message — that is intentional.

---

## Layer 4 — Pro gate (paid)

Add `DRIFTGUARD_API_KEY` (from [pricing](https://driftguard.org/pricing) → activate):

```yaml
- uses: kioie/driftguard/.github/actions/drift-coverage@v0.3.2
  with:
    api-key: ${{ secrets.DRIFTGUARD_API_KEY }}
    files-json: ${{ steps.scan.outputs.files-json }}
```

Failures include `upgrade.console` URL to import missing watches without leaving your browser.

---

## Version embedding

| Mechanism | Example |
|-----------|---------|
| GitHub Action ref | `@v0.3.2` |
| npx | `npx driftguard@0.3.2` |
| CLI | `driftguard version --json` → `ci.actionRef`, `ci.npx` |
| Client header | `X-DriftGuard-Client-Version` on hosted calls |

Setup action installs from **npm** or **GitHub Release** `.tgz` fallback.

---

## Recommended starter workflow

See [examples/workflows/drift-diff.yml](../examples/workflows/drift-diff.yml) and [examples/workflows/drift-coverage.yml](../examples/workflows/drift-coverage.yml).

Typical progression:

1. Add `drift-diff` on PRs (immediate value).
2. Add `drift-coverage-preview` (shows gap, links to console).
3. Start trial from CI link → first watch in console.
4. Add `DRIFTGUARD_API_KEY` → switch preview to `drift-coverage` gate.

---

## API reference (hosted)

| Route | Auth | Funnel tier |
|-------|------|-------------|
| `POST /api/coverage/preview` | None (rate-limited) | Preview |
| `POST /api/coverage/assert` | API key or trial session | Gate |
| `GET /health` | None | Deploy smoke |

Headers: `X-DriftGuard-CI-Repo`, `X-DriftGuard-Client-Version` (optional).

---

## Upgrade URLs

All preview/assert responses include:

- `upgrade.start` — trial wizard with CI import
- `upgrade.console` — import missing watches
- `upgrade.pricing` — Pro/Team plans
- `upgrade.activate` — API key after checkout

Hosted monitoring (alerts, MCP polling, history) requires Pro/Team — see [OPEN_CORE.md](../OPEN_CORE.md).
