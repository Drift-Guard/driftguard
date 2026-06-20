# MockDrift CI artifacts for SIEM and GRC

**Status:** OSS partner-integration guide (E23). Not a compliance certification or attestation.

**Related:** [sensor v1 schema](../mockdrift/sensor-v1.schema.yaml) · [ASSERTION-V2](../mockdrift/ASSERTION-V2.md) · [evaluator / PGE](./mockdrift-init-fixtures.md) · [Singapore deployment checklist](./singapore-agent-deployment-checklist.md)

DriftGuard does **not** ship a full observability or SIEM stack. MockDrift emits **structured, PII-minimal CI artifacts** that security and compliance teams can forward to their existing SIEM, GRC, or OTel pipeline (Datadog, Splunk, Grafana, etc.).

---

## What to export

| Artifact | Format | Typical path | SIEM use |
|----------|--------|--------------|----------|
| **Sensor report** | `mockdrift.sensor/v1` JSON | `mockdrift-sensor.json` or `./sensors/<test>.json` | Proof that pre-deploy agent contract tests ran; verdict + failure codes |
| **Evaluator result** | JSON stdout from `mockdrift evaluate` | CI job log or uploaded file | Independent reviewer pass/fail (producer ≠ evaluator) |
| **Usage telemetry** (optional) | `POST /api/usage/events` | Hosted only — not a SIEM export | Disable with `MOCKDRIFT_TELEMETRY=0` when forwarding artifacts locally |

Sensor JSON intentionally **omits** raw mock HTTP bodies, API keys, and end-user PII. It includes scenario id, verdict, failure codes, condensed tool names, and remediation hints.

---

## Enable sensor artifacts in CI

```yaml
- name: MockDrift harness
  run: |
    pip install -e "./packages/mockdrift[dev]"
    pytest tests/harness/ --mockdrift-sensor-report=./artifacts/sensors/

- name: Independent evaluator (Gate 1b)
  run: mockdrift evaluate --report ./artifacts/sensors/

- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: mockdrift-sensors
    path: artifacts/sensors/
    retention-days: 90
```

Environment variables:

| Variable | Effect |
|----------|--------|
| `MOCKDRIFT_SENSOR_JSON` | Directory or file path for sensor output (alternative to pytest flag) |
| `MOCKDRIFT_TELEMETRY=0` | Opt out of hosted usage events (`mockdrift.cloud_ci_run`) |

See [ASSERTION-V2 — Sensor projection](../mockdrift/ASSERTION-V2.md#sensor-projection-mockdriftsensorv1) for schema fields.

---

## Recommended SIEM event shape

Normalize sensor JSON into your SIEM index. Suggested field mapping (adjust to your schema):

```json
{
  "event.category": "process",
  "event.type": "info",
  "event.action": "mockdrift.sensor",
  "event.outcome": "success",
  "driftguard.product": "mockdrift",
  "driftguard.verdict": "PASS",
  "driftguard.scenario_id": "stripe/required-field",
  "driftguard.failure_profile": "halt_clean",
  "driftguard.runner": "langgraph",
  "driftguard.failure_code": null,
  "driftguard.steps_total": 2,
  "driftguard.ci.run_id": "${GITHUB_RUN_ID}",
  "driftguard.ci.sha": "${GITHUB_SHA}",
  "driftguard.harness_bundle": ".driftguard/"
}
```

For `verdict: FAIL`, set `event.outcome` to `failure` and map `failure.code` (e.g. `WRONG_FAILURE_PROFILE`, `LOOP_SPIRAL`) to `driftguard.failure_code`.

**Do not** index `agent_actions` or `failed_criteria[].detail` if your policy treats remediation text as sensitive — verdict and codes are usually sufficient for audit evidence.

---

## Cloud replay telemetry (optional)

When `DRIFTGUARD_API_KEY` is set and `MOCKDRIFT_TELEMETRY` is not `0`, MockDrift may POST a best-effort usage event:

```json
{
  "eventType": "mockdrift.cloud_ci_run",
  "productId": "mockdrift",
  "quantity": 1,
  "metadata": { "framework": "pytest" }
}
```

This is **billing/usage telemetry**, not a substitute for sensor artifacts. For air-gapped or SIEM-only pipelines, set `MOCKDRIFT_TELEMETRY=0` and rely on uploaded sensor JSON.

---

## OTel and partner stacks

Route artifacts through your collector — DriftGuard does not run OTel agents:

```
pytest → sensor JSON → upload-artifact → CI ingest / OTel collector → SIEM
```

Pair with hosted drift exports ([hosted API — audit export](../reference/hosted-api.md)) for post-deploy evidence; sensor JSON covers **pre-deploy** contract testing only.

---

## MGFA evidence lane

Singapore MGFA Dimension 3 expects evidence of pre-deployment safety testing. Sensor JSON + evaluator separation documents **that tests ran and were independently reviewed** — not that agents are certified compliant. See [mockdrift CI telemetry](./mockdrift-init-fixtures.md) and [gate ladder](../policies/gate-ladder.md).

---

## Non-goals

| Do not expect | Instead |
|---------------|---------|
| Full APM traces | OTel vendor + your agent framework |
| HITL approval records | Workflow tools (ServiceNow, Jira) |
| Hosted telemetry aggregation | Export artifacts from CI; optional usage events only |
| PII or raw mock payloads in sensor JSON | By design — use scenario id + failure codes |
