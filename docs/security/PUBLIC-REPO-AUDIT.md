# Public repository security audit (May 2026)

Audit of [Drift-Guard/driftguard](https://github.com/Drift-Guard/driftguard) for proprietary content, credentials, and strategy documents.

## Current HEAD — clean

At the latest commit, the public repo should contain only the open-source client and user-facing docs per [IP-BOUNDARY-POLICY.md](../policies/IP-BOUNDARY-POLICY.md).

- Local JSON diff + MCP connector
- Public docs (`docs/CI.md`, `QUICKSTART.md`, etc.)
- No `.env` values, billing code, or hosted infrastructure
- `cloud/` is gitignored and not tracked

## Git history — action required

Early commits (before `973d4f9` open-core split) pushed proprietary content to GitHub:

| Removed from HEAD | Still in history |
|-------------------|------------------|
| `MONETIZATION.md`, `AGENT_LOG.md`, `PAYMENTS_KENYA.md` | 7-day GTM playbooks, MRR targets |
| Hosted MVP (`src/api/`, billing, SQLite server) | Full pre-split product code |
| `docs/ROADMAP.md` (Jun 2026, later removed) | Semantic drift flagship plan |
| `driftguard.org` default URL | Personal Cloudflare subdomain |

No literal API keys were found in history (env var names only), but **rotate** Lemon Squeezy webhook secret and any credentials from the May 29–30 MVP window as a precaution.

## Remediation

1. Run the history scrub (maintainers only):

   ```bash
   bash scripts/scrub-public-git-history.sh
   git push --force-with-lease origin main
   ```

2. Follow [SECRET-ROTATION-CHECKLIST.md](./SECRET-ROTATION-CHECKLIST.md).

3. Enable GitHub **secret scanning** on the public repo.

4. Enforce [IP-BOUNDARY-POLICY.md](../policies/IP-BOUNDARY-POLICY.md) on new PRs; work through § **Known OSS remediation backlog** for legacy leaks.

## Private cloud repo

Hosted strategy docs and operator runbooks live in the private `kioie/driftguard-cloud` repo. See that repo’s `docs/INTERNAL-RUNBOOKS.md` after the security remediation PR merges.

## Reporting

Security issues in the public client: GitHub Issues on `Drift-Guard/driftguard`. Do not file hosted infrastructure details publicly.
