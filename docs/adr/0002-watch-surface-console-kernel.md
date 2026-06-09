---
status: accepted
---

# Watch surface composition, check pipeline, and console kernel (ARCH-H01–H03)

After ARCH-U02/U03, watch checks still ran as one opaque function (`runWatchCheck`), the console shipped as a 34-part `cat` IIFE with implicit load order, and `/api/watches/*` plus insights routes each re-mounted auth middleware without sharing **AccountCapabilities** on the request path. We deepened three seams: **`WatchCheckPipeline`** (capture → persist → diff → finalize), **`watchSurfaceRoutes`** with **`attachWatchSurfaceCapabilities`**, and a **`console-kernel.json`** manifest bundled through **esbuild** syntax validation.

## Grilling loop (constraints, seams, tests)

### Rejected alternatives

| Proposal | Why rejected |
|----------|--------------|
| Pluggable pipeline phases (hooks/plugins) | Cron, manual check, and on-demand snapshot share one ordering; a workflow engine adds indirection without a second consumer. |
| Move diff before persist | Drift events reference `afterSnapshotId`; FK integrity requires the after-snapshot row first. |
| Full ESM console with `import` across 34 parts | Touches every part for marginal gain; manifest + esbuild validate fixes load-order bugs at lower cost. |
| Single auth stack for `/api/drift` list + events | List/export routes are account-scoped; event detail routes are watch-surface scoped. Keeping drift list auth in `drift-routes.ts` avoids over-mounting capabilities on CSV export. |
| Delete `watches.ts` re-export | `mapWatch` export still used by tests and fixtures; `watchRoutes()` retained as thin compat shim only if referenced — primary mount is `watchSurfaceRoutes()`. |
| Migrate overlay **writes** behind capabilities middleware | SEC-U01 billing gate on `PUT /api/account/products` stays in products service; capabilities middleware is read-only for gating. |

### Constraints kept

- **Pipeline phases are ordered, not pluggable:** `capture → persist → diff → finalize` matches cron checks, manual `checkWatchById`, and future `on-demand-snapshot.ts` (trip-bound) without inventing a generic workflow engine.
- **Persist before diff is non-negotiable:** the after-snapshot must land in D1/R2 before drift events reference `afterSnapshotId`.
- **Finalize records HTTP success, not drift absence:** `recordWatchCheckOutcome(ok)` runs in finalize even when diff found breaking changes — the upstream fetch succeeded.
- **Capabilities load once per watch-surface request:** signed-in customers get `c.get("capabilities")` from middleware; trial paths fall back to plan-derived checks only when capabilities are unset.
- **Console kernel is manifest + esbuild validate, not full ESM yet:** parts remain script fragments in one IIFE scope.

### Seam shape

| Seam | Deep module | Adapters |
|------|-------------|----------|
| Watch check | `WATCH_CHECK_PHASE_ORDER`, `captureWatchSnapshot`, `persistWatchSnapshot`, `diffWatchSnapshot`, `finalizeWatchCheck` | `runWatchCheck` in `watcher-check.ts`, future `on-demand-snapshot.ts` |
| Watch surface | `watchSurfaceRoutes`, `attachWatchSurfaceCapabilities`, `requireWatchSurfaceAuth`, `requireDriftSummaryCapability` | `app.ts` single mount; `insights-routes` / `watch-api-routes` with `skipAuth: true` |
| Console | `web/console-kernel.json` part manifest | `scripts/bundle-console.mjs` (esbuild validate + emit), `npm run bundle:console` |

### Test surface

| Test | What it locks |
|------|----------------|
| `watch-check-pipeline.test.ts` | Phase order constant + exported phase functions |
| `watch-surface-middleware.test.ts` | Middleware export surface |
| `watch-insights.test.ts` / `account-capabilities.test.ts` | Retained from U02/U03 |
| `scripts/bundle-console.mjs` | Kernel parts exist; concatenated bundle parses under esbuild |
| Integration suite | Route behaviour — no duplicate shallow per-handler auth tests |

### Consequences

- Cloud ARCH-H PR stacks on #120 (ARCH-U02/U03); OSS #34 (diff-core) should merge first.
- Console contributors edit `console-kernel.json` when adding parts — `bundle-console.sh` is a thin wrapper.
- Insights drift diff handler uses `requireDriftSummaryCapability(c)` — prefers `state.capabilities` over client plan strings.
- Second wave complete; next candidates: `on-demand-snapshot.ts` pipeline adapter, lazy CLI subcommands (ARCH-M01).
