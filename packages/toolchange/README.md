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

## GitHub Action

```yaml
- uses: ./.github/actions/toolchange
  with:
    manifest: tools.json
    baseline: tools.baseline.json
```

See [`.github/actions/toolchange/README.md`](../../.github/actions/toolchange/README.md).

## Pre-commit hook

```bash
cp packages/toolchange/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Set `TOOLCHANGE_MANIFEST` / `TOOLCHANGE_BASELINE` to override paths.

## Roadmap

See [`docs/PRODUCT-ROADMAP.md`](../../docs/PRODUCT-ROADMAP.md) § Phase 3A (TC-L01–L07). **3A DoD:** action + hook shipped in this repo; hosted how-to at driftguard.org `/docs/how-tos/toolchange`.
