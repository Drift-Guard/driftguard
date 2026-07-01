# MCP conformance CI — build vs partner

**Status:** Partner-first guidance  
**Audience:** Teams **building** MCP servers who need to prove declared `inputSchema` matches runtime `tools/call` behavior.

## The gap

Snapshot diff (`compare_json`, lockfile `check`, hosted watches) compares **catalog** changes. It does **not** catch:

- A parameter marked optional in `tools/list` but required at `tools/call` time.
- Output shape diverging from declared output schema.
- Protocol handshake or JSON-RPC framing bugs.

That requires **live invocation** test harnesses — a different product surface from continuous dependency monitoring.

## DriftGuard boundary

| Capability | DriftGuard | Partner / builder CI |
|------------|------------|----------------------|
| `tools/list` baseline + diff | OSS + hosted | Lockfile CLI tools |
| Scheduled post-deploy drift | Hosted watches | Hosted poll services |
| Auto-generated `tools/call` suites | **Not v1** | MCP conformance CLIs (schema-driven invocation tests) |
| Protocol + determinism tests | **Not v1** | MCP protocol test harnesses |
| Record/replay for external deps | MockDrift (structural) | Session replay and traffic-capture tools |

**Recommendation:** Document integrations; do not rebuild full resiliency fuzzing in v1.

## Partner integration pattern

### 1. Builder CI (pre-merge)

Run a conformance CLI against your MCP server in CI:

```bash
# Illustrative — use the conformance CLI you adopt
mcp-conformance run --file tests/mcp-tools.json --server http://localhost:8000/mcp
```

Gate merge on schema match + error-path tests. Commit baselines with your harness's known-good snapshot command.

### 2. DriftGuard lockfile (same repo)

```bash
driftguard lock --url http://localhost:8000/mcp -o driftguard-lock.json
driftguard check --lock driftguard-lock.json
```

Validates catalog stability; complementary to invocation tests.

### 3. Hosted watch (staging/prod dependency)

For MCP servers **you depend on** (Stripe, GitHub, internal ops):

```text
register_watch (watchType: mcp) → alerts on breaking catalog drift
```

Catches vendor changes your CI never sees.

## Future: hosted invocation probe (optional)

A minimal hosted extension could sample `tools/call` on watch check with safe read-only tools — **not** full permutation fuzzing. Evaluate after partner docs and demand signal.

| Approach | Effort | Coverage |
|----------|--------|----------|
| Partner doc only (this page) | Low | Builder segment self-serves |
| Hosted sampled probe | Medium | Optional-vs-required mismatches on allowlisted tools |
| Full in-house conformance engine | High | Duplicates mature CLIs |

## Honest limits

- DriftGuard MockDrift replays **structural** drift profiles — not byte-for-byte production payloads.
- Security scanning (prompt injection, malicious descriptions) is **out of scope** — pair with a security scanner; DriftGuard `suspicious` severity flags large description changes for human review only.

## Related docs

- [agent-mcp.md](./agent-mcp.md) — offline-first tool order + CI + watch dual path
- [gate-ladder.md](../policies/gate-ladder.md) — MockDrift, FuseGuard, ToolChange, SchemaSync
- [mcp-lockfile-bridge.md](./mcp-lockfile-bridge.md) — `driftguard lock` / `check` (OSS)
- [CI.md](../CI.md) — MCP lockfile action + hosted watch funnel
- [examples/workflows/mcp-conformance-stub.yml](../../examples/workflows/mcp-conformance-stub.yml) — GitHub Actions stub pairing partner conformance with `mcp-lockfile`
