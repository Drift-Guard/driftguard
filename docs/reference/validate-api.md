# POST /api/validate (public reference)

Runtime ingress gate: validate a JSON **payload** against a pinned **consumer profile** before writes, branches, or downstream automation.

**Hosted endpoint:** `POST https://driftguard.org/api/validate`  
**Offline equivalent:** `driftguard validate` CLI · MCP `validate_payload` (no API key when profile is inline)

## Request

```http
POST /api/validate HTTP/1.1
Authorization: Bearer dg_…
Content-Type: application/json
X-DriftGuard-Correlation-Id: optional-uuid
X-DriftGuard-Source: n8n
```

```json
{
  "payload": { "id": 1, "email": "user@example.com" },
  "profile": {
    "id": "shopify-webhook",
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["id", "email"],
      "properties": {
        "id": { "type": "integer" },
        "email": { "type": "string", "minLength": 3 }
      }
    }
  },
  "options": {
    "profileMode": "hosted",
    "mode": "block"
  }
}
```

| Field | Notes |
|-------|-------|
| `payload` | Inbound JSON (max 256KB body) |
| `profile` | Consumer profile (max 64KB) — see [consumer.profile.schema.json](../schemas/consumer.profile.schema.json) |
| `options.profileMode` | `cli` (strict) or `hosted` (schema-only required) |
| `options.mode` | `block` (default) or `warn` (HTTP 200 with `ok: false`) |

Trial: `X-DriftGuard-Trial` header instead of API key (500 validations/month).

## Response

```json
{
  "ok": false,
  "severity": "breaking",
  "errors": [
    { "path": "/email", "code": "required_missing", "message": "Required field 'email' is missing" }
  ],
  "normalized": null,
  "explainUrl": "https://developers.driftguard.org/api/explain-drift",
  "correlationId": "…",
  "validationsRemaining": 499,
  "latencyMs": 12
}
```

### Headers

- `X-DriftGuard-Correlation-Id` — echoed or generated
- `X-DriftGuard-Validations-Remaining` — monthly quota remainder

### Errors

| Status | When | `upgrade` block |
|--------|------|-----------------|
| 401 | Missing/invalid API key | Yes |
| 403 | Free tier (`apiAccess: false`) | Yes |
| 402 | Monthly quota exceeded | Yes |
| 429 | Burst limit (per account) | Yes |
| 422 | Validation failed (`mode: block`) | — |
| 200 | `mode: warn` with invalid payload | — |

Upgrade URLs mirror [CI.md](../CI.md#upgrade-urls): `upgrade.start`, `upgrade.pricing`, `upgrade.console`, `upgrade.activate`.

## Related

| Surface | Use when |
|---------|----------|
| `validate` / `validate_payload` | Pin consumer shape; block bad ingress |
| `compare_json` | Producer CI diff on schema changes |
| `POST /api/preflight` | Egress — are watches drift-blocked? |
| Contract watches | Upstream drift detection |

**Ephemeral:** payloads are not stored. Only metadata (ok, severity, error count, latency) is metered.

Guides: [automation ingress](../guides/automation-ingress.md) · Pricing: [driftguard.org/pricing](https://driftguard.org/pricing)
