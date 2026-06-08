# MockDrift GitHub Action

Run drift-replay pytest scenarios in CI.

## Minimal workflow

```yaml
name: MockDrift
on: [pull_request]
jobs:
  mockdrift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v6
        with:
          python-version: "3.12"
      - run: pip install -e "./packages/mockdrift[dev]"
      - uses: ./.github/actions/mockdrift
        env:
          DRIFTGUARD_API_KEY: ${{ secrets.DRIFTGUARD_API_KEY }}
        with:
          pytest-args: tests/test_layer1.py
```

## Cloud replay (`--simulate-drift`)

Requires Pro trial or paid `mockdrift_cloud` entitlement:

```yaml
      - uses: ./.github/actions/mockdrift
        env:
          DRIFTGUARD_API_KEY: ${{ secrets.DRIFTGUARD_API_KEY }}
          MOCKDRIFT_TELEMETRY: "0"
        with:
          pytest-args: tests/test_refund_drift.py
          simulate-drift: watch_abc123
          cache-fixture: "true"
```

Use fixture key `simulate-drift` in `@drift_replay` when tests should consume the cloud materialized cache.
