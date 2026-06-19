# Ingress validate golden fixtures

Golden corpus for `validateAgainstProfile` parity (OSS CLI, MCP, hosted `POST /api/validate`).

## Layout

| Path | Purpose |
|------|---------|
| `profiles/` | Consumer profile pins (`profile.shopify-webhook.json`, `profile.n8n-normalized-lead.json`) |
| `cases.json` | 60 cases: 20 good, 40 bad — expected `ok`, `severity`, primary `code` |

## Case categories (bad)

- `required_missing` — breaking
- `type_mismatch` — breaking
- `enum_invalid` — breaking
- `extra_field` — warning (hosted / schemaOnly)
- `null_disallowed` — breaking
- `normalization` — alias mapping before validate
- `nested` — nested object/array paths
- `empty_string` vs null semantics

## Running

```bash
cd packages/diff-core && npm test
```

No network required.
