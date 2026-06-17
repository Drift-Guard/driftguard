# MockDrift cloud replay (`--simulate-drift`)

**Status:** OSS Gate 1 M3 + hosted replay API. MGFA Dimension 3 — pre-deployment safety testing with production-faithful drift fixtures.

**Related:** [gate ladder — Gate 1](../policies/gate-ladder.md) · [packages/mockdrift](../../packages/mockdrift/README.md) · [drift management — incident lifecycle](./drift-management.md#incident-lifecycle) · [Singapore checklist](./singapore-agent-deployment-checklist.md)

MockDrift cloud replay materializes a **hosted drift fixture** from an open watch incident so pre-deploy pytest runs exercise the same structural break production already detected. This is **contract replay**, not full agent behavioural regression — PASS means the harness handled the drift profile; it does not certify end-user outcomes.

---

## When to use cloud replay vs local fixtures

| Surface | Use when | API key |
|---------|----------|---------|
| **Local fixture** (`mockdrift demo`, `fixtures/`) | Bootstrap, OSS-only CI, deterministic demos | No |
| **`--simulate-drift WATCH_ID`** | Watch has **open or recent drift**; replay production break in PR gate | Yes (`mockdrift_cloud`) |
| **Fixture catalog install** | Curated vendor scenarios (H5 hosted lane) without a watch | Yes |

Offline-first: run local MockDrift demos before enabling cloud replay in CI.

---

## Incident → fixture → regression workflow

Tie pre-deploy tests to post-deploy monitoring:

```
  Post-deploy                    Pre-deploy (this guide)
  ───────────                    ───────────────────────
  watch detects drift     →      list_drift_events / console incident
  incident_status=open           copy watchId
                                 mockdrift run --simulate-drift WATCH_ID
  webhook / ack trail            @drift_replay(fixture="simulate-drift")
                                 merge when PASS + human ack (if ack-gated)
```

| Step | Action | Artifact |
|------|--------|----------|
| 1 | Confirm watch `driftStatus=drifted` or open incident | Console or `get_watch_status` |
| 2 | Note `watchId` and latest `driftEventId` | `list_drift_events` |
| 3 | Run MockDrift with `--simulate-drift` | `.mockdrift/cache/{watchId}/` |
| 4 | Point tests at `simulate-drift` fixture key | pytest + `@drift_replay` |
| 5 | Add GitHub Action on PRs touching agent code | workflow below |
| 6 | After fix, re-run watch check; ack if policy requires | [drift management](./drift-management.md) |

Hosted API returns `incident` linkage (`status`, `driftEventId`, `detectedAt`) and copies counts into `diff` when drift history exists.

---

## CLI quick start

```bash
export DRIFTGUARD_API_KEY=dg_live_...
cd packages/mockdrift
pip install -e ".[dev]"

# Materialize cache + run pytest
mockdrift run --pytest tests/test_layer1.py --simulate-drift watch_abc123 --cache-fixture

# Or pytest plugin directly
pytest --simulate-drift watch_abc123 --cache-fixture tests/
```

Use `@drift_replay(fixture="simulate-drift", ...)` when tests should consume the cloud materialized cache under `.mockdrift/cache/`.

Disable CI telemetry: `MOCKDRIFT_TELEMETRY=0`.

---

## GitHub Actions

Copy [examples/workflows/mockdrift-replay.yml](../../examples/workflows/mockdrift-replay.yml):

```yaml
- uses: kioie/driftguard/.github/actions/mockdrift@v0.3.3
  env:
    DRIFTGUARD_API_KEY: ${{ secrets.DRIFTGUARD_API_KEY }}
    MOCKDRIFT_TELEMETRY: "0"
  with:
    pytest-args: tests/test_refund_drift.py
    simulate-drift: watch_abc123
    cache-fixture: "true"
```

Requires **Pro trial or paid** `mockdrift_cloud` product entitlement on the account.

---

## Harness bundle pinning

Document the watch used for replay in `harness.lock` so portable MGFA bundles record the incident source:

```yaml
manifests:
  mockdrift_replay:
    watch_id: watch_abc123
    fixture_key: simulate-drift
packages:
  mockdrift: "0.1.x"
```

Example profile: [examples/harness-mgfa/.driftguard/harness.lock](../../examples/harness-mgfa/.driftguard/harness.lock).

`driftguard lint-harness` validates package pins; watch IDs are operator metadata (not linted).

---

## MGFA buyer narrative

| MGFA dimension | How replay helps | Honest boundary |
|----------------|------------------|-----------------|
| Dim 3 pre-deploy testing | PR gate replays **same structural break** as open incident | Not a substitute for full agent eval |
| Dim 3 change management | Closes loop: detect → replay → fix → ack | Fixture is structural template v1; not byte-for-byte prod payload |
| Dim 2 oversight | Pair replay CI logs with drift export + ack trail | DriftGuard does not certify MGFA compliance |

Pair with [SchemaSync](./schemasync-prompt-schema-alignment.md) when drift removed tool fields referenced in prompts.

---

## What replay does not claim

- Full behavioural regression of agent reasoning or multi-turn flows
- Semantic / NL policy compliance (use SchemaSync literal mode separately)
- Replacement for FuseGuard runtime guardrails (Gate 2A)

See [ASSERTION-V2](../mockdrift/ASSERTION-V2.md) for assertion semantics.

---

## Next steps

| Goal | Doc |
|------|-----|
| Local MockDrift setup | [packages/mockdrift/README.md](../../packages/mockdrift/README.md) |
| Incident triage | [drift management](./drift-management.md) |
| Harness orchestration | [Singapore checklist](./singapore-agent-deployment-checklist.md) |
| Hosted API reference | [hosted API — MockDrift](../reference/hosted-api.md) |
