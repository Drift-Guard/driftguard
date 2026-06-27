# Contract Manifest lint codes (`DG-*`)

Stable error codes for `driftguard lint-harness`, `driftguard doctor`, and CI log parsers. Format: `DG-{DOMAIN}-{NNN}`.

Full ADR: [adr/0004-contract-manifest.md](../adr/0004-contract-manifest.md).

## Manifest (`DG-MAN-*`)

| Code | Severity | Condition | Fix |
|------|----------|-----------|-----|
| `DG-MAN-001` | error | `adoptionLevel` ≥ 1 but missing `manifest.yaml` | `driftguard adopt --level 1` |
| `DG-MAN-002` | error | `adoptionLevel: 2` but missing `gates.yaml` | `driftguard adopt --level 2` |
| `DG-MAN-003` | error | `adoptionLevel: 3` but missing `agents.yaml` | Add agents or lower level |
| `DG-MAN-004` | error | `scanRoots` path not found | Fix path or remove from manifest |
| `DG-MAN-005` | error | `lockfiles.dir` not found | `driftguard lock --config mcp.json` |
| `DG-MAN-006` | warn | `adoptionLevel` lower than files present suggest | Align manifest or remove extra files |
| `DG-MAN-010` | warn | ToolChange enabled, no `manifests.toolchange` pin | Pin paths or set `toolchange.advisory: true` |

## Lockfile (`DG-LOCK-*`)

| Code | Severity | Condition | Fix |
|------|----------|-----------|-----|
| `DG-LOCK-001` | error | `manifests.mcp_lock.path` not found | `driftguard lock --config mcp.json` |
| `DG-LOCK-002` | error | Lock JSON fails `parseLockfile` | Regenerate with `driftguard lock` |
| `DG-LOCK-003` | error | `servers[]` name not in lockfile | Fix name or update lock |
| `DG-LOCK-010` | error | MCP URL in scanRoots has no lock server | Add server to lockfile |
| `DG-LOCK-011` | error | Live check would fail at manifest `failOn` | Review diff; `lock --update` if intended |
| `DG-LOCK-020` | warn | Lock at repo root (deprecated) | Move to `.driftguard/mcp/` |
| `DG-LOCK-030` | warn | Lock older than `staleAfterDays` | `driftguard lock --update` |

## Agents (`DG-AGENT-*`)

| Code | Severity | Condition | Fix |
|------|----------|-----------|-----|
| `DG-AGENT-010` | error | `lockServers` name missing from lockfile | Add server to lock or fix name |
| `DG-AGENT-011` | error | `lockServers` entry not in agent MCP config | Align `mcp.json` with manifest |
| `DG-AGENT-012` | warn | Agent has MCP watch but no `lockServers` | Add `lockServers` for traceability |
| `DG-AGENT-013` | error | Watch MCP URL ≠ lockfile server URL | Reconcile URL or watch |
| `DG-AGENT-014` | warn | Agent in `agents.yaml` not referenced in harness | Document or remove |

## Doctor (`DG-DOC-*`)

| Code | Severity | Condition | Fix |
|------|----------|-----------|-----|
| `DG-DOC-001` | info | No manifest present | `driftguard adopt` |
| `DG-DOC-010` | error | Level 3 + `hosted.required` + no API key | Set `DRIFTGUARD_API_KEY` |
| `DG-DOC-020` | warn | Watch coverage &lt; `minWatchCoverage` | `adopt --level 3` or register watches |
| `DG-DOC-030` | warn | Lock stale (same as `DG-LOCK-030`) | `driftguard lock --update` |
| `DG-DOC-040` | error | CI workflow missing for adoption level | Copy `manifest-level-N.yml` workflow |

## MGFA phrase mapping

Codes prefixed `DG-LOCK-*` map to **Dim 3 — MCP catalog baseline**; `DG-AGENT-*` to **Dim 1 — bound tool scope**; `DG-MAN-*` to **Dim 3 — contract manifest**. See `src/harness/mgfa-phrases.ts`.
