// src/features/linter/rules/canonical/structure/main-singleton.page.ts
import type { PageRule, RuleResult } from "@/features/linter/model/rule.types";

export const createMainSingletonPageRule = (): PageRule => ({
  id: "canonical:main-singleton",
  name: "Exactly one main role per page",
  description: "There must be one and only one element with role 'main'.",
  type: "page",
  category: "structure",
  severity: "error",
  enabled: true,

  analyzePage: ({ rolesByElement }): RuleResult[] => {
    const mains = Object.entries(rolesByElement).filter(
      ([, role]) => role === "main"
    );
    if (mains.length === 1) return [];
    if (mains.length === 0) {
      return [
        {
          ruleId: "canonical:main-singleton",
          name: "Exactly one main role per page",
          message: "No element with role 'main' detected.",
          severity: "error",
          className: "",
          isCombo: false,
        },
      ];
    }
    // If multiple, flag all extras for clarity
    const [, ...extras] = mains;
    return extras.map(([elementId]) => ({
      ruleId: "canonical:main-singleton",
      name: "Exactly one main role per page",
      message: "Multiple elements have role 'main'. Keep exactly one.",
      severity: "error",
      className: "",
      isCombo: false,
      elementId,
    }));
  },
});
