# ToolChange

Manifest-first PR lint for AI tool schemas (DriftGuard Platform **Phase 3A**).

## Quick start

```bash
cd packages/toolchange
pip install -e ".[dev]"
pytest tests/ -v
toolchange lint --manifest fixtures/lint-pass/tools.json --baseline fixtures/lint-pass/baseline.json
```

## Commands

- `toolchange export --out tools.json` — write/refresh manifest (local venv)
- `toolchange lint --manifest tools.json --baseline baseline.json` — deterministic checks
- `--advisory` — report findings without failing CI (Gate 3 alpha)

## Roadmap

See [`docs/PRODUCT-ROADMAP.md`](../../docs/PRODUCT-ROADMAP.md) § Phase 3A (TC-L01–L07).
