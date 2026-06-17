# Public roadmap (OSS)

The **hosted product roadmap** (control plane sequencing, billing COGS, GTM playbooks) is maintained in the private **`driftguard-cloud`** repository — not in this public repo. See [OPEN_CORE.md](../OPEN_CORE.md).

**Public phase summary & enterprise narrative:** [driftguard.org](https://driftguard.org) handbook (private repo; link-out only).

---

## Public hosted roadmap

Reader-facing phases (no internal task IDs). Status as of 2026-06.

| Phase | Focus | OSS | Hosted | Status |
|-------|--------|-----|--------|--------|
| **Foundation** | Truthful `drift_status` + alert payloads with `agentAction` | Diff + MCP client | Watches, webhooks v2, console chips | **Shipped** |
| **Status plane** | Queryable health before orchestrator runs | `get_watch_status` proxy | REST status, portfolio status, preflight API | **Shipped** |
| **Bindings & policies** | Agent ↔ watch mapping, ack-to-unblock | `agents.yaml`, harness | Bindings ingest, drift policies, affected agents | **Shipped** |
| **Runtime enforcement** | Stop retry spirals under policy | FuseGuard (OSS fuse) | Trip ingest + drift correlation | **Shipped** |
| **Remediation** | Propose fixes, not just alert | MockDrift, SchemaSync lint-nl | Draft PR records, remediation triggers | **Partial** |
| **Portfolio & scale** | Fleet ops, enterprise depth | — | Compass, optimizer, audit/RBAC/SSO | **In progress** |

Unreleased hosted APIs return **501** with stable JSON — not 404. Call MCP `hosted_info` for the current offline vs keyed tool list.

---

## Hosted capability matrix

| Capability | OSS (free) | Hosted (API key) | Notes |
|------------|------------|------------------|-------|
| Structural JSON / MCP diff | Yes | — | `compare_json`, `parse_mcp_config` |
| Offline MCP config preview | Yes | — | No network |
| CI gates (MockDrift, ToolChange, …) | Yes | Assert/enforce with key | [gate ladder](./policies/gate-ladder.md) |
| FuseGuard loop/budget fuse | Yes | Trip correlation on Pro+ | OSS fuse stays free |
| Continuous URL watches | — | Yes | Trial: 3 URLs daily |
| MCP `tools/list` polling | — | Yes | Core hosted value |
| Drift history & export | — | Yes | Tier retention limits |
| Webhooks / Slack / PagerDuty | — | Yes | v2 payloads with enrichment |
| Watch & agent status APIs | Proxy only | Yes | `get_watch_status`, preflight |
| Semantic / NL drift class | — | Pro/Team | Structural diff in OSS only |
| Agent bindings & policies | Validate locally | Yes | Console + API |
| SchemaSync draft PRs | lint-nl | Records + console | Full GitHub App loop in progress |
| Billing & console | — | Yes | [pricing](https://driftguard.org/pricing) |

---

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

Boundary docs (structural vs semantic; no SOP compliance claims; MGFA Dim 3 policy-adjacent only): [guides/semantic-drift-boundary.md](./guides/semantic-drift-boundary.md). Assessment: [E13](./assessments/mgfa/E13-semantic-nl-drift-classification.md).

## Singapore MGFA product fit (guiding doc)

Strategic orientation for MGFA-aligned enhancements across the **full ecosystem** (Core CLI/MCP, diff-core, MockDrift, FuseGuard, ToolChange, SchemaSync, harness bundle, evaluator/PGE, A2A Contract Watch, hosted watches and complements — contract observability lane, not compliance certification): [SINGAPORE-MGFA-PRODUCT-FIT.md](./SINGAPORE-MGFA-PRODUCT-FIT.md).

## Agent discoverability (PostHog parity)

Implementation specs for agent discovery, one-session MCP install, and single-key activation: [AGENT-DISCOVERY-ROADMAP.md](./AGENT-DISCOVERY-ROADMAP.md).

## Documentation hub

Public user and integrator docs (getting started, guides, reference, CI, gate ladder) live under [docs/](./README.md). Product roadmap and internal specs do not.
