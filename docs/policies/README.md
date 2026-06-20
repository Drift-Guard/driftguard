# Policies & gates

Rules for schema drift: coverage, breaking-change enforcement, and optional **gate packages** for repo-level contract testing.

**Hosted enforcement:** Full coverage gates and alert policies need Pro/Team — [pricing](https://driftguard.org/pricing). The free client alone cannot run scheduled checks or multi-tenant policy engines.

What's free vs paid: [OPEN_CORE.md](../../OPEN_CORE.md).

---

## Policy topics

| Policy | Free | Hosted | Doc |
|--------|------|--------|-----|
| **Breaking-change** | CLI/MCP diff exits 1 on breaking | Watch alerts + history | [Developer guide](../guides/developer.md) |
| **Coverage** | Preview lists gaps (non-blocking) | `assert_coverage` fails CI | [CI/CD guide](../guides/ci-cd.md) |
| **Gate ladder** | MockDrift → SchemaSync packages | Trip ingest / GitHub App (cloud) | [gate-ladder.md](./gate-ladder.md) |
| **IP & public disclosure** | OSS scope vs cloud moat; PR naming | — | [IP-BOUNDARY-POLICY.md](./IP-BOUNDARY-POLICY.md) |

---

## What the free client cannot do alone

- Scheduled checks across many endpoints
- MCP `tools/list` polling and tool-schema drift pipeline
- Team-wide API key provisioning and SSO
- Alert routing to Slack/email with retry rules
- Drift history export and audit trails

Path to paid monitoring: try offline → [trial](https://driftguard.org/start) → Pro key.

---

## Next steps

| Goal | Doc |
|------|-----|
| When to adopt each gate | [Gate ladder](./gate-ladder.md) |
| Watch and key admin | [Platform admin](../guides/platform-admin.md) |
| Glossary terms | [Glossary — gate packages](../glossary.md#gate-packages-coverage-ladder) |
