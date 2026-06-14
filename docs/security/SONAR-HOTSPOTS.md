# SonarCloud security hotspots — OSS (`kioie_driftguard`)

Analysis scope: `src/` only (`sonar-project.properties`). Mark items **Safe** in [SonarCloud](https://sonarcloud.io/project/security_hotspots?id=kioie_driftguard) after review.

## Intentional (mark Safe)

| Area | File | Rationale |
|------|------|-----------|
| Hosted API key from env | `src/mcp/server.ts` | `DRIFTGUARD_API_KEY` is runtime env for Bearer auth to official hosted API — not a hardcoded secret. |
| Custom `DRIFTGUARD_API` redirect | `src/mcp/constants.ts` | Blocked unless `DRIFTGUARD_ALLOW_CUSTOM_API=1`; prevents MCP config exfiltration of API key. |
| `JSON.parse` on CLI/MCP inputs | `src/cli/check.ts`, `src/mcp/server.ts` | Offline tools; inputs are local JSON strings with error handling. |

## After PR merges

1. Open Security Hotspots for project `kioie_driftguard`.
2. Mark the above Safe with rationale from this doc.
3. Re-run failed PR check or push empty commit to refresh Sonar gate.

Cloud repo: `docs/security/SONAR-HOTSPOTS.md` in driftguard-cloud.
