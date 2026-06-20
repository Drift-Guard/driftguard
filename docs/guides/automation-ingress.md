# Automation ingress playbook

Block bad webhook and automation payloads **before** CRM/DB writes — same breaking/warning/info semantics as `compare_json`.

## Primitives

| Primitive | Offline | Hosted (metered) |
|-----------|---------|------------------|
| `validate(payload, profile)` | `driftguard validate` · MCP `validate_payload` | `POST /api/validate` |
| Producer diff | `compare_json` | `POST /api/openapi/diff/remote` |
| Upstream drift | — | Contract watches |

**Watch + Validate bundle:** register a watch on vendor OpenAPI → pin consumer profile in Git → hosted validate in n8n → alert on upstream drift before ingress breaks.

## Patterns

### Checkpoint (normalize → validate → branch)

1. Normalize field names (profile `normalization.aliases` or n8n Set node)
2. `POST /api/validate` or CLI `driftguard validate`
3. IF `ok` → continue; else → alert

### Shadow (`mode: warn`)

Hosted validate with `options.mode: warn` returns HTTP 200 and `ok: false` — log metrics without blocking.

### Quarantine (`mode: quarantine`)

On validation failure, DriftGuard POSTs a structured event to `options.webhookUrl` (schema: [ingress.quarantine-event.schema.json](../schemas/ingress.quarantine-event.schema.json)) and returns HTTP 422. Route the webhook to a review queue instead of dropping silently.

### Watch + Validate

Pin `driftguard.profiles.yaml` beside workflow code; open PR when watch detects upstream breaking change.

## CLI

```bash
driftguard validate \
  --profile ./profiles/shopify-webhook.json \
  --payload ./fixtures/event.json
```

Exit 0 when `ok: true`; exit 1 on breaking errors.

## n8n

Import [examples/n8n/driftguard-ingress-gate.json](../../examples/n8n/driftguard-ingress-gate.json) — HTTP Request to `/api/validate` with env `DRIFTGUARD_API_KEY`.

Community node (optional): [packages/n8n-nodes-driftguard](../../packages/n8n-nodes-driftguard/README.md) — **Validate Payload** and **Check Preflight** operations.

OpenAPI watch + ingress bundle: [n8n OpenAPI watch guide](n8n-openapi-watch.md).

## When to use hosted vs OSS

| Choose | When |
|--------|------|
| OSS CLI/MCP | High volume, self-hosted, zero marginal cost |
| Hosted API | n8n convenience, quota analytics, future profile registry |

Reference: [validate API](../reference/validate-api.md) · Gate ladder: [L2.5 Runtime ingress](../policies/gate-ladder.md)

## Positioning boundaries

- [Confluent Schema Registry coexistence](confluent-coexistence.md) — partner, not competitor
- [BI / warehouse drift boundary](bi-warehouse-boundary.md) — what we do and do not solve
