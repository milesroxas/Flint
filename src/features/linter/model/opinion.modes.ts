import type { RuleRegistry } from "@/features/linter/services/rule-registry";

export type OpinionMode = "strict" | "balanced" | "lenient";

export function applyOpinionMode(
  ruleRegistry: RuleRegistry,
  mode: OpinionMode
): void {
  if (mode === "balanced") return;

  const promoteToError = (ruleId: string) => {
    const cfg = ruleRegistry.getRuleConfiguration(ruleId);
    if (!cfg) return;
    ruleRegistry.updateRuleConfiguration(ruleId, { severity: "error" });
  };

  const demoteToSuggestion = (ruleId: string) => {
    const cfg = ruleRegistry.getRuleConfiguration(ruleId);
    if (!cfg) return;
    ruleRegistry.updateRuleConfiguration(ruleId, { severity: "suggestion" });
  };

  if (mode === "strict") {
    // Promote format violations to errors
    const strictIds = [
      "lumos-utility-class-format",
      "lumos-combo-class-format",
    ];
    strictIds.forEach(promoteToError);
  }

  if (mode === "lenient") {
    // Demote structure rules to suggestions
    const lenientIds = ["canonical:childgroup-key-match"];
    lenientIds.forEach(demoteToSuggestion);
  }
}
