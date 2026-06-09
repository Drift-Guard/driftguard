# ToolChange manifest lint (composite action)

Runs `toolchange lint` in CI with no network. Requires a committed `tools.json` manifest and baseline.

## Usage

```yaml
jobs:
  toolchange:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: ./.github/actions/toolchange
        with:
          manifest: tools.json
          baseline: tools.baseline.json
```

## Advisory mode (Gate 3 alpha)

```yaml
      - uses: ./.github/actions/toolchange
        with:
          manifest: tools.json
          baseline: tools.baseline.json
          advisory: "true"
```

## Local workflow

1. `toolchange export --out tools.json` (venv only — never in CI)
2. Commit `tools.json` + `tools.baseline.json`
3. PR changes to manifest → action fails on breaking diffs

See [`packages/toolchange/README.md`](../../../packages/toolchange/README.md) and [`/docs/how-tos/toolchange`](https://driftguard.org/docs/how-tos/toolchange) on driftguard.org.
