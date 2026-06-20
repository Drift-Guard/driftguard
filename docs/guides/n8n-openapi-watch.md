# n8n OpenAPI watch + ingress validate

Register a **contract watch** on n8n’s OpenAPI (or any vendor REST spec) and pair it with a **consumer profile** for runtime ingress validation.

## 1. Create an OpenAPI watch

```bash
curl -sS -X POST "https://driftguard.org/api/watches" \
  -H "Authorization: Bearer $DRIFTGUARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "n8n-public-api",
    "type": "openapi",
    "url": "https://raw.githubusercontent.com/n8n-io/n8n/master/packages/cli/src/public-api/v1/openapi.yml"
  }'
```

Save the returned `watchId`. DriftGuard polls upstream and alerts on breaking schema changes.

## 2. Pin a consumer profile in Git

```yaml
# driftguard.profiles.yaml
profiles:
  - id: n8n-webhook-payload
    version: 1
    schema:
      type: object
      required: [id, type]
      properties:
        id: { type: string }
        type: { type: string }
```

Commit beside your n8n workflow export.

## 3. Validate at ingress (n8n HTTP node)

Import [driftguard-ingress-gate.json](../../examples/n8n/driftguard-ingress-gate.json) or call:

```http
POST /api/validate
Authorization: Bearer dg_…
X-DriftGuard-Source: n8n

{ "payload": { … }, "profileId": "n8n-webhook-payload" }
```

Hosted `profileId` resolves a pinned profile from your account registry (v1.1+). Inline `profile` works on all tiers.

## 4. Watch + Validate bundle

| Layer | Primitive | When it fires |
|-------|-----------|---------------|
| Upstream | Contract watch | Vendor OpenAPI changes |
| Runtime | `POST /api/validate` | Bad payload before CRM/DB write |

When the watch reports breaking drift, update your consumer profile **before** ingress starts failing in production.

See [automation ingress playbook](automation-ingress.md) and [validate API](../reference/validate-api.md).
