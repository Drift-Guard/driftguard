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
