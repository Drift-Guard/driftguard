# MockDrift init + fixture marketplace

**Status:** OSS Gate 1 H2–H3 + hosted catalog H5. MGFA Dimension 3 — reproducible scenario baselines for agent testing.

**Related:** [gate ladder — Gate 1](../policies/gate-ladder.md) · [packages/mockdrift](../../packages/mockdrift/README.md) · [cloud replay](./mockdrift-cloud-replay.md) · [Singapore checklist](./singapore-agent-deployment-checklist.md)

MockDrift ships **structural drift scenarios** — schema breaks, required-field additions, tool removals — not behavioural or compliance certification. Fixture packs are **curated examples** for pre-deploy harness tests; they do not imply MGFA, PCI, or sector regulatory approval.

---

## When to use each surface

| Surface | Command | API key | Use when |
|---------|---------|---------|----------|
| **OSS local** | `mockdrift demo stripe/required-field` | No | Bootstrap, deterministic CI, offline demos |
| **OSS init scaffold** | `mockdrift init --runner langgraph` | No | Greenfield agent repo with harness bundle |
| **Hosted catalog** | `mockdrift catalog` · `mockdrift install slack/message-field-required` | Yes (`mockdrift_cloud`) | Vendor scenarios without a live watch |
| **Cloud replay** | `mockdrift run --simulate-drift WATCH_ID` | Yes | Production-faithful replay from open incident |

Offline-first: run `mockdrift init` + local demos before enabling hosted catalog or cloud replay.

---

## `mockdrift init` (H2)

Scaffolds a portable harness bundle in the current directory:

```bash
cd your-agent-repo
pip install -e path/to/packages/mockdrift
mockdrift init --runner langgraph --fixture stripe/required-field
```

| Flag | Values | Default |
|------|--------|---------|
| `--runner` | `langgraph`, `crewai`, `custom` | `langgraph` |
| `--fixture` | Marketplace id (`vendor/scenario`) | `stripe/required-field` |
| `--failure-profile` | `halt_clean`, `bubble_to_orchestrator`, `fallback_state` | `bubble_to_orchestrator` |
| `--force` | overwrite existing files | off |

**Written artifacts:**

| Path | Purpose |
|------|---------|
| `.driftguard/gates.yaml` | Gate toggles (MockDrift, FuseGuard, evaluator, ToolChange) |
| `.driftguard/harness.lock` | Pinned fixture ref |
| `.driftguard/agents.yaml` | Starter agent binding manifest |
| `.mockdrift.toml` | Fixture path + drift target |
| `tests/harness/test_drift.py` | `@drift_replay` skeleton |
| `.github/workflows/drift-harness.yml` | sensor → evaluator → harness-lint |
| `agents/billing/refund_graph.py` | LangGraph runner (or CrewAI/custom equivalent) |

**Runners:**

- **LangGraph** — `StateGraph` refund node with `current_session()` proxy; entry `agents.billing.refund_graph:refund_graph`.
- **CrewAI** — proxy-style `run(session)` scaffold; tests use `runner="custom"` with CrewAI entrypoint.
- **Custom** — direct `ToolProxy.invoke` smoke without graph wrapper.

Init requires a fixture with a **local OSS path**. Hosted-only ids (`openai/...`, `twilio/...`) fail at init — install via catalog first, then point `harness.lock` at the cache path.

---

## OSS fixture marketplace (H3)

Vendor/scenario ids live in `packages/mockdrift/fixtures/index.yaml`:

```bash
mockdrift demo stripe/required-field
mockdrift demo mcp/tool-removed
```

Each entry includes `lane: oss` and `content_kind: oss-curated`. Curated **packs** (tag clusters, not compliance bundles):

| Pack tag | Fixtures | Scenario theme |
|----------|----------|----------------|
| `pack:payments` | `stripe/*` | Refund write-tool drift, idempotency, loop detect |
| `pack:messaging` | `slack/message-field-required` | Required field on postMessage |
| `pack:tools-protocol` | `mcp/tool-removed` | MCP tools/list removal |

Pin ids in `harness.lock`:

```yaml
fixtures:
  - id: stripe/required-field
    version: "1.0.0"
    path: packages/mockdrift/fixtures/stripe-refund-2026-06-04
    mockdrift_key: stripe-required-field
```

---

## Hosted fixture catalog (H5)

Browse and install curated hosted scenarios (Pro / `mockdrift_cloud`):

```bash
export DRIFTGUARD_API_KEY=dg_live_...
mockdrift catalog
mockdrift install slack/message-field-required --cache-fixture
mockdrift demo slack/message-field-required   # after cache materialized
```

API: `GET /v1/mockdrift/fixtures/catalog` (public) · `POST /v1/mockdrift/fixtures/install` (entitlement).

**Honest labeling** — every catalog row includes `contentKind`:

| `contentKind` | Meaning |
|---------------|---------|
| `oss-curated` | Full fixture in OSS repo; use `mockdrift demo` locally |
| `hosted-curated` | Structural drift payload served by hosted API |
| `hosted-stub` | Placeholder scenario for bootstrap — not vendor-verified |

List responses include a `disclaimer`: fixtures are **structural examples** for harness testing, not regulatory certification or vendor endorsement.

**OSS vs hosted lane:**

| `lane` | `installable` | Action |
|--------|---------------|--------|
| `oss` | `false` | Clone repo path or `mockdrift demo` |
| `hosted` | `true` | `mockdrift install <id>` |

---

## MGFA regression workflow (init → catalog → CI)

```
  Bootstrap                    Pre-deploy gate
  ─────────                    ───────────────
  mockdrift init               pytest tests/harness/
  mockdrift demo (local)       mockdrift evaluate --report sensor.json
  optional: catalog install    drift-harness.yml on PR
```

Pair with [cloud replay](./mockdrift-cloud-replay.md) when a watch already detected production drift.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `hosted-catalog only` on init | Pick OSS fixture (`stripe/required-field`) or `mockdrift install` first |
| `DRIFTGUARD_API_KEY is required` | Export key; trial at [driftguard.org/start](https://driftguard.org/start) |
| `PRODUCT_REQUIRED: mockdrift_cloud` | Enable MockDrift Cloud in Console → Products |
| Catalog shows `hosted-stub` | Structural placeholder — replace with watch replay or custom fixture for production gates |
