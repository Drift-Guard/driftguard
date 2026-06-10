# Policies & gates

Platform and security policies for schema drift: coverage rules, breaking-change enforcement, and the OSS **gate ladder** for repo-level contract testing.

**Hosted enforcement:** Full coverage gates and alert policies require Pro/Team — [pricing](https://driftguard.org/pricing). OSS alone cannot replicate continuous monitoring or multi-tenant policy engines.

Boundary: [OPEN_CORE.md](../../OPEN_CORE.md).

---

## Policy topics

| Policy | OSS | Hosted | Doc |
|--------|-----|--------|-----|
| **Breaking-change** | CLI/MCP diff exits 1 on breaking | Watch alerts + history | [Developer guide](../guides/developer.md) |
| **Coverage** | Preview lists gaps (non-blocking) | `assert_coverage` fails CI | [CI/CD guide](../guides/ci-cd.md) |
| **Gate ladder** | MockDrift → SchemaSync packages | Trip ingest / GitHub App (cloud) | [gate-ladder.md](./gate-ladder.md) |

---

## Open-core guardrails

What OSS **cannot** enforce alone:

- Scheduled checks across many endpoints
- MCP `tools/list` polling and tool-schema drift pipeline
- Team-wide API key provisioning and SSO
- Alert routing to Slack/email with retry semantics
- Drift history export and audit trails

Use the funnel: offline try → [trial](https://driftguard.org/start) → Pro key.

---

## Next steps

| Goal | Doc |
|------|-----|
| When to adopt each gate | [Gate ladder](./gate-ladder.md) |
| Watch and key admin | [Platform admin](../guides/platform-admin.md) |
| Glossary terms | [Glossary — gate packages](../glossary.md#gate-packages-coverage-ladder) |
