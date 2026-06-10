# Developer guide

Compare JSON locally for fixtures, API snapshots, and pre-commit checks. No hosted account required for the steps below.

**Before you start:** Node.js 20+, free client built (`npm ci && npm run build`). See [Getting started — install](../getting-started.md#1-install-the-oss-client).

---

## Overview

DriftGuard compares two JSON payloads and labels each change as **breaking** or **additive** (safe). Use the CLI for scripts and CI; use MCP `compare_json` when an agent already has the payloads in context.

---

## Run a local diff

**CLI:**

```bash
npm run check -- diff '{"user":{"id":1}}' '{"user":{"id":1,"email":"a@b.com"}}'
```

Exit code **1** when `breakingCount > 0`. Safe for CI gates on breaking changes only.

**MCP:** Call `compare_json` with `before` and `after` JSON strings — same rules as CLI.

Diff rules: [Reference — diff rules](../reference/README.md#diff-semantics).

---

## Read the output

| Field | Meaning |
|-------|---------|
| `breakingCount` | Changes that can break existing apps (removed fields, type narrowing, etc.) |
| `additiveCount` | Safe additions (new optional fields, widened types) |
| `changes` | Per-path change list with classification |

Terms: [Glossary — breaking vs additive](../glossary.md).

---

## Pre-commit and local gates

**JSON fixtures:** Store before/after pairs (or baseline + current) and run `driftguard diff` in a pre-commit hook or `npm test` script.

**Gate packages (optional):** For repo-level contract checks beyond raw JSON diff, see the [gate ladder](../policies/gate-ladder.md) — MockDrift for assertion tests, ToolChange for MCP tool manifests.

**CI without hosted key:** The free **hook** tier (`drift-diff` / CLI diff) fails only on breaking schema changes. See [CI/CD guide](./ci-cd.md).

---

## Fix suggestions after breaking diffs

When `breakingCount > 0`, call **`explain_drift`** with the `changes` array from diff output. It returns suggested fixes via a public hosted endpoint — **no API key** required.

| Tool | When |
|------|------|
| `compare_json` | Detect breaking changes |
| `explain_drift` | Hints after breaking results |
| `hosted_info` | Explain free vs paid if you ask about monitoring |

Do not use `explain_drift` as a substitute for local diff or watch registration.

---

## Preview dependencies (offline)

Before registering watches, run **`parse_mcp_config`** on your `mcp.json` to list HTTPS watch candidates. Stdio-only MCP servers without URLs need hosted polling — not available in this repo.

Related: `suggest_watches` (hosted + key) for catalog import — [Getting started step 6](../getting-started.md#6-upgrade--trial-api-key-watches).

---

## Next steps

| Goal | Doc |
|------|-----|
| Connect MCP in Cursor / Claude | [Getting started step 3](../getting-started.md#3-connect-an-mcp-client) · [Agent / MCP guide](./agent-mcp.md) |
| Add CI hook | [CI/CD guide](./ci-cd.md) · [CI.md](../CI.md) |
| Continuous monitoring | [Drift management](./drift-management.md) · [trial](https://driftguard.org/start) |
| Tool contracts | [Reference](../reference/README.md) |
