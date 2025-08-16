import { createContextAwarePropertyRule } from "@/features/linter/utils/context-rule-helpers";
import type { PropertyRule, RuleResult } from "@/features/linter/model/rule.types";

export const componentRootNoDisplayUtilities: PropertyRule = createContextAwarePropertyRule({
  id: "component-root-no-display-utilities",
  name: "No Display Utilities on Component Roots",
  description: "Component root elements should not use display utility classes",
  example: "Avoid: u-flex, u-block, u-none on component roots",
  context: 'componentRoot',
  category: "performance",
  severity: "warning",
  targetClassTypes: ["utility"],
  analyze: (className, properties) => {
    const results: RuleResult[] = [];
    if (className.startsWith('u-') && properties.display) {
      results.push({
        ruleId: "component-root-no-display-utilities",
        name: "No Display Utilities on Component Roots",
        message: `Component root element should not use display utility '${className}'. Consider using custom CSS or applying to child elements.`,
        severity: "warning",
        className,
        isCombo: false,
        example: "Move display utilities to child elements"
      });
    }
    return results;
  }
});


