# drift-a2a-coverage

CI gate for **A2A Contract Watch** — fails when `agents.yaml` `watches[]` URLs are not registered on your DriftGuard account. Requires Pro/Team API key.

Pair with offline `drift-agents-lint` on every PR; add this gate after watches are registered in hosted DriftGuard.

## Usage

```yaml
- uses: actions/checkout@v4
- uses: Drift-Guard/driftguard/.github/actions/drift-agents-lint@v0.3.3
  with:
    manifest: .driftguard/agents.yaml
- uses: Drift-Guard/driftguard/.github/actions/drift-a2a-coverage@v0.3.3
  with:
    api-key: ${{ secrets.DRIFTGUARD_API_KEY }}
    manifest: .driftguard/agents.yaml
```

## Validates

- Every `watches[].url` in the manifest exists as a registered watch on your account
- Does **not** sync bindings (read-only assert via `POST /api/a2a/coverage/assert`)

## CLI equivalent

```bash
export DRIFTGUARD_API_KEY=dg_…
npm run build && driftguard assert-a2a-coverage .driftguard/agents.yaml
```

Guide: [a2a-contract-watch.md](../../../docs/guides/a2a-contract-watch.md) · [agent-binding-manifest.md](../../../docs/guides/agent-binding-manifest.md)
