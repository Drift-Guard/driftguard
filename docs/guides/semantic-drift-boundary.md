# Semantic drift — structural boundary

**Status:** Hosted Pro/Team (partial — value/enum classification pipeline; NL tool-metadata classification on roadmap). MGFA Dimension 3 — **policy-adjacent** change detection only.

**Related:** [drift management](./drift-management.md) · [hosted API — semantic drift](../reference/hosted-api.md#semantic-drift-proteam) · [SchemaSync](./schemasync-prompt-schema-alignment.md) · [Singapore MGFA product fit](../SINGAPORE-MGFA-PRODUCT-FIT.md)

DriftGuard classifies **contract-adjacent** changes on watched APIs and MCP tool catalogs. This guide draws a hard line between **structural** diff (shipped everywhere) and **semantic** classification (hosted only) — and what we **do not** claim.

---

## Two layers, one watch

| Layer | Question | Where | MGFA posture |
|-------|----------|-------|--------------|
| **Structural** | Did JSON shape, types, or required fields change? | OSS `compare_json` + hosted drift pipeline | Dim 3 — reproducible structural controls |
| **Semantic** | Did values or metadata **mean** something different while shape stayed valid? | Hosted Pro/Team only | Dim 3 — policy-adjacent detection; **not** SOP compliance |

Both layers feed the same incident lifecycle (`open` → `acknowledged` → `resolved`) and severity taxonomy (breaking / warning / info). Semantic findings are **additional signals** on top of structural diff — not a replacement.

```
  Baseline snapshot
        │
        ▼
  Structural diff (@driftguard/diff-core)
        │  breaking · warning · info
        ▼
  Semantic classifier (hosted Pro/Team)
        │  unit_suspect · enum_set_changed · distribution_shift · …
        ▼
  Drift event + webhook + console
```

---

## Structural diff (OSS + hosted)

**Structural** means schema inference and comparison — no natural-language interpretation.

| Surface | Examples |
|---------|----------|
| OSS `compare_json` | Removed field, type change, new required property |
| Hosted watches | Same engine on scheduled MCP `tools/list` and API polls |
| Gate packages | ToolChange manifest lint, MockDrift fixture replay |
| `explain_drift` | Remediation hints for **structural** breaking changes |

Structural diff does **not** detect:

- Tool descriptions that change meaning without schema edits
- Enum values repurposed while the enum field still validates
- Amount fields that shift units (cents vs dollars) with unchanged JSON types
- Prompt prose that no longer matches removed fields (use SchemaSync literal mode)

See [Reference — diff semantics](../reference/README.md#diff-semantics) and [diff-core](../../packages/diff-core/README.md).

---

## Semantic classification (hosted only)

**Semantic** drift catches **valid JSON** that operators may misread as unchanged — the case structural OpenAPI/schema diff alone misses.

| Signal class | Example | Typical severity |
|--------------|---------|------------------|
| `unit_suspect` | Numeric range shifts ~100× while field name unchanged | breaking |
| `enum_set_changed` | Enum members added/removed/repurposed | warning or breaking |
| `distribution_shift` | Value fingerprint moves (stable shape, shifted population) | warning |
| NL metadata shift | MCP tool `description` meaning changes without schema edit | warning (when enabled) |

Semantic classification uses hosted heuristics and (where configured) LLM-assisted comparison on **tool metadata text** — not on end-user conversations or internal SOP documents.

**Plan:** Pro and Team when feature is GA on your tenant. Until then, treat marketing previews on [driftguard.org](https://driftguard.org/features/drift-detection) as roadmap positioning — structural watches remain the production evidence spine.

---

## What semantic drift is not

DriftGuard semantic classification is **contract observability**, not governance certification.

| Claim | Reality |
|-------|---------|
| SOP / regulatory compliance | **Out of scope** — partner with GRC platforms |
| NL policy rule engines | **Out of scope** — we flag contract-adjacent shifts, not policy verdicts |
| Agent behavioural eval | **Different lane** — LangSmith-style evals cover task success, not manifest drift |
| Prompt injection / safety | **Different lane** — Lakera, Guardrails AI, etc. |
| MGFA certification | **Not provided** — we supply Dim 3 **technical control evidence**; buyers map to MGFA with their compliance team |

Do **not** use semantic drift alerts as proof that agents follow organisational SOPs, sector regulations, or human-oversight policies.

---

## MGFA Dimension 3 — policy-adjacent only

For Singapore [MGFA](https://www.imda.gov.sg/-/media/imda/files/about/emerging-tech-and-research/artificial-intelligence/mgf-for-agentic-ai.pdf) buyers:

| MGFA theme | DriftGuard semantic role |
|------------|--------------------------|
| Post-deploy monitoring | Surfaces metadata/value shifts on watched contracts |
| Change management | Same incident + ack trail as structural drift |
| Policy / SOP evaluation | **Partner territory** — see [partner list](../SINGAPORE-MGFA-PRODUCT-FIT.md#what-we-explicitly-will-not-build-partner-list) |

**Lead with structural evidence** (E1 continuous watches, E4 audit export, E11 ack trail) before foregrounding semantic classification in MGFA pitches. Semantic drift supplements the evidence pack — it does not replace it.

---

## Related products (do not conflate)

| Product | Lane | Blocking? |
|---------|------|-----------|
| **diff-core / `compare_json`** | Structural schema diff | OSS CI can block on breaking |
| **SchemaSync `literal`** | Prompt mentions removed field names | CI blocking (Gate 4A) |
| **SchemaSync `semantic-hints`** | Advisory paraphrase hints | Always exit 0 — not for MGFA blocking |
| **Hosted semantic drift** | Value/metadata meaning on watched contracts | Hosted severity + ack workflow |
| **MockDrift** | Pre-deploy structural fixture replay | CI blocking on assertions |

SchemaSync literal mode and hosted semantic drift both touch "NL" surfaces — but SchemaSync is **pre-deploy prompt lint** on your repo; hosted semantic drift is **post-deploy watch classification** on upstream contracts.

---

## Operator workflow

1. **Structural first** — review `breakingCount` / `changes[]` on drift events (console or `list_drift_events`).
2. **Semantic signals** — when present, appear as additional change rows or tags on the same event (e.g. `unit_suspect`, `enum_set_changed`).
3. **Triage** — correlate with deploys and dependency bumps; semantic warnings may warrant human review even when structural diff is additive-only.
4. **Acknowledge** — `acknowledge_drift` records review; pair with [webhook ack trail](../reference/webhooks-alerts.md#incident-acknowledgement-trail) for GRC ingest.
5. **Do not** file compliance attestations based on semantic classification alone.

---

## Evidence artifacts

| Artifact | Contains semantic? |
|----------|-------------------|
| `GET /api/drift` / `list_drift_events` | Structural `changes`; semantic tags when classifier fired |
| Drift export CSV/JSON | Same — see [hosted API](../reference/hosted-api.md#drift-history-and-audit-team) |
| Signed audit JSON | Structural + incident ack trail; semantic rows when present |
| OSS `compare_json` output | Structural only |

---

## Related

- [Drift management](./drift-management.md) — find → review → fix
- [Platform admin](./platform-admin.md) — watches and alerts
- [Assessment E13](../assessments/mgfa/E13-semantic-nl-drift-classification.md)
- Hosted buyer boundary (private): `driftguard-cloud/docs/compliance/SEMANTIC-DRIFT-BOUNDARY.md`

DriftGuard does **not** certify MGFA compliance. Semantic drift is **policy-adjacent change detection** on watched contracts — not NL policy or SOP evaluation.
