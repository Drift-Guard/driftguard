# Secret rotation checklist (post history scrub)

Run after scrubbing public git history or if you suspect early MVP commits exposed credentials.

## High priority

| Secret | Where configured | Action |
|--------|------------------|--------|
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Cloudflare Worker secret | Regenerate in Lemon Squeezy → re-sync via deploy |
| `CRON_SECRET` | Cloudflare Worker secret | `wrangler secret put CRON_SECRET` with new value |
| Any early `dg_…` API keys | D1 `customers` table | Revoke and re-issue if keys were generated before open-core split |

## Medium priority

| Secret | Where configured | Action |
|--------|------------------|--------|
| GitHub OAuth client secret | GCP Secret Manager / GitHub Actions | Rotate in GitHub Developer Settings |
| Google OAuth client secret | GCP Secret Manager / GitHub Actions | Rotate in Google Cloud Console |
| `HEADERS_ENCRYPTION_KEY` | Cloudflare Worker | Rotate if Worker was deployed from public MVP commits |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions | Rotate in Cloudflare dashboard if token predates split |

## Verify after rotation

```bash
# Production health
curl -s https://driftguard.org/health

# Billing webhook (after LS secret rotate + deploy)
# Trigger test webhook from Lemon Squeezy dashboard

# OAuth sign-in smoke
open https://driftguard.org/signup
```

## Gitleaks scan

```bash
gitleaks detect --source . --verbose --log-opts='--all'
```

Run on both `kioie/driftguard` (after history scrub) and `kioie/driftguard-cloud`.
