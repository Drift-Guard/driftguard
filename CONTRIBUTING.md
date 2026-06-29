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
- Docs that position DriftGuard as modeled on or in parity with a named commercial product ([IP boundary policy](docs/policies/IP-BOUNDARY-POLICY.md))

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

For `src/` code changes, optionally run SonarCloud locally before opening a PR:

```bash
export SONAR_TOKEN=...    # SonarCloud → My Account → Security → Generate token
# or add SONAR_TOKEN=... to .env or .dev.vars (gitignored)
npm run sonar:local
# or after unit checks: npm run ci:local -- --with-sonar
```

Install `sonar-scanner` via Homebrew (`brew install sonar-scanner`) or rely on the script's `npx` fallback. Never commit `SONAR_TOKEN`.

**Automatic Analysis:** DriftGuard uses CI-based analysis (`sonar-project.properties`, `npm run sonar:local`). If the scanner fails with *Automatic Analysis is enabled*, disable it once: SonarCloud → [kioie_driftguard](https://sonarcloud.io/project/analysis_method?id=kioie_driftguard) → **Administration** → **Analysis Method** → off. There is no `sonar.scanner.*` workaround.

Optional: `bash scripts/install-githooks.sh` to run `ci:local` automatically on `git push`.

**FuseGuard program PRs:** apply `fg-test/*` labels per [cloud FG-PR-LABELS](https://github.com/kioie/driftguard-cloud/blob/main/docs/FG-PR-LABELS.md) (private repo); OSS uses `fg-test/oss-pytest`, `fg-test/oss-ci-local`, `fg-test/oss-schema`, `fg-test/oss-ip-audit`.

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
