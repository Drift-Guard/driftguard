# Changelog

All notable changes to **DriftGuard** (open-source client) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Hosted monitoring (Pro/Team) is a separate service — see [OPEN_CORE.md](OPEN_CORE.md).

## [Unreleased]

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

[Unreleased]: https://github.com/kioie/driftguard/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/kioie/driftguard/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/kioie/driftguard/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/kioie/driftguard/releases/tag/v0.2.0
