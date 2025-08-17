import type {
  NamingRule,
  RuleResult,
} from "@/features/linter/model/rule.types";
import { validateComponentRootNaming } from "@/features/linter/utils/naming-validators";

// Role-gated element-level naming suggestion for componentRoot
export const componentRootSemanticNaming: NamingRule = {
  id: "component-root-semantic-naming",
  name: "Component Root Semantic Naming",
  description:
    "Name component roots with a type and descriptive element token.",
  example: "header_wrap, navigation_wrap, card_wrap",
  type: "naming",
  category: "semantics",
  severity: "suggestion",
  enabled: true,
  targetClassTypes: ["custom", "combo", "utility"],
  test: () => true,
  // Disable class-level evaluate path; emit from analyzeElement only
  evaluate: () => null,
  analyzeElement: ({ classes, getRoleForElement }) => {
    const elementId = classes[0]?.elementId;
    if (!elementId || typeof getRoleForElement !== "function") return [];
    if (getRoleForElement(elementId) !== "componentRoot") return [];

    // Suggest on the base custom class only
    const base =
      classes.find((c) => !c.isCombo)?.className || classes[0]?.className || "";
    if (!base || validateComponentRootNaming(base)) return [];

    const result: RuleResult = {
      ruleId: "component-root-semantic-naming",
      name: "Component Root Semantic Naming",
      message:
        "Name component roots with a type and descriptive element token (e.g., header_wrap, hero_wrap).",
      severity: "suggestion",
      className: base,
      isCombo: false,
    };
    return [result];
  },
};
