# DriftGuard n8n ingress gate

Import `driftguard-ingress-gate.json` into n8n.

## Env vars

| Variable | Description |
|----------|-------------|
| `DRIFTGUARD_API_KEY` | Pro/Team or trial API key |
| `DRIFTGUARD_PROFILE` | Inline consumer profile JSON string |

## Test

```bash
curl -X POST https://your-n8n/webhook/driftguard-ingress \
  -H 'Content-Type: application/json' \
  -d '{"id":1,"email":"a@b.c"}'
```

On 401/402/429 the HTTP Request node returns `upgrade` URLs — branch to Set node with `{{$json.upgrade.pricing}}`.

Trial: [driftguard.org/start?from=n8n](https://driftguard.org/start?from=n8n)
