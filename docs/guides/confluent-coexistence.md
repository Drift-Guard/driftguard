# DriftGuard and Confluent Schema Registry

DriftGuard is **not** a Kafka schema registry replacement. Use both when you operate HTTP/MCP automation **and** streaming pipelines.

## When to use which

| Layer | Tool | DriftGuard role |
|-------|------|-----------------|
| Kafka topics (Avro/Protobuf) | Confluent Schema Registry | None — use Confluent compatibility modes |
| REST webhooks, n8n, agent tools | DriftGuard `validate` + `watch` | Runtime ingress gate + upstream contract drift |

## Hybrid pattern

1. **Registry** governs serialized events on topics (producer CI, `BACKWARD` / `FULL` compatibility).
2. **DriftGuard watch** polls vendor OpenAPI or MCP `tools/list` for HTTP/MCP surfaces that feed those pipelines.
3. **DriftGuard validate** blocks bad JSON at webhook ingress before data hits Kafka or your warehouse loader.

## What we do not do

- Broker-side schema enforcement
- Avro/Protobuf ID resolution
- Topic replication or consumer offset management

## Related

- [Automation ingress playbook](automation-ingress.md)
- [BI / warehouse boundary](bi-warehouse-boundary.md)
