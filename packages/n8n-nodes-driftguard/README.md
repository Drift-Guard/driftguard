# n8n-nodes-driftguard

Community n8n node for DriftGuard **Validate Payload** and **Check Preflight** operations.

## Install (local dev)

```bash
cd packages/n8n-nodes-driftguard
npm install && npm run build
```

Link into n8n custom nodes directory or set `N8N_CUSTOM_EXTENSIONS`:

```bash
export N8N_CUSTOM_EXTENSIONS=/path/to/driftguard/packages/n8n-nodes-driftguard
n8n start
```

## Credentials

| Field | Value |
|-------|-------|
| API Key | `dg_live_…` from [console](https://driftguard.org/console) |
| Base URL | `https://driftguard.org` (default) |

## Operations

| Operation | API | Use when |
|-----------|-----|----------|
| Validate Payload | `POST /api/validate` | Block bad webhook payloads before writes |
| Check Preflight | `POST /api/preflight` | Gate agent runs on contract drift |

Golden payloads: `packages/diff-core/fixtures/ingress/cases.json`.

HTTP-only alternative: [examples/n8n/driftguard-ingress-gate.json](../../examples/n8n/driftguard-ingress-gate.json).
