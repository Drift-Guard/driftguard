# BI and warehouse schema drift — honest boundary

DriftGuard watches **machine-readable API and MCP contracts** (OpenAPI, JSON tool schemas, webhook payloads). It does **not** replace warehouse governance or BI dashboard lineage tools.

## Where DriftGuard fits

| Surface | Example | DriftGuard |
|---------|---------|------------|
| Vendor REST webhook | Shopify order payload | `validate` at ingress |
| MCP tool list | Cursor agent tools | `watch` + breaking diff |
| Internal HTTP API | Partner OpenAPI | CI + hosted watch |

## Where it does not fit (use other tools)

| Pain | Typical stack | Why not DriftGuard alone |
|------|---------------|--------------------------|
| Column rename breaks 200 Metabase dashboards | dbt + warehouse DDL | Pain is SQL dependency graph, not HTTP contract |
| Silent warehouse schema change | Soda, GE, dbt tests | Table/column expectations, not JSON ingress |
| CRM field mapping across 200 SaaS apps | MDM / iPaaS | Semantic equivalence — different product category |

## Complementary narrative

**Upstream contract observability** (DriftGuard) reduces surprises **before** bad rows land in the lake. **Downstream data contracts** (dbt, expectations) still own table semantics inside the warehouse.

## Related

- [Semantic drift boundary](semantic-drift-boundary.md)
- [Confluent coexistence](confluent-coexistence.md)
- [Automation ingress](automation-ingress.md)
