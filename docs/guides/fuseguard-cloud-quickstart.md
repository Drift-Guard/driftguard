# FuseGuard Cloud quickstart

Connect a local FuseGuard daemon to [DriftGuard](https://driftguard.org) for fleet policy, activity, and drift preflight.

## 1. Install (OSS)

```bash
pip install -e packages/fuseguard
```

## 2. Get an API key

Sign up at [driftguard.org/start](https://driftguard.org/start) and create an API key in the console.

## 3. Enroll a device

In the console **Agent Protection → Fuse** tab, generate an enrollment token, then:

```bash
export DRIFTGUARD_API_KEY=dg_...
fuseguard device enroll --token fget_...
```

This writes `~/.fuseguard/device.json` with a device credential.

## 4. Start the daemon

```bash
export FUSEGUARD_POLICY_PATH=~/.fuseguard/policy.bundle.json
fuseguard daemon start --port 9477
```

Point Cursor MCP at `http://127.0.0.1:9477` (see [fuseguard-cursor-connect](./fuseguard-cursor-connect.md)).

## 5. Verify in console

Within ~60s of a block, the **Fuse → Activity** feed shows an index row (trip id, reason, device — no raw args).

## Related

- [FuseGuard overview](./fuseguard.md)
- Hosted API index: [driftguard.org/docs/api](https://driftguard.org/docs/api)
