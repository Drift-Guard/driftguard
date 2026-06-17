import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatHarnessLintError,
  mgfaPhraseForHarnessLintError,
} from "./mgfa-phrases.js";

describe("harness lint MGFA phrase mapping", () => {
  it("maps missing bundle files to Dim 3 baselines", () => {
    assert.equal(
      mgfaPhraseForHarnessLintError("missing gates.yaml"),
      "Dim 3 — reproducible pre-deploy baselines",
    );
    assert.equal(
      mgfaPhraseForHarnessLintError("missing harness.lock"),
      "Dim 3 — reproducible pre-deploy baselines",
    );
  });

  it("maps agents.yaml errors to Dim 1 bound scope", () => {
    assert.equal(
      mgfaPhraseForHarnessLintError('agents.yaml: agent "x": unknown policy "y"'),
      "Dim 1 — bound tool scope (declared bindings)",
    );
  });

  it("maps manifest pins to Dim 3 change management themes", () => {
    assert.equal(
      mgfaPhraseForHarnessLintError("manifests.toolchange.manifest: path not found (x.json)"),
      "Dim 3 — change management (MCP tool manifest)",
    );
    assert.equal(
      mgfaPhraseForHarnessLintError("manifests.schemasync.prompts_dir: path not found (prompts/)"),
      "Dim 3 — instruction/tool consistency",
    );
  });

  it("appends MGFA tag in formatted errors", () => {
    const formatted = formatHarnessLintError("missing gates.yaml");
    assert.match(formatted, /\[MGFA: Dim 3 — reproducible pre-deploy baselines\]/);
  });

  it("leaves unmapped errors unchanged", () => {
    const raw = "unexpected internal error";
    assert.equal(formatHarnessLintError(raw), raw);
    assert.equal(mgfaPhraseForHarnessLintError(raw), null);
  });
});
