# OpenAPI diff fixtures

Committed spec pairs for `diffOpenApiSpecs` integration tests (`src/core/openapi-diff.test.ts`) and CLI smoke tests (`src/cli/openapi-diff.test.ts`).

| File | Scenario |
|------|----------|
| `petstore-v1.json` | Baseline GET /pets with params, response body, headers, security |
| `petstore-removed-op.json` | Breaking: operation removed |
| `petstore-added-op.json` | Warning: POST /pets added |
| `petstore-param-drift.json` | Parameter type change + new required param |
| `petstore-response-drift.json` | Response field removed + default status added |
| `petstore-header-drift.json` | Response header key swap |
