---
status: proposed
---

# Output contract watch — scheduled agent response schema monitoring

**Demand-gated.** Point-in-time agent output validation ships today via `validate` + `profileKind` (`llm_structured_output`, `tool_call_envelope`). This ADR defines a **hosted watch** that polls or samples agent **response JSON Schema** over time and emits drift events when profiles change — complementary to MCP `tools/list` watches and webhook ingress gates.

## Context

| Surface | When | Repo |
|---------|------|------|
| Ingress `validate` | Before side effects on hot path | OSS CLI + hosted `POST /api/validate` |
| MCP / API watches | Scheduled `tools/list` or OpenAPI poll | Hosted |
| **Output contract watch** (proposed) | Scheduled profile / sample drift | Hosted only |

Agent teams need the same breaking / warning taxonomy when **model output contracts** drift (new required fields, enum shrinkage, tool-arg shape changes) without relying on every harness calling `validate` on every turn.

## Decision (proposed)

1. **New watch family** `output_contract` — not a fourth `watch_type` on generic `POST /api/watches` in v1; dedicated routes under `/api/output-contract/*` until schema stabilizes.
2. **v0 stub:** all routes return **501** `{ error, code: "not_implemented", phase: "mcp-l5" }` — never 404.
3. **Profile source:** reuse ingress `ConsumerProfile` shapes (`profileKind`, `schema`, optional `envelope`) pinned in Git or stored per watch.
4. **Check semantics (future):** sample harness endpoint or accept pushed snapshots; diff with `@drift-guard/diff-core` structural engine only (no NL semantic claims).


## Planned API (not implemented)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/output-contract/watches` | Register watch (profile ref + sample URL or push key) |
| `GET` | `/api/output-contract/watches` | List watches |
| `POST` | `/api/output-contract/watches/:id/check` | On-demand check |

## Non-goals (v1)

- Validating LLM answer **correctness** or SOP compliance
- Replacing FuseGuard ingress trip on block
- OSS scheduled runner (hosted only)

## References

- [Agent output contracts](../guides/agent-output-contracts.md)
- [Semantic drift boundary](../guides/semantic-drift-boundary.md)
- [Automation ingress](../guides/automation-ingress.md)

