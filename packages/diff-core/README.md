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
