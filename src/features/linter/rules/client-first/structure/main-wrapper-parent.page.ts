import { isPageWrapperClass } from "@/features/linter/grammar/client-first.grammar";
import type { PageRule, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: `main-wrapper` should be a direct child of `page-wrapper`.
 *
 * From the Client-First Quick Guide, the page structure hierarchy is:
 *   page-wrapper → main-wrapper → section_[identifier] → ...
 */
export const createCFMainWrapperParentRule = (): PageRule => ({
  id: "cf:structure:main-wrapper-parent",
  name: "Client-First: main-wrapper inside page-wrapper",
  description: "The main-wrapper element should be a direct child of page-wrapper.",
  example: "page-wrapper > main-wrapper",
  type: "page",
  category: "structure",
  severity: "warning",
  enabled: true,

  analyzePage: ({ styles, rolesByElement, graph }): RuleResult[] => {
    // Find main-wrapper element by role
    const mainEntry = Object.entries(rolesByElement).find(([, role]) => role === "main");
    if (!mainEntry) return []; // No main-wrapper found — other rules handle that case

    const [mainElementId] = mainEntry;

    // Find parent of main-wrapper
    const parentId = graph.getParentId(mainElementId);
    if (!parentId) {
      return [
        {
          ruleId: "cf:structure:main-wrapper-parent",
          name: "Client-First: main-wrapper inside page-wrapper",
          message: '"main-wrapper" has no parent element. It should be a direct child of "page-wrapper".',
          severity: "warning",
          className: "main-wrapper",
          elementId: mainElementId,
          isCombo: false,
          example: "page-wrapper > main-wrapper",
        },
      ];
    }

    // Check if parent has the page-wrapper class
    const parentClasses = styles.filter((s) => s.elementId === parentId).map((s) => s.name);
    const parentIsPageWrapper = parentClasses.some(isPageWrapperClass);

    if (parentIsPageWrapper) return [];

    return [
      {
        ruleId: "cf:structure:main-wrapper-parent",
        name: "Client-First: main-wrapper inside page-wrapper",
        message: '"main-wrapper" should be a direct child of "page-wrapper". Move it inside the page-wrapper element.',
        severity: "warning",
        className: "main-wrapper",
        elementId: mainElementId,
        isCombo: false,
        example: "page-wrapper > main-wrapper",
      },
    ];
  },
});
