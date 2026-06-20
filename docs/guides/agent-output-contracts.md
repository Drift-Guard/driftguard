# Agent output contracts

Validate **LLM structured output** and **tool-call envelopes** before dispatch — same `validate(payload, profile)` primitive as [webhook ingress](automation-ingress.md), with `profileKind` selectors for agent harness shapes.

**Structural validation only** — see [semantic drift boundary](semantic-drift-boundary.md). DriftGuard checks JSON shape, not whether the LLM answer is correct.

## When to use vs webhook ingress

| Use case | `profileKind` | Validate target |
|----------|---------------|-----------------|
| n8n / Shopify webhook before CRM write | `ingress` (default) | Full inbound payload |
| LLM JSON mode / structured output parser | `llm_structured_output` | Parsed JSON object (`answer`, `citations`, …) |
| MCP or OpenAI function call before execution | `tool_call_envelope` | Inner `arguments` / `input` object |

Webhook ingress gates **producer payloads**. Agent output contracts gate **model output and tool args** on the hot path between parser and executor.

## Profile kinds

Pin profiles in Git beside harness code. Schema: [consumer.profile.schema.json](../schemas/consumer.profile.schema.json).

### `llm_structured_output`

Validate the JSON object returned by structured-output mode or a repair pass:

```json
{
  "id": "agent-structured-output",
  "version": 1,
  "profileKind": "llm_structured_output",
  "requiredPolicy": "schemaOnly",
  "schema": {
    "type": "object",
    "required": ["answer", "citations"],
    "properties": {
      "answer": { "type": "string", "minLength": 1 },
      "citations": { "type": "array" }
    }
  }
}
```

### `tool_call_envelope`

Validate the **inner arguments object**, not the outer tool-call wrapper. Use `envelope.preset`:

| Preset | Recognized shapes | Extracted path |
|--------|-------------------|----------------|
| `mcp` (default) | `{ "name", "arguments" }`, `{ "tool", "input" }` | `arguments` or `input` |
| `openai_functions` | `{ "function": { "name", "arguments" } }` | `function.arguments` |
| `raw` | Custom | `envelope.extractPath` dot path |

Example MCP search tool:

```json
{
  "id": "mcp-tool-call",
  "version": 1,
  "profileKind": "tool_call_envelope",
  "envelope": { "preset": "mcp" },
  "schema": {
    "type": "object",
    "required": ["query"],
    "properties": {
      "query": { "type": "string", "minLength": 1 },
      "limit": { "type": "integer", "minimum": 1, "maximum": 100 }
    }
  }
}
```

On success, `normalized` returns the **extracted arguments object** (ready for downstream tools).

## FuseGuard ingress gate pairing

Pair agent output validate with [FuseGuard](../../packages/fuseguard/README.md) egress controls:

1. **Ingress** — `validate` on LLM JSON / tool-call envelope before execution (`FUSEGUARD_INGRESS_*` trip on block).
2. **Egress** — FuseGuard loop fuse on tool/MCP calls after validation passes.

Same breaking / warning / info severity taxonomy as `compare_json` and webhook ingress. Block bad tool args before side effects; log `ingress_validate_blocked` trips for audit.

## SchemaSync pairing

When prompts reference removed schema fields, add [SchemaSync](schemasync-prompt-schema-alignment.md) in CI (Gate 4A) so prompt prose and pinned output profiles stay aligned across model upgrades.

## CLI examples

```bash
# LLM structured output
driftguard validate \
  --profile examples/profiles/agent-structured-output.json \
  --payload '{"answer":"Paris.","citations":["doc-1"]}'

# MCP tool call (validates inner arguments)
driftguard validate \
  --profile examples/profiles/mcp-tool-call.json \
  --payload '{"name":"search_docs","arguments":{"query":"ingress"}}'
```

Exit 0 when `ok: true`; exit 1 on breaking errors.

## Hosted API

Same meter as webhook ingress — `POST /api/validate` with inline `profile` (including `profileKind` / `envelope`). See [validate API](../reference/validate-api.md) and [automation ingress](automation-ingress.md).

## Related

- [Automation ingress playbook](automation-ingress.md)
- [Gate ladder — runtime ingress](../policies/gate-ladder.md)
- Fixture profiles: `packages/diff-core/fixtures/ingress/profiles/profile.agent-structured-output.json`
