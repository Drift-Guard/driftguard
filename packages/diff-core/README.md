# @driftguard/diff-core

Canonical schema diff semantics for DriftGuard (ARCH-U01).

**Consumers:** OSS CLI/MCP (`profile: cli`), cloud hosted checks (`profile: hosted`), golden contract tests, ToolChange lint alignment.

```typescript
import { inferSchema, diffSchemas } from "@driftguard/diff-core";

const before = inferSchema(payload, "$", { profile: "hosted" });
const after = inferSchema(nextPayload, "$", { profile: "hosted" });
const diff = diffSchemas(before, after);
```

Contract vectors: `contract/vectors.json` — both repos and ToolChange pytest must stay aligned.

## MGFA — single source of structural truth

For governance programmes (e.g. Singapore MGFA Dimension 3), `@driftguard/diff-core` is the **canonical verdict layer** across:

| Consumer | Profile | Use |
|----------|---------|-----|
| OSS CLI / MCP | `cli` | Local diff, CI hooks |
| Hosted watches | `hosted` | Scheduled checks, drift events |
| ToolChange | aligned vectors | MCP manifest PR lint |

One breaking/additive classification per path — auditors can correlate CLI logs, CI artifacts, and hosted drift exports without reconciling divergent diff engines. Expand edge-case coverage in `contract/vectors.json` when new MCP schema patterns appear.

Not in scope: semantic/NL policy evaluation (hosted semantic drift is a separate layer). See [SINGAPORE-MGFA-PRODUCT-FIT.md](../../docs/SINGAPORE-MGFA-PRODUCT-FIT.md) · assessment [E16](../../docs/assessments/mgfa/E16-diff-core-canonical-semantics.md).
