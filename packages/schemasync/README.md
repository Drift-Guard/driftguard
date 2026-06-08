# SchemaSync

Literal reference linter for schema-drift prompts (Gate 4).

**Roadmap:** [docs/PRODUCT-ROADMAP.md](../../docs/PRODUCT-ROADMAP.md) § Phase 4A

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
  --prompt "Collect billing_address before charge." \
  --removed billing_address \
  --synonyms schemasync.synonyms.yaml
```

`--mode semantic-hints` is advisory only — always exits 0.

## Phase 4A status

| Test ID | Scenario | Status |
|---------|----------|--------|
| SS-N01 | Literal removed field | Done |
| SS-N02 | Paraphrase without synonyms | Done |
| SS-N03 | Synonyms map | Done |
| SS-N04 | stripe prose FP (documented) | Done |
| SS-N05 | semantic-hints non-failing | Done |

**Next (4B):** GitHub App webhook + draft PR (`schemasync_repo`).
