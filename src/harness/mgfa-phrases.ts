/**
 * Map harness lint errors to MGFA control phrases for buyer-facing CI logs.
 * Not certification — structural evidence hooks per singapore-agent-deployment-checklist.md.
 */

const RULES: ReadonlyArray<{ test: (error: string) => boolean; phrase: string }> = [
  {
    test: (e) => e === "missing gates.yaml" || e.startsWith("gates.yaml:"),
    phrase: "Dim 3 — reproducible pre-deploy baselines",
  },
  {
    test: (e) => e === "missing harness.lock" || e.startsWith("harness.lock:"),
    phrase: "Dim 3 — reproducible pre-deploy baselines",
  },
  {
    test: (e) => e.startsWith("agents.yaml:"),
    phrase: "Dim 1 — bound tool scope (declared bindings)",
  },
  {
    test: (e) => e.startsWith("fixture "),
    phrase: "Dim 3 — pre-deployment safety testing",
  },
  {
    test: (e) => e.startsWith("manifests.toolchange"),
    phrase: "Dim 3 — change management (MCP tool manifest)",
  },
  {
    test: (e) => e.startsWith("manifests.schemasync"),
    phrase: "Dim 3 — instruction/tool consistency",
  },
  {
    test: (e) => e.startsWith("defaults.failure_profile"),
    phrase: "Dim 3 — pre-deployment safety testing",
  },
];

export function mgfaPhraseForHarnessLintError(error: string): string | null {
  for (const rule of RULES) {
    if (rule.test(error)) return rule.phrase;
  }
  return null;
}

export function formatHarnessLintError(error: string): string {
  const phrase = mgfaPhraseForHarnessLintError(error);
  return phrase ? `${error} [MGFA: ${phrase}]` : error;
}
