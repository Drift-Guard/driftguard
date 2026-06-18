# E8 — Portable harness bundle (`gates.yaml`, `harness.lock`)

**Assessment status:** Draft  
**Owner tier:** OSS  
**Wave:** E (Enablement)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Teams can't reproduce the same gate configuration across dev/staging/prod CI. |
| **MGFA directness** | **Medium-high** — Dim 3 reproducible pre-deploy testing baselines. |
| **Revenue / strategic** | OSS adoption multiplier; "baseline safety test bundle" positioning helps regulated buyers without new hosted SKUs. |
| **Differentiation** | Competitors offer point tools; `.driftguard/` bundle + lockfile is ecosystem-specific packaging. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **High** — H1 **shipped** ([adr/0003-harness-bundle.md](../../adr/0003-harness-bundle.md)). Lockfile signing is optional nice-to-have. |
| **Open-core boundary** | Fully OSS — no boundary risk. |
| **Dependency risk** | Signing adds crypto/key-mgmt burden — defer unless enterprise asks. |
| **Scope creep risk** | **Low** — bundle orchestrates gates, doesn't enforce runtime policy (doc acknowledges gap). |

## Verdict

**Go** — Low engineering (mostly positioning + optional signing spike); strengthens pre-deploy MGFA narrative when paired with E22.

**Wave C pairing:** [E22 harness ↔ gate orchestration](./E22-harness-gate-orchestration.md) — Singapore checklist profile in `examples/harness-mgfa/.driftguard/`.

## Go delivery (2026-06)

| Deliverable | Status |
|-------------|--------|
| Harness bundle ADR (H0–H5, `.driftguard/` layout) | [adr/0003-harness-bundle.md](../../adr/0003-harness-bundle.md) |
| Singapore deployment checklist — pin + lint harness steps | [singapore-agent-deployment-checklist.md](../../guides/singapore-agent-deployment-checklist.md) |
| MGFA orchestration profile (E22 gate mapping) | [examples/harness-mgfa/.driftguard/gates.yaml](../../../examples/harness-mgfa/.driftguard/gates.yaml) · [harness.lock](../../../examples/harness-mgfa/.driftguard/harness.lock) |
| Harness lint CI workflow template | [examples/workflows/drift-harness.yml](../../../examples/workflows/drift-harness.yml) |
| `mockdrift init` scaffold → portable bundle | [mockdrift-init-fixtures.md](../../guides/mockdrift-init-fixtures.md) · [getting-started.md](../../getting-started.md) |
| Cursor rule + DISCOVERY harness cross-link | [examples/cursor-rule-driftguard.mdc](../../../examples/cursor-rule-driftguard.mdc) · [DISCOVERY.md](../../DISCOVERY.md) |
| Wave B/C enablement bundle ([#97](https://github.com/kioie/driftguard/pull/97)) | Singapore checklist + E2/E15/E22 cross-links |

Assessment remains **Draft** — verdict **Go** (H1 shipped; lockfile signing optional; pairs with E22 orchestration).
