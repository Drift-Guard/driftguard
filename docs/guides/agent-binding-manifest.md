# Agent binding manifest (`agents.yaml`)

**Status:** OSS Gate 2B (shipped). MGFA Dimension 1 — declared tool/skill scope; Dimension 3 — dev-time structural controls.

**Related:** [gate ladder — Gate 2B](../policies/gate-ladder.md) · [A2A Contract Watch](./a2a-contract-watch.md) · [examples/a2a/agents.yaml](../../examples/a2a/agents.yaml)

The manifest answers: *which production agents depend on which watched surfaces, and which MCP tools back each declared A2A skill?* It does **not** bind identity or OAuth — use your IdP for that.

---

## Manifest discipline

Commit a version-controlled file at `.driftguard/agents.yaml` beside agent code:

| Section | Role |
|---------|------|
| `agents[]` | One row per production agent binding (id, environment, policy) |
| `watches[]` | Declared dependency URLs (`a2a_card`, `mcp`, `api`, `openapi`) |
| `mcp.skillToolMap` | A2A skill id → MCP tool name(s) — required when `a2a.cardUrl` is set |
| `policies` | Optional custom presets; otherwise use built-in (`staging-strict`, …) |

Workflow:

1. Copy [examples/a2a/agents.yaml](../../examples/a2a/agents.yaml) or run `mockdrift init` (LangGraph template includes a starter manifest).
2. Align `a2a.cardUrl` with an `a2a_card` watch entry (same URL).
3. Map every orchestrated skill to MCP tools in `skillToolMap`.
4. Open a PR — CI runs `driftguard lint-agents` (offline, no API key).
5. After watches are registered in hosted DriftGuard, sync bindings via `POST /api/agents/manifest` (Pro/Team).

---

## Lint surfaces (OSS)

| Surface | Blocks CI? | API key |
|---------|------------|---------|
| `driftguard lint-agents` | Yes (exit 1) | No |
| GitHub Action `drift-agents-lint` | Yes | No |
| Harness `gates.agents_lint` | Yes when enabled | No |

Semantic checks (beyond JSON Schema):

- Duplicate `id` / `slug`
- `runtime_webhook` must be HTTPS
- `a2a.cardUrl` requires matching `a2a_card` watch + non-empty `skillToolMap`
- `mcp` watch requires `mcp.configPath`
- Policy preset names must exist

```bash
npm run build && driftguard lint-agents .driftguard/agents.yaml
# or
npm run check:agents-yaml
```

CI template: [examples/workflows/agents-lint.yml](../../examples/workflows/agents-lint.yml).

---

## Hosted watch resolution (Pro/Team)

OSS lint validates structure only. Hosted DriftGuard resolves manifest `watches[].url` to registered watch IDs when you call `POST /api/agents/manifest`. Unregistered URLs return `422` with `missingWatchUrls` — register watches first, then re-sync.

| Step | MGFA hook | Artifact |
|------|-----------|----------|
| Lint manifest in CI | Dim 3 structural controls | `drift-agents-lint` log |
| Register watches for each URL | Dim 3 dependency monitoring | Console / `register_watch` |
| Sync manifest | Dim 1 bound scope inventory | Binding rows + `get_agent_status` |

## A2A watch coverage gate (Pro/Team)

After watches are registered, fail CI when manifest URLs are not on your account:

| Surface | Blocks CI? | API key |
|---------|------------|---------|
| `driftguard assert-a2a-coverage` | Yes (exit 1) | Yes |
| GitHub Action `drift-a2a-coverage` | Yes | Yes |
| MCP `assert_a2a_coverage` | Yes | Yes |

```bash
export DRIFTGUARD_API_KEY=dg_…
npm run build && driftguard assert-a2a-coverage .driftguard/agents.yaml
```

CI template: [examples/workflows/a2a-coverage.yml](../../examples/workflows/a2a-coverage.yml). Hosted API: `POST /api/a2a/coverage/assert` (read-only — does not sync bindings).

---

## Harness bundle integration

Enable in `.driftguard/gates.yaml`:

```yaml
gates:
  agents_lint:
    enabled: true
```

MGFA profile example: [examples/harness-mgfa/.driftguard/](../../examples/harness-mgfa/.driftguard/) (includes `agents.yaml` + `agents_lint` gate).

---

## MGFA evidence artifact

Attach to compliance packets:

- CI log from `drift-agents-lint` on the merged commit
- Copy of `.driftguard/agents.yaml` at release tag
- Hosted sync response or console export showing bound watch IDs (when keyed)

---

## Related

- [Singapore agent deployment checklist](./singapore-agent-deployment-checklist.md)
- [agents.yaml JSON Schema](../schemas/agents.manifest.schema.json)
- Hosted field reference: [driftguard.org/docs/reference/agents-yaml](https://driftguard.org/docs/reference/agents-yaml)
