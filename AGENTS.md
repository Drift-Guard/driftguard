# DriftGuard — Agent instructions

Guidance for AI coding agents working in this repository. For a compact tool/API cheat sheet, see [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md).

## Before you push

Use **Node 22** (`.nvmrc`) — same as CI.

```bash
nvm use                 # or: fnm use
npm run ci:local        # mirrors required CI before every PR
```

| Flag | When |
|------|------|
| `--with-changelog` | PR changes user-facing behavior |
| `--packages packages/mockdrift` | Touched a path-filtered package |
| `--with-sonar` | Code changes — local SonarCloud upload (needs `SONAR_TOKEN`) |

Optional hook (not required): `bash scripts/install-githooks.sh` runs `ci:local` on `git push`.

GitHub-only checks (not in `ci:local` by default): CodeQL, Gitleaks, dependency review, OpenRouter review.

### SonarCloud (optional, before push)

For `src/` changes, run a local scan to catch issues before the PR **SonarCloud Code Analysis** gate:

```bash
export SONAR_TOKEN=...    # SonarCloud → My Account → Security → Generate token
# or add SONAR_TOKEN=... to .env or .dev.vars (gitignored)
npm run sonar:local
```

Install scanner: `brew install sonar-scanner` (or the script uses `npx @sonarsource/sonar-scanner`). Project key: `kioie_driftguard` (`sonar-project.properties`).

If scan fails with *Automatic Analysis is enabled*, disable it once: SonarCloud → **kioie_driftguard** → **Administration** → **Analysis Method** → off. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Commands

| Command | Description |
|---------|-------------|
| `npm run ci:local` | **Pre-PR:** mirror required CI (`ci.yml` validate + action smoke) |
| `npm run sonar:local` | Local SonarCloud upload (`SONAR_TOKEN` required) |
| `npm run prepush` | Alias for `ci:local` |
| `npm ci && npm run build` | Install and compile TypeScript → `dist/` |
| `npm test` | Run unit tests (`node --test`) |
| `npm run check -- diff '<before>' '<after>'` | Local JSON schema diff (exit 1 if breaking) |
| `npm run mcp` | Start MCP server on stdio (after build) |
| `npm run dev:mcp` | Start MCP via tsx (development) |

## Layout

```
packages/diff-core/    # Canonical diff semantics (@driftguard/diff-core, ARCH-U01)
src/core/diff.ts       # OSS adapter (cli profile) over diff-core
src/cli/check.ts       # CLI entry (diff, mcp)
src/mcp/server.ts      # MCP server — local + hosted proxy tools
src/mcp/constants.ts   # Version, hosted URLs, server instructions
src/mcp/parse-mcp-json.ts  # Local mcp.json URL preview (no network)
examples/              # MCP client config templates
docs/                  # Quick start, discovery (product IP → driftguard-cloud)
```

## Open core boundary

| In this repo | Hosted only (not in public repo) |
|--------------|----------------------------------|
| `compare_json`, local CLI diff | Continuous cron/queue checks |
| `parse_mcp_config` preview | MCP tools/list polling |
| MCP proxy to hosted API | Multi-tenant watches, billing, console |
| `explain_drift` (public endpoint) | Alert routing, drift history export |

Do not document or implement hosted infrastructure in this repo. Funnel continuous monitoring to [hosted trial](https://driftguard.org/start) and [pricing](https://driftguard.org/pricing).

## Intellectual property

**Never add product IP to this public repo.** The following belong **only** in the private **`driftguard-cloud`** repository:

- Product roadmap and control-plane sequencing (CP-*, LAB-*, GTM-*, HANDBOOK-*)
- Pricing strategy, COGS, and packaging specs
- GTM, founding lab, distribution, and enterprise sales playbooks
- Hosted implementation specs beyond user-facing API/MCP reference docs
- Internal handbook (mission, ICP narrative, operating metrics)
- UX audits or feature roadmaps framed against named commercial products

This repo may include **user-facing** OSS docs (quick start, guides, gate ladder, hosted API index with link-outs). When in doubt, put specs in `driftguard-cloud`.

**Public disclosure:** Do not imply DriftGuard surfaces are modeled on a specific third-party product in PRs, commits, issues, or docs. Full rules: [docs/policies/IP-BOUNDARY-POLICY.md](docs/policies/IP-BOUNDARY-POLICY.md).

## MCP tool conventions

Follow the **when / when-not / siblings** pattern in tool descriptions (see [tiny-go-mcp-server](https://github.com/kioie/tiny-go-mcp-server) for reference):

- **Names:** `snake_case`
- **Offline first:** agents should prefer `compare_json` and `parse_mcp_config` before calling hosted tools
- **Hosted tools:** must fail clearly with trial/pricing URLs when `DRIFTGUARD_API_KEY` is missing
- **Version:** read from `package.json` via `src/mcp/constants.ts` — keep in sync

## Code style

- ESM + TypeScript strict mode
- No secrets in tool responses
- MCP logs go to **stderr** only (stdio is the protocol)
- Match existing patterns in `src/core/diff.ts` for tests

## Token budget

Keep agent sessions lean by default. Long threads and broad exploration burn context fast.

### Scope and reads

- **Scope first:** `@`-mention specific files; avoid repo-wide search unless the path is unknown.
- **Read minimally:** open only files needed for the task; do not load unrelated packages or docs.
- **One task per chat:** start a fresh thread when scope shifts; summarize decisions instead of carrying full history.
- **`scratch/` is excluded** (`.cursorignore`) — do not create runner clones unless clearing a PR backlog (see below).

### Mode and delegation

- **Ask mode** for exploration, questions, and code review — no edits, no shell unless necessary.
- **Agent mode** only when implementing (edits, commits, running verification).
- **Work directly** in the main agent — no `Task` subagents, LLM council, Bugbot, or Security Review unless the user explicitly asks or the task truly needs parallelism.

### Reduce review triggers

Each shell command, fetch, or MCP call in Agent mode may spawn an `agent_review` pass. Minimize tool churn:

- **Batch shell:** one `npm run ci:local` or `npm test` — not many small commands.
- **Prefer `@file` + Read** over repeated grep/glob loops when the path is known.
- **Disable unused MCP servers** for the session when not needed.

## Git workflow

**Do not push to `main`.** Branch from `main`, open a pull request, and merge after CI passes. `main` is branch-protected (PR required).

```bash
git checkout main && git pull
git checkout -b feat/your-change
# … commits …
git push -u origin feat/your-change
gh pr create --fill
```

**Parallel PR Processing** (exception to token budget): For backlogs of >3 PRs only, use the **Isolated Runner Pattern** (spawn up to 4 parallel subagents in unique scratch clones) to verify and merge concurrently.

## Publishing

- Registry metadata: [server.json](server.json)
- Discovery steps: [docs/DISCOVERY.md](docs/DISCOVERY.md)
- npm publish is optional; document clone + build path until published

## Parallel PR Runner Protocol

When clearing a PR backlog, agents MUST use the **Isolated Runner Pattern**:
1. **Orchestrate**: Rank PRs by impact (Security > Perf > Features).
2. **Parallelize**: Delegate to subagents for verification and merge.
3. **Isolate**: Each subagent MUST work in a unique temporary clone (e.g., `scratch/driftguard-runner-N`).
4. **Final Sync**: Lead agent pulls `main` and verifies the final unified state.
