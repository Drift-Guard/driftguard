# DriftGuard

Open-core schema drift detection for APIs and MCP tools, with optional hosted continuous monitoring.

## Language

**Schema drift**:
A change between two JSON payloads or tool schemas that alters the inferred contract — field additions, removals, or type changes.
_Avoid_: API change, breaking diff

**Breaking change**:
A schema drift finding that should fail CI or block an agent action — severity depends on the active diff profile and stored baseline.
_Avoid_: Error, regression

**Diff profile**:
The infer/diff semantics preset — `cli` (strict, all observed fields required) or `hosted` (observational, optional unless baseline requires).
_Avoid_: Mode, environment flag

**Watch**:
A hosted monitor configuration that periodically captures snapshots and emits drift events for an API or MCP target.
_Avoid_: Job, cron, check

**Account capabilities**:
The server-resolved snapshot of what a billing account may do — plan tier, feature flags, overlay products, and quotas.
_Avoid_: Entitlements (use for low-level product rows), permissions (identity RBAC)

**Watch insights**:
The presentation layer for a watch’s inventory, endpoint/tool profiles, and drift event trails behind the console and insights API.
_Avoid_: Dashboard data, analytics
