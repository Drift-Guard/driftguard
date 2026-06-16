# Public roadmap (OSS)

The **hosted product roadmap** (control plane, billing, console, GTM, handbook, pricing strategy) is maintained in the private **`driftguard-cloud`** repository — not in this public repo. See [OPEN_CORE.md](../OPEN_CORE.md).

## What this repo ships (OSS)

| Area | Status | Docs |
|------|--------|------|
| Local JSON / MCP diff | Shipped | [README.md](../README.md), [docs/QUICKSTART.md](./QUICKSTART.md) |
| MockDrift (Gate 1) | Shipped | [docs/mockdrift/](./mockdrift/) |
| FuseGuard (Gate 2A) | Shipped | [packages/fuseguard/README.md](../packages/fuseguard/README.md) |
| ToolChange (Gate 3A) | Shipped (alpha) | [packages/toolchange/README.md](../packages/toolchange/README.md) |
| SchemaSync lint-nl (Gate 4A) | Shipped (partial) | [packages/schemasync/README.md](../packages/schemasync/README.md) |

## Hosted capabilities (not in this repo)

Continuous watches, drift history, alerts, identity, billing, and console — [free trial](https://driftguard.org/start) · [pricing](https://driftguard.org/pricing).

User guide for A2A Contract Watch (conceptual): [guides/a2a-contract-watch.md](./guides/a2a-contract-watch.md).

## Harness engineering (H0–H5)

Portable **harness bundle** (fixtures + gates + agent bindings) and **LLM-readable sensor output** for in-loop self-correction and PGE-style CI (generator ≠ evaluator). ADR: [adr/0003-harness-bundle.md](./adr/0003-harness-bundle.md). Sensor schema: [mockdrift/sensor-v1.schema.yaml](./mockdrift/sensor-v1.schema.yaml).

| Phase | Deliverable | Status | Repo |
|-------|-------------|--------|------|
| **H0** | `mockdrift.sensor/v1` schema + `to_sensor_json()` + pytest artifact | **Shipped** | OSS |
| **H1** | `.driftguard/gates.yaml`, `harness.lock`, `lint-harness` | **Shipped** | OSS |
| **H2** | `mockdrift init` (LangGraph + custom/proxy scaffolds) | **Shipped** | OSS |
| **H3** | Fixture marketplace index (`vendor/scenario`), curated packs | **Shipped** | OSS |
| **H4** | Evaluator agent pack (rule-only CI; PGE job 2 reads sensor JSON only) | **Shipped** | OSS |
| **H5** | CrewAI init template; hosted fixture catalog + install | **Shipped** — OSS client + hosted catalog API | OSS + hosted |

Aligns with [policies/gate-ladder.md](./policies/gate-ladder.md) — MockDrift remains Gate 1 sensor; FuseGuard / ToolChange / SchemaSync toggled via `gates.yaml`.

## Semantic drift (flagship)

Semantic / NL drift classification for hosted Pro/Team remains on the **hosted** product. Local OSS diff is structural (JSON schema) only.

## Singapore MGFA product fit (guiding doc)

Strategic orientation for MGFA-aligned enhancements across the **full ecosystem** (Core CLI/MCP, diff-core, MockDrift, FuseGuard, ToolChange, SchemaSync, harness bundle, evaluator/PGE, A2A Contract Watch, hosted watches and complements — contract observability lane, not compliance certification): [SINGAPORE-MGFA-PRODUCT-FIT.md](./SINGAPORE-MGFA-PRODUCT-FIT.md).

## Agent discoverability (PostHog parity)

Implementation specs for agent discovery, one-session MCP install, and single-key activation: [AGENT-DISCOVERY-ROADMAP.md](./AGENT-DISCOVERY-ROADMAP.md).

## Documentation hub

Public user and integrator docs (getting started, guides, reference, CI, gate ladder) live under [docs/](./README.md). Product roadmap and internal specs do not.
