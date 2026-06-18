# Singapore agent deployment checklist

**Status:** OSS enablement template (E10). Not MGFA certification or legal advice.

**Related:** [SINGAPORE-MGFA-PRODUCT-FIT.md](../SINGAPORE-MGFA-PRODUCT-FIT.md) · [gate ladder](../policies/gate-ladder.md) · [CI.md](../CI.md)

Use this checklist when deploying agentic apps in Singapore/APAC programmes that reference IMDA MGFA Dimension 1 (bound risks) and Dimension 3 (technical controls). DriftGuard covers **contract observability** — MCP tools, API schemas, Agent Cards, and declared bindings — not identity, HITL, or policy/SOP evaluation.

---

## Pre-deploy (OSS + optional hosted key)

| Step | Action | MGFA hook | Artifact |
|------|--------|-----------|----------|
| 1 | Pin harness bundle | Dim 3 reproducible baselines | `.driftguard/gates.yaml`, `harness.lock` |
| 2 | Run MockDrift + evaluator | Dim 3 pre-deploy testing | `mockdrift.sensor/v1` JSON (producer ≠ reviewer) |
| 2b | Replay open drift incident (optional Pro) | Dim 3 production-faithful pre-deploy | `--simulate-drift` cache under `.mockdrift/cache/` |

Workflow: [mockdrift-cloud-replay.md](./mockdrift-cloud-replay.md) · CI template: [examples/workflows/mockdrift-replay.yml](../../examples/workflows/mockdrift-replay.yml).
| 2c | Bootstrap harness + fixture packs (OSS) | Dim 3 reproducible scenario baselines | `mockdrift init` + `fixtures/index.yaml` |

Workflow: [mockdrift-init-fixtures.md](./mockdrift-init-fixtures.md). Fixtures are structural **examples**, not compliance certification.
| 3 | Lint `agents.yaml` bindings | Dim 1 bound tool scope | CI log from `drift-agents-lint` |

Workflow: [agent-binding-manifest.md](./agent-binding-manifest.md) · CI template: [examples/workflows/agents-lint.yml](../../examples/workflows/agents-lint.yml).
| 3b | `assert_a2a_coverage` on manifest watch URLs | Dim 1 bound external linkage | CI log from `drift-a2a-coverage` |

Workflow: [agent-binding-manifest.md](./agent-binding-manifest.md#a2a-watch-coverage-gate-proteam) · CI template: [examples/workflows/a2a-coverage.yml](../../examples/workflows/a2a-coverage.yml). Requires Pro/Team key.
| 4 | ToolChange on MCP manifest PRs | Dim 3 change management | PR check output |

Workflow: [toolchange-change-management.md](./toolchange-change-management.md) · CI template: [examples/workflows/toolchange.yml](../../examples/workflows/toolchange.yml).
| 5a | SchemaSync on agent prompts | Dim 3 instruction/tool consistency | PR check output |

Workflow: [schemasync-prompt-schema-alignment.md](./schemasync-prompt-schema-alignment.md) · CI template: [examples/workflows/schemasync.yml](../../examples/workflows/schemasync.yml). Pair with ToolChange when manifest fields are removed.
| 5 | `drift-diff` / `compare_json` on fixtures | Dim 3 structural controls | Breaking vs additive counts |
| 1b | Lint harness bundle on PRs | Dim 3 reproducible baselines | CI log from `drift-harness-lint` |

Workflow: [examples/workflows/drift-harness.yml](../../examples/workflows/drift-harness.yml) · profile: [examples/harness-mgfa/.driftguard/gates.yaml](../../examples/harness-mgfa/.driftguard/gates.yaml).

Example harness profile: [examples/harness-mgfa/.driftguard/gates.yaml](../../examples/harness-mgfa/.driftguard/gates.yaml) (checklist step mapping in file header).

---

## Dependency watch enforcement (hosted)

Prove external MCP/API dependencies are monitored before production deploy:

```yaml
# .github/workflows/driftguard-coverage.yml
# Template: examples/workflows/driftguard-coverage-gate.yml
- uses: kioie/driftguard/.github/actions/drift-coverage-preview@v0.3.3
  with:
    scan-paths: mcp.json,.cursor/mcp.json,package.json

# After trial or Pro key:
- uses: kioie/driftguard/.github/actions/drift-coverage@v0.3.3
  env:
    DRIFTGUARD_API_KEY: ${{ secrets.DRIFTGUARD_API_KEY }}
  with:
    scan-paths: mcp.json,.cursor/mcp.json
```

| Tier | Blocks deploy? | Endpoint limit |
|------|----------------|----------------|
| Preview | No (reports gaps) | Lists all discovered |
| Trial gate | Yes | **1** endpoint |
| Pro gate | Yes | Plan limit |

MCP equivalent: `assert_coverage` with `DRIFTGUARD_API_KEY`. Trial: [driftguard.org/start](https://driftguard.org/start?utm_source=checklist).

**False negatives:** Incomplete `mcp.json` or stdio-only servers without URLs — run `parse_mcp_config` locally first.

---

## Runtime contract preflight (hosted + FuseGuard)

Gate **irreversible tool calls** (refunds, writes, deletes) when bound watches report open breaking drift:

| Step | Action | MGFA hook |
|------|--------|-----------|
| 5r | Wrap agent with FuseGuard + `DRIFTGUARD_API_KEY` + watch/agent binding | Dim 3 guardrails before/during action |
| 5r-b | Route `FUSEGUARD_TRIP_LOG` + webhooks to SOAR | Dim 2 oversight evidence |
| 5r-c | `acknowledge_drift` before ack-gated resume | Dim 3 failsafe (pairs with E11) |

Guide: [runtime-contract-preflight.md](./runtime-contract-preflight.md) · example: [examples/fuseguard/preflight_wrap.py](../../examples/fuseguard/preflight_wrap.py).

---

## Post-deploy (hosted)

| Step | Action | MGFA hook |
|------|--------|-----------|
| 6 | Register watches for each HTTPS dependency | Dim 3 post-deploy monitoring |
| 7 | Route webhooks to SOAR/ITSM | Dim 2 oversight evidence |
| 8 | Acknowledge breaking drift before ack-gated agents resume | Dim 3 failsafe |

See [drift management — incident lifecycle](./drift-management.md#incident-lifecycle) and [webhooks — ack trail](../reference/webhooks-alerts.md#incident-acknowledgement-trail).

---

## Cursor rule integration

Repos with `mcp.json` should copy [examples/cursor-rule-driftguard.mdc](../../examples/cursor-rule-driftguard.mdc) — it encodes offline-first tool order and links this checklist for coverage gates.

---

## What we do not cover

Identity/IAM, HITL approval queues, behavioural anomaly detection, NL policy compliance, OTel-native APM — integrate with partners per [SINGAPORE-MGFA-PRODUCT-FIT.md § partner list](../SINGAPORE-MGFA-PRODUCT-FIT.md#what-we-explicitly-will-not-build-partner-list).
