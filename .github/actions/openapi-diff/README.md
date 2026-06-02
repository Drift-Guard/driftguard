# OpenAPI Diff Action

Fail CI when an OpenAPI spec introduces breaking changes.

```yaml
- uses: kioie/driftguard/.github/actions/openapi-diff@v0
  with:
    base: openapi/base.yaml
    target: openapi/openapi.yaml
```

Optional inputs:

- `fail-on-breaking` — default `true`
- `version` — pin DriftGuard CLI semver

For remote compare history on DriftGuard Cloud, use `driftguard openapi-diff ... --remote` with `DRIFTGUARD_API_KEY` in a workflow step instead.
