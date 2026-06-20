# Ingress validate golden fixtures

Golden corpus for `validateAgainstProfile` parity (OSS CLI, MCP, hosted `POST /api/validate`).

## Layout

| Path | Purpose |
|------|---------|
| `profiles/` | Consumer profile pins (webhook, n8n lead, agent structured output, MCP/OpenAI tool-call envelopes) |
| `cases.json` | 76 cases: 27 good, 49 bad — expected `ok`, `severity`, primary `code` |

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
