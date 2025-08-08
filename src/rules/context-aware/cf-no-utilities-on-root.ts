import { createContextAwarePropertyRule } from "@/features/linter/utils/context-rule-helpers";
import type { PropertyRule, RuleResult } from "@/features/linter/model/rule.types";

export const cfNoUtilitiesOnRootRule: PropertyRule = createContextAwarePropertyRule({
  id: "cf-no-utilities-on-root",
  name: "Client-First: No Utilities on Component Root",
  description: "Move utilities off the component root and into an inner wrapper.",
  example: "Root: feature-card, Inner: feature-card_content with padding-*",
  context: 'componentRoot',
  category: "performance",
  severity: "warning",
  targetClassTypes: ["utility"],
  analyze: (className, _properties) => {
    const results: RuleResult[] = [];
    if (className.includes("-")) {
      results.push({
        ruleId: "cf-no-utilities-on-root",
        name: "Client-First: No Utilities on Component Root",
        message: "Move utilities off the component root and into an inner wrapper.",
        severity: "warning",
        className,
        isCombo: false,
      });
    }
    return results;
  }
});


