# Guides

Step-by-step guides by role. For exact tool contracts see [Reference](../reference/README.md); for linear onboarding see [Getting started](../getting-started.md).

---

## Pick your guide

| Track | Guide | You are… |
|-------|-------|----------|
| **Developer** | [developer.md](./developer.md) | Running diffs, pre-commit checks, reading output, fixing issues |
| **Agent / MCP** | [agent-mcp.md](./agent-mcp.md) | Picking tools (free first), `SYSTEM_PROMPT` companion |
| **CI/CD** | [ci-cd.md](./ci-cd.md) | Adding hook → preview → trial → gate to pipelines |
| **Change management** | [toolchange-change-management.md](./toolchange-change-management.md) · [schemasync-prompt-schema-alignment.md](./schemasync-prompt-schema-alignment.md) | MCP manifest lint · prompt↔schema alignment |
| **Pre-deploy replay** | [mockdrift-cloud-replay.md](./mockdrift-cloud-replay.md) | Replay open drift incidents in MockDrift CI (`--simulate-drift`) |
| **Init + fixtures** | [mockdrift-init-fixtures.md](./mockdrift-init-fixtures.md) | `mockdrift init`, OSS marketplace, hosted catalog (H2–H5) |
| **Drift management** | [drift-management.md](./drift-management.md) | Find → review → fix when contracts change (hosted) |
| **Semantic drift boundary** | [semantic-drift-boundary.md](./semantic-drift-boundary.md) | Structural vs semantic; MGFA policy-adjacent only (hosted) |
| **Platform / admin** | [platform-admin.md](./platform-admin.md) | Watches, API keys, alerts (hosted) |
| **A2A Contract Watch** | [a2a-contract-watch.md](./a2a-contract-watch.md) | Agent Card vs MCP silent mismatch (planned) |

---

## Related sections

| Section | Purpose |
|---------|---------|
| [Integrations](../integrations/README.md) | GitHub Actions, GitLab CI, MCP clients, registry |
| [Policies & gates](../policies/README.md) | Coverage rules, progressive CI enforcement (MockDrift → SchemaSync) |
| [Migrate & adopt](../migrate/README.md) | Adoption paths from zero, manual diff, CI-only, many MCP servers |
| [CI.md](../CI.md) | Full CI tier reference (hook, preview, trial, gate) |

---

## Next steps

- New to DriftGuard? [Getting started](../getting-started.md)
- Terms: [Glossary](../glossary.md)
- Hub: [docs/README.md](../README.md)
