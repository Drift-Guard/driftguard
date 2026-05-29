# Show HN Draft — for your approval

**Title:** Show HN: DriftGuard – Monitor API and MCP schema changes (post-Optic)

**URL:** https://github.com/kioie/driftguard

**Body:**

Hi HN,

Optic shut down last month, and I kept seeing the same problem in MCP/agent projects: third-party APIs and MCP tools change their schemas silently, and you only find out when production breaks.

I built DriftGuard to fix this:

- Monitors REST API responses AND MCP server tool schemas
- Classifies changes as breaking / warning / info
- Ships as an MCP server (your Cursor agent can register watches itself)
- Open core — self-host free, pay for hosted monitoring

Example: if Stripe removes a field from a webhook payload, or an MCP tool adds a required parameter, you get a webhook alert before your integration fails.

Free tier: 3 watches, daily checks. Pro: $19/mo for 25 watches with hourly checks.

GitHub: https://github.com/kioie/driftguard

Would love feedback on:
1. Is MCP tool monitoring a pain point you're hitting?
2. What would make you pay vs self-host?

Happy to answer questions about the diff engine or the post-Optic landscape.

---

**Best time to post:** Tuesday–Thursday, 8–9am US Eastern
