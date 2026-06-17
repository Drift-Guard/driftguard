# SchemaSync — prompt ↔ schema alignment

**Status:** OSS Gate 4A (partial). MGFA Dimension 3 — instruction/tool consistency.

**Related:** [gate ladder — Gate 4A](../policies/gate-ladder.md) · [packages/schemasync](../../packages/schemasync/README.md) · [Singapore checklist](./singapore-agent-deployment-checklist.md)

SchemaSync answers: *do agent prompts still mention schema fields that were removed?* It does **not** evaluate NL policy compliance, SOP adherence, or semantic tool intent beyond literal word matches.

---

## Prompt discipline

Teams that couple NL system prompts to MCP tool schemas need three committed artifacts:

| File / dir | Role |
|------------|------|
| `prompts/` (or `*.prompt.md`) | Agent system prompts and tool-use instructions |
| `schemasync/removed-fields.txt` | Fields removed from tool schemas (one per line) |
| `schemasync.synonyms.yaml` | Optional paraphrase map for known aliases |

Workflow:

1. ToolChange (or `compare_json`) flags removed fields in a PR.
2. Append removed field names to `schemasync/removed-fields.txt`.
3. Update prompts to drop references — or document intentional synonyms in `schemasync.synonyms.yaml`.
4. CI runs `schemasync lint-nl --mode literal` on each prompt file.

Pair with [ToolChange change management](./toolchange-change-management.md) so manifest removals drive the removed-fields list.

---

## Literal blocking vs semantic-hints advisory

| Mode | CI behavior | Use when |
|------|-------------|----------|
| `literal` (default) | **Blocking** — exit 1 on word-boundary match | PR gate after prompt/schema coupling is established |
| `literal --advisory` | Report errors, exit 0 | Bootstrap while tuning synonyms |
| `semantic-hints` | **Always exit 0** — prints `HINT:` lines only | Draft PR review; not for MGFA blocking claims |

Literal mode matches removed field names as whole words (case-insensitive). Known false positives (e.g. prose word `stripe` vs field `stripe`) are documented in SS-N04 — maintain synonyms or edit prompts; do not enable semantic blocking in CI.

```bash
# Blocking (default)
schemasync lint-nl --mode literal \
  --prompt-file prompts/checkout-agent.txt \
  --removed "$(paste -sd, schemasync/removed-fields.txt)" \
  --synonyms schemasync/schemasync.synonyms.yaml

# Advisory bootstrap
schemasync lint-nl --mode literal --advisory --prompt-file prompts/foo.txt --removed old_field

# Human review only — never fails CI
schemasync lint-nl --mode semantic-hints --prompt-file prompts/foo.txt --removed old_field
```

---

## Advisory → blocking adoption

| Surface | Default today | MGFA buyer path |
|---------|---------------|-----------------|
| `schemasync lint-nl --mode literal` | **Blocking** (exit 1) | Use as-is in CI |
| GitHub workflow template | **Blocking** | [examples/workflows/schemasync.yml](../../examples/workflows/schemasync.yml) |
| Harness `gates.yaml` | **Advisory** in [MGFA profile](../../examples/harness-mgfa/.driftguard/gates.yaml) | Set `schemasync.advisory: false` when prompts + removed-fields list are committed |

Start advisory in harness bundles while bootstrapping prompt paths; flip to blocking once SS-N01–N05 pass in your repo.

```yaml
# .driftguard/gates.yaml — after prompt discipline is in place
gates:
  schemasync:
    enabled: true
    advisory: false
```

`semantic-hints` remains advisory regardless of harness `advisory` flag.

---

## Harness bundle baseline pinning

Pin prompt paths in `harness.lock` so portable bundles document the canonical SchemaSync inputs:

```yaml
manifests:
  schemasync:
    prompts_dir: prompts
    removed_fields: schemasync/removed-fields.txt
    synonyms: schemasync/schemasync.synonyms.yaml
packages:
  schemasync: "0.1.x"
```

`driftguard lint-harness` validates paths exist. Example: [examples/harness-mgfa/.driftguard/harness.lock](../../examples/harness-mgfa/.driftguard/harness.lock).

---

## What lint checks (SS-N01–N05)

| Test ID | Scenario | Literal result |
|---------|----------|----------------|
| SS-N01 | Prompt mentions removed field | error |
| SS-N02 | Paraphrase without synonyms map | pass |
| SS-N03 | Paraphrase + synonyms map | error |
| SS-N04 | Prose homonym (e.g. `stripe`) | error (known FP — document or synonym) |
| SS-N05 | `semantic-hints` mode | hints only, exit 0 |

---

## MGFA evidence artifact

CI stdout from `schemasync lint-nl --mode literal` is the **instruction/tool consistency artifact** for Dimension 3 pre-deploy controls. Pair with:

- **E3** — ToolChange manifest lint for structural field removals
- **E2** — `drift-diff` / CI harness for JSON schema drift
- **E22** — harness bundle orchestration across gates

DriftGuard does **not** certify MGFA compliance. SchemaSync is **literal structural alignment** — not NL policy evaluation.

---

## Hosted complement (Gate 4B)

Draft-PR prompt updates on schema drift: hosted GitHub App (`schemasync_repo`) — see [E19 assessment](../assessments/mgfa/E19-schemasync-github-app.md). OSS literal lint is the interim gate until 4B ships.
