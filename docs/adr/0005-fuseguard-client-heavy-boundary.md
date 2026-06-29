---
status: accepted
---

# FuseGuard client-heavy data boundary

FuseGuard Cloud stores **trip index rows** and fleet metadata in the hosted control plane. Full tool arguments, LLM payloads, and complete call chains remain on the **client device** in SQLite (`~/.fuseguard/trips.db`).

## Decision

- **Runtime enforcement** runs locally: policy eval, loop/budget/rate, schema gates, optional drift preflight (cached).
- **Cloud sync** pushes only: heartbeats, block events, sampled allows, hourly rollups — index fields only (`argsHash`, not raw `args`).
- **Policy bundles** are published from hosted DriftGuard; clients pull immutable versioned JSON via etag.
- **Proprietary** console, ops, D1 layouts, and ingest specs live in the private hosted product — not in the public OSS repo.

## Consequences

- OSS ships `packages/fuseguard`, public schemas under `docs/schemas/fuse/`, and user guides under `docs/guides/`.
- Hosted enrollment, fleet UI, diagnostics compare, and ops surfaces link from [driftguard.org](https://driftguard.org) — see the public [FuseGuard guide](../guides/fuseguard.md).

## IP boundary checklist (FG-S01)

| Asset | OSS | Cloud only |
|-------|-----|------------|
| `policy-bundle.v1`, `trip-log.v2` schemas | Yes | — |
| `trip-index.v1` ingest schema | No | Yes |
| Full trip payloads | Client SQLite | Never in D1 |
| Console / ops UI | No | Yes |
| `FUSEGUARD-TEST-PLAN.md` | No | Yes |
| User guide + quickstart | Yes (link-outs only) | — |

Do not cite private implementation repos or ops hostnames in OSS user guides.
