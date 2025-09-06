// src/features/linter/rules/canonical/structure/main-singleton.page.ts
import type {
  PageRule,
  RuleResult,
  Severity,
} from "@/features/linter/model/rule.types";

export const createMainSingletonPageRule = (): PageRule => ({
  id: "canonical:main-singleton",
  name: "Exactly one main role per page", 
  description:
    "There must be one and only one element with role 'main' per page. Use your preset's main wrapper conventions (Client-First: main-wrapper, Lumos: page_main).",
  type: "page",
  category: "structure",
  severity: "error",
  enabled: true,

  analyzePage: ({ rolesByElement }): RuleResult[] => {
    const mains = Object.entries(rolesByElement).filter(
      ([, role]) => role === "main"
    );

    const results: RuleResult[] = [];

    // Check if we have exactly one main element
    if (mains.length === 0) {
      return [
        {
          ruleId: "canonical:main-singleton",
          name: "Exactly one main role per page",
          message: "No element with role 'main' detected. Add a main wrapper element following your preset conventions.",
          severity: "error" as Severity,
          className: "",
          isCombo: false,
        },
      ];
    }

    if (mains.length > 1) {
      // If multiple, flag all extras for clarity
      const [, ...extras] = mains;
      results.push(
        ...extras.map(([elementId]) => ({
          ruleId: "canonical:main-singleton",
          name: "Exactly one main role per page",
          message: "Multiple elements have role 'main'. Keep exactly one main wrapper per page.",
          severity: "error" as Severity,
          className: "",
          isCombo: false,
          elementId,
        }))
      );
    }

    // Note: Removed HTML tag validation since Webflow doesn't expose native tag names reliably
    // Main element detection is now handled by preset-specific detectors

    return results;
  },
});
