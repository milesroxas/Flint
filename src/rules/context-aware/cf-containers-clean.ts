import { createContextAwarePropertyRule } from "@/features/linter/utils/context-rule-helpers";
import type { PropertyRule, RuleResult } from "@/features/linter/model/rule.types";

export const cfContainersCleanRule: PropertyRule = createContextAwarePropertyRule({
  id: "cf-containers-clean",
  name: "Client-First: Containers Should Be Clean",
  description:
    "Do not apply spacing utilities (padding-/margin-/gap-) to container elements; move spacing to an inner wrapper.",
  example: "container-large padding-medium ➜ move padding-medium to a wrapper inside the container",
  context: "container",
  category: "semantics",
  severity: "warning",
  targetClassTypes: ["utility"],
  analyze: (className: string): RuleResult[] => {
    const issues: RuleResult[] = [];
    if (/^(padding|margin|gap|spacer)-/.test(className)) {
      issues.push({
        ruleId: "cf-containers-clean",
        name: "Client-First: Containers Should Be Clean",
        message:
          "Containers should not carry spacing utilities; apply spacing on an inner wrapper.",
        severity: "warning",
        className,
        isCombo: false,
      });
    }
    return issues;
  },
});


