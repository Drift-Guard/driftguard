# Changelog

All notable changes to **DriftGuard** (open-source client) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Hosted monitoring (Pro/Team) is a separate service — see [OPEN_CORE.md](OPEN_CORE.md).

## [Unreleased]

### Added

- CI: `scan-paths` on coverage actions — no manual `files-json` build step; starter workflow, GitLab guide, Marketplace checklist.
- GitLab CI support: `CI_PROJECT_PATH`, `CI_JOB_SUMMARY`, `examples/gitlab-ci.yml`.

### Removed

- Public roadmap page and `docs/ROADMAP.md` — semantic drift remains an upcoming **Pro/Team** feature until launch.

## [0.3.3] - 2026-05-30

### Added

- Auto-mint `DRIFTGUARD_TRIAL_SESSION` in coverage-preview Step Summary (via `POST /api/trial/session`).
- `/ci/setup` page and `upgrade.ciSetup` deep link for copy-paste GitHub secrets.
- Console bulk **Import from CI** panel (`POST /api/watches/import-ci`) — trial adds first endpoint; Pro adds all.
- Plan-limit nudges in console sidebar and banner when nearing watch caps.

## [0.3.2] - 2026-05-30

### Added

- CI funnel: free `coverage-preview` + `drift-coverage-preview` action (hook mode, console upgrade links).
- Trial-limited `assert-coverage` (1 endpoint) and Pro gate via `DRIFTGUARD_API_KEY`.
- Hosted `POST /api/coverage/preview` with rate limits and `upgrade.*` deep links.
- Console/start `?from=ci&import=` prefill from CI scan results.
- [docs/CI.md](docs/CI.md) funnel documentation.

## [0.3.1] - 2026-05-30

### Added

- CI distribution model: [docs/CI.md](docs/CI.md) — version pins at Action ref, npx, and Release tarball layers.
- GitHub Actions: `setup-driftguard`, `drift-diff`, `drift-coverage` (embed `@v0.3.1` in consumer workflows).
- CLI: `driftguard assert-coverage`, `driftguard version [--json]`.
- Example workflows under `examples/workflows/`.
- `scripts/sync-version.mjs` — keeps `server.json` aligned with `package.json` on release.

## [0.3.0] - 2026-05-30

### Added

- Agent-facing docs: `AGENTS.md`, `SYSTEM_PROMPT.md`, `docs/QUICKSTART.md`, `docs/DISCOVERY.md`.
- MCP tools: `parse_mcp_config` (offline URL preview), `hosted_info` (capability matrix + upgrade URLs).
- MCP server instructions and when/when-not/siblings tool descriptions.
- `driftguard mcp` CLI subcommand and `driftguard-mcp` bin entry.
- `server.json` MCP Registry metadata and `examples/mcp-client-config.json`.
- MIT `LICENSE`, `CONTRIBUTING.md`.
- GitHub Actions: CodeQL, changelog check, release on tag, OpenRouter PR review.
- Dependabot for npm and GitHub Actions.

### Changed

- README clarifies open-source client vs hosted monitoring (not full self-host).
- Version aligned to 0.3.0 across package.json and MCP server metadata.

## [0.2.1] - 2026-05-30

### Changed

- README pricing reflects hosted Pro plans.

## [0.2.0] - 2026-05-29

### Added

- Local JSON schema diff CLI and MCP server.
- MCP `compare_json` (offline) and hosted monitoring tool proxies.
- Core diff engine with breaking / warning / info classification.

[Unreleased]: https://github.com/kioie/driftguard/compare/v0.3.2...HEAD
[0.3.2]: https://github.com/kioie/driftguard/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/kioie/driftguard/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/kioie/driftguard/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/kioie/driftguard/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/kioie/driftguard/releases/tag/v0.2.0
