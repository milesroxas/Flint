import { createComponentRootRule } from "@/features/linter/utils/context-rule-helpers";
import type { NamingRule, RuleResult } from "@/features/linter/model/rule.types";

export const cfInnerWrapperRecommendedRule: NamingRule = createComponentRootRule({
  id: "cf-inner-wrapper-recommended",
  name: "Client-First: Inner Wrapper Recommended",
  description: "Add an inner wrapper to hold spacing and layout utilities.",
  example: "feature-card (root) ➜ feature-card_wrap (inner)",
  category: "semantics",
  severity: "suggestion",
  test: () => true,
  evaluate: (className: string): RuleResult | null => {
    // Non-intrusive: just provide a general suggestion at component roots
    return {
      ruleId: "cf-inner-wrapper-recommended",
      name: "Client-First: Inner Wrapper Recommended",
      message:
        "Consider adding an inner wrapper (e.g., <type>_wrap) to carry spacing and layout utilities.",
      severity: "suggestion",
      className,
      isCombo: false,
    };
  },
});


