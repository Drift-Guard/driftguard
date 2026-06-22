# DriftGuard JSON Diff

Offline JSON schema diff — fails the job on breaking changes. No API key, no network.

## Usage

```yaml
- uses: Drift-Guard/driftguard/.github/actions/drift-diff@v0.3.3
  with:
    before: '{"status":"ok","data":{"id":1,"name":"x"}}'
    after: '{"status":"ok","data":{"id":1}}'
```

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `before` | Yes | Previous JSON payload |
| `after` | Yes | New JSON payload |
| `version` | No | Client semver pin |

Part of the DriftGuard CI funnel — pair with [coverage preview](../drift-coverage-preview/README.md) for hosted monitoring.

Docs: [docs/CI.md](https://github.com/Drift-Guard/driftguard/blob/main/docs/CI.md)
