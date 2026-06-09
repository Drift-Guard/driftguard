# On-demand snapshot security (FuseGuard Gate 2B)

Checklist for `POST /v1/fuseguard/snapshots` before FuseGuard production GA.

## Requirements

| Item | Status | Implementation |
|------|--------|----------------|
| Valid `tripId` from ingest (FG-C06) | Shipped | `on-demand-snapshot.ts` |
| No free-form URL in API | Shipped | URL derived from trip → watch row |
| SSRF block RFC1918 / link-local (FG-C04) | Shipped | `url-policy.ts` + DNS pin |
| Max body 1MB, 10s timeout | Shipped | `snapshot-policy.ts` → `captureSnapshot` |
| Redirect hops re-validated (max 5) | Shipped | `safe-fetch.ts` |
| Rate limit 10/day, burst 3/hour | Shipped | `fuseguard-snapshot-runs.ts` |
| Trip ingest rate limit | Shipped | `RATE_LIMITS.fuseguardTrips` |
| Host = persisted watch URL only | Shipped | `assertPersistedWatchHost` |
| Fail-open on fetch failure (502, trip valid) | Shipped | Catch in `runOnDemandSnapshot` |
| Fail-closed on budget / blocked URL | Shipped | 403/429 before fetch |

## Sign-off

| Role | Date |
|------|------|
| Eng | 2026-06-09 |
| Security (automated FG-C matrix) | 2026-06-09 |
