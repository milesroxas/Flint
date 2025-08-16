import { createContextAwarePropertyRule } from "@/features/linter/utils/context-rule-helpers";
import type { PropertyRule, RuleResult } from "@/features/linter/model/rule.types";

export const cfNoPaddingOnInnerRule: PropertyRule = createContextAwarePropertyRule({
  id: "cf-no-padding-on-inner",
  name: "Client-First: Avoid Padding Utilities on Inner Elements",
  description:
    "Use custom classes for inner padding; avoid padding-* on nested elements.",
  example: "card_content padding-small ➜ move padding to card_content class",
  context: "childGroup",
  category: "format",
  severity: "suggestion",
  targetClassTypes: ["utility"],
  analyze: (className: string): RuleResult[] => {
    const violations: RuleResult[] = [];
    const name = className.startsWith('u-') ? className.slice(2) : className;
    if (name.startsWith("padding-")) {
      violations.push({
        ruleId: "cf-no-padding-on-inner",
        name: "Client-First: Avoid Padding Utilities on Inner Elements",
        message:
          "Avoid padding-* utilities on inner elements; use a custom class instead.",
        severity: "suggestion",
        className,
        isCombo: false,
      });
    }
    return violations;
  },
});


