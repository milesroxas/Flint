import type { PageRule, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: Every page should have a `page-wrapper` element.
 *
 * From the Client-First Quick Guide: "page-wrapper" is the outermost parent
 * of all elements on the page. It helps to copy/paste the entire page to a
 * different page or apply CSS styles to the entire page.
 */
export const createCFPageWrapperRequiredRule = (): PageRule => ({
  id: "cf:structure:page-wrapper-required",
  name: "Client-First: page-wrapper required",
  description: "Every page should have a page-wrapper element as the outermost parent of all page content.",
  example: "page-wrapper",
  type: "page",
  category: "structure",
  severity: "warning",
  enabled: true,

  analyzePage: ({ styles }): RuleResult[] => {
    const hasPageWrapper = styles.some((s) => s.name === "page-wrapper");

    if (hasPageWrapper) return [];

    return [
      {
        ruleId: "cf:structure:page-wrapper-required",
        name: "Client-First: page-wrapper required",
        message:
          'No "page-wrapper" element found on this page. Add a page-wrapper div as the outermost parent of all page content.',
        severity: "warning",
        className: "",
        elementId: undefined,
        isCombo: false,
        example: "page-wrapper",
      },
    ];
  },
});
