# drift-fuse-policy-lint

Lint a FuseGuard policy bundle in CI. Optionally run `policy simulate` for a representative tool.

## Usage

```yaml
- uses: Drift-Guard/driftguard/.github/actions/drift-fuse-policy-lint@v0
  with:
    policy-path: examples/fuseguard/fuse.policy.yaml
    simulate-tool: delete_file
    simulate-environment: production
```

Offline only — no API key required.

## PR comment simulate

On pull requests, comment `/fuse-simulate tool=delete_file policy=examples/fuseguard/fuse.policy.yaml` to trigger the workflow in `.github/workflows/fuse-policy-design-time.yml`.
