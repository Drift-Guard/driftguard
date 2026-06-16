# E23 — MockDrift CI telemetry and observability

**Assessment status:** Draft  
**Owner tier:** OSS (+ optional hosted)  
**Wave:** E (Enablement)

## Value

| Dimension | Assessment |
|-----------|------------|
| **Customer pain** | Security/compliance teams need evidence that pre-deploy MockDrift tests ran in CI pipelines. |
| **MGFA directness** | **Medium** — Dim 3 evidence of pre-deploy test execution (supporting, not primary control). |
| **Revenue / strategic** | Low direct revenue; helps enterprise buyers feeding SIEM/GRC — optional hosted aggregation later. |
| **Differentiation** | Sensor JSON already structured for in-loop remediation; telemetry export is adjunct to E15 evaluator story. |

## Soundness

| Dimension | Assessment |
|-----------|------------|
| **Technical feasibility** | **Partial** — opt-out telemetry exists (`MOCKDRIFT_TELEMETRY=0`); SIEM export shape not standardized in docs. |
| **Open-core boundary** | Telemetry can stay OSS with no PII in sensor JSON — aligned with doc proposal. |
| **Dependency risk** | Building hosted telemetry aggregation overlaps OTel partner lane. |
| **Scope creep risk** | **High** if expanded to full observability stack — doc lists OTel as partner integrate path. |

## Verdict

**Partner** (primary) / **Refine** (minimal OSS export schema) — Document sensor JSON + CI artifact paths for customer SIEM; **do not build** DriftGuard APM. Optional small OSS export spec only.
