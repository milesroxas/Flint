import type { PageRule, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: Every page should include a `global-styles` element.
 *
 * From the Client-First Quick Guide: "Global Styles embed is the embed code
 * that comes with the Client-First cloneable and it has necessary code snippets
 * of the system. Global Styles embed component must be applied to every page
 * in the project."
 */
export const createCFGlobalStylesRequiredRule = (): PageRule => ({
  id: "cf:structure:global-styles-required",
  name: "Client-First: global-styles required",
  description: "Every page should include the global-styles component for project-wide custom CSS.",
  example: "global-styles",
  type: "page",
  category: "structure",
  severity: "suggestion",
  enabled: true,

  analyzePage: ({ styles }): RuleResult[] => {
    const hasGlobalStyles = styles.some((s) => s.name === "global-styles");

    if (hasGlobalStyles) return [];

    return [
      {
        ruleId: "cf:structure:global-styles-required",
        name: "Client-First: global-styles required",
        message:
          'No "global-styles" element found on this page. The Global Styles embed component should be applied to every page in the project.',
        severity: "suggestion",
        className: "",
        elementId: undefined,
        isCombo: false,
        example: "global-styles",
      },
    ];
  },
});
