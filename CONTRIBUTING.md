# Contributing

Thanks for improving the **public DriftGuard client**. The hosted monitoring service is not open to external contributions — see [OPEN_CORE.md](OPEN_CORE.md).

## Scope

In scope for this repo:

- Local JSON schema diff engine and tests
- CLI and MCP client ergonomics
- Agent/developer documentation
- CI examples using offline diff

Out of scope:

- Hosted worker, console, billing, or deployment code
- Replicating continuous MCP polling locally
- Product roadmap, GTM, pricing strategy, handbook, or other intellectual property (use **`driftguard-cloud`** only)

## Setup

```bash
nvm use          # Node 22 (.nvmrc)
npm ci
npm run build
npm test
```

## Before you push

```bash
npm run ci:local
```

Mirrors required CI (`validate` + `action-smoke`). See [AGENTS.md](AGENTS.md) for flags and agent workflow.

Optional: `bash scripts/install-githooks.sh` to run `ci:local` automatically on `git push`.

## Pull requests

1. Keep changes focused — one concern per PR
2. Run **`npm run ci:local`** before pushing
3. Update [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) if MCP tools or env vars change
4. Follow MCP tool description conventions in [AGENTS.md](AGENTS.md)

## AI agents

If you are an agent editing this repo, read [AGENTS.md](AGENTS.md) first.

## Security

Report vulnerabilities in the **public client** via GitHub issues. Do not disclose hosted infrastructure details publicly.

Maintainers: see [docs/security/PUBLIC-REPO-AUDIT.md](docs/security/PUBLIC-REPO-AUDIT.md) for repository hygiene and history scrub instructions.

## License

MIT — see [LICENSE](LICENSE).
