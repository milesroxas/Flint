import type {
  PropertyRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

// Role-gated element-level rule: flags any u-* on componentRoot
export const cfNoUtilitiesOnRootRule: PropertyRule = {
  id: "cf-no-utilities-on-root",
  name: "Client-First: No Utilities on Component Root",
  description:
    "Move utilities off the component root and into an inner wrapper.",
  example: "Root: feature-card, Inner: feature-card_content with padding-*",
  type: "property",
  category: "performance",
  severity: "warning",
  enabled: true,
  targetClassTypes: ["utility"],
  analyze: () => [],
  analyzeElement: ({ classes, getRoleForElement }) => {
    const results: RuleResult[] = [];
    const elementId = classes[0]?.elementId;
    if (!elementId || typeof getRoleForElement !== "function") return results;
    if (getRoleForElement(elementId) !== "componentRoot") return results;

    for (const cls of classes) {
      if (cls.className?.startsWith("u-")) {
        results.push({
          ruleId: "cf-no-utilities-on-root",
          name: "Client-First: No Utilities on Component Root",
          message:
            "Move utilities off the component root and into an inner wrapper.",
          severity: "warning",
          className: cls.className,
          isCombo: Boolean(cls.isCombo),
        });
      }
    }
    return results;
  },
};
