# SchemaSync

Literal reference linter for schema-drift prompts (Gate 4).

**Gate:** SchemaSync 4A (`lint-nl` literal + semantic-hints). Hosted GitHub App is in `driftguard-cloud`.

**MGFA guide:** [schemasync-prompt-schema-alignment.md](../../docs/guides/schemasync-prompt-schema-alignment.md) · CI template: [examples/workflows/schemasync.yml](../../examples/workflows/schemasync.yml)

## Quick start

```bash
cd packages/schemasync
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest tests/ -v
```

## lint-nl

```bash
schemasync lint-nl --mode literal \
  --prompt-file prompts/checkout-agent.txt \
  --removed billing_address,shipping_method \
  --synonyms schemasync.synonyms.yaml
```

| Mode | Exit code on match | Use in CI |
|------|-------------------|-----------|
| `literal` | 1 | **Blocking** PR gate |
| `literal --advisory` | 0 | Bootstrap / tune synonyms |
| `semantic-hints` | 0 always | Draft PR human review only |

`--mode semantic-hints` is advisory only — never use for MGFA blocking claims.

## Phase 4A status

| Test ID | Scenario | Status |
|---------|----------|--------|
| SS-N01 | Literal removed field | Done |
| SS-N02 | Paraphrase without synonyms | Done |
| SS-N03 | Synonyms map | Done |
| SS-N04 | stripe prose FP (documented) | Done |
| SS-N05 | semantic-hints non-failing | Done |

Example fixtures: [examples/schemasync](../../examples/schemasync/).

**Next (4B):** GitHub App webhook + draft PR (`schemasync_repo`).
