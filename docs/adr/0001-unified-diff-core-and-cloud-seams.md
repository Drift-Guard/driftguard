---
status: accepted
---

# Unified diff core and cloud deep seams (ARCH-U01–U03)

DriftGuard had three forked implementations of schema diff semantics (OSS `diff.ts`, cloud `diff.ts`, ToolChange `schema_diff.py`), scattered “can this account do X?” logic across billing routes and console globals, and watch inventory orchestration spread across four insight services with repeated route glue. We extracted **`@driftguard/diff-core`** as the single deep module with explicit **cli** vs **hosted** infer profiles, added **`AccountCapabilities`** as the server read model for plan/features/overlays/quotas, and introduced **`WatchInsights`** as a facade that owns `resolveWatchContext` and inventory/profile entry points while routes stay thin adapters.

**Constraints we grilled and kept**

- **Open-core boundary:** diff-core lives in the OSS monorepo; cloud consumes it via `file:../packages/diff-core`. Hosted-only concerns (D1, billing rows, console) stay out of the package.
- **Profile divergence is intentional:** `cli` sets `markAllFieldsRequired: true` so local CI/MCP gates treat observed fields as part of the contract; `hosted` leaves fields optional so monitoring reports removals as warnings unless the stored schema says otherwise. Golden vectors in `contract/vectors.json` lock this — do not collapse profiles without a product decision.
- **Python duplicate retained for now:** ToolChange aligns via pytest against the same vectors; deleting `schema_diff.py` is a follow-up, not part of U01.
- **Capabilities are read-only truth for the console:** `GET /api/account/capabilities` feeds `state.capabilities`; server-side entitlement gates (`requireProductEntitlement`, ingest-trip checks) are not fully migrated yet — SEC-U01/U02 hardening continues separately.
- **WatchInsights is orchestration locality, not full deletion:** underlying `drift-insights` / `endpoint-insights` / `tool-insights` builders remain; the seam is “routes call one module,” not a rewrite of insight algorithms.

**Seam shape**

| Seam | Deep module | Adapters |
|------|-------------|----------|
| Diff | `@driftguard/diff-core` (`inferSchema`, `diffSchemas`, MCP helpers) | OSS `src/core/diff.ts` (`profile: cli`), cloud `src/core/diff.ts` (`profile: hosted`, `agentAction` extension), ToolChange pytest |
| Account | `resolveAccountCapabilities` | `GET /api/account/capabilities`, console `can()` prefers `state.capabilities` |
| Watch inventory | `resolveWatchContext`, `getWatchInventory`, profile/trail helpers | `insights-routes.ts` auth + param extraction only |

**Test surface**

- Golden contract vectors (TS + Python tool_manifest rows) — single source of semantic truth
- Profile + runtime resolution tests in `packages/diff-core/tests/`
- OSS adapter tests in `src/core/diff.test.ts`
- Cloud: `account-capabilities` unit tests; watch-insights seam export test; route behavior covered by existing integration suite

**Consequences**

- OSS `npm run build` must compile diff-core to `dist/` before `tsc`; publishing or CI smoke that runs `node dist/cli/check.js` depends on this ordering.
- Cloud ARCH PR merges after OSS diff-core lands so the file dependency resolves.
- Second wave (deferred): watch-check pipeline orchestration, console esbuild kernel — see `docs/PRODUCT-BUILD.md`.
