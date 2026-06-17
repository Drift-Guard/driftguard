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
- `--advisory` — report findings without failing CI (opt-in; CLI blocks by default)

## MGFA change management

See [docs/guides/toolchange-change-management.md](../../docs/guides/toolchange-change-management.md) — manifest discipline, advisory→blocking path, harness `manifests.toolchange` pinning.

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

**Gate 3A DoD:** action + hook shipped in this repo (TC-L01–L07); hosted how-to at [driftguard.org/docs/how-tos/toolchange](https://driftguard.org/docs/how-tos/toolchange).
