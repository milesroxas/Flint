import type { ElementAnalysisArgs, RuleResult, StructureRule } from "@/features/linter/model/rule.types";

/**
 * Client-First: Nav should be outside of main-wrapper.
 *
 * From the Client-First docs: "<nav> HTML tag is placed outside of the
 * main-wrapper since its content is not for page-specific content."
 *
 * This rule checks whether elements with a <nav> tag or a class containing
 * "nav" are descendants of the main-wrapper element (role: "main").
 */
export const createCFNavOutsideMainRule = (): StructureRule => ({
  id: "cf:structure:nav-outside-main",
  name: "Client-First: Nav outside main-wrapper",
  description: "Navigation elements should be placed outside of main-wrapper since nav content is not page-specific.",
  example: "Place <nav> as a sibling of main-wrapper, not inside it",
  type: "structure",
  category: "structure",
  severity: "warning",
  enabled: true,

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { elementId, classes, getTagName, getAncestorIds, getClassNamesForElement, getRoleForElement } = args;

    if (!elementId || !getTagName || !getAncestorIds) return [];

    // Check if this element is a nav element (by tag or class)
    const tagName = getTagName(elementId);
    const isNavByTag = tagName?.toLowerCase() === "nav";
    const isNavByClass = classes?.some((c) => /^nav(?:bar|igation)?(?:[_-]|$)/i.test(c.className));

    if (!isNavByTag && !isNavByClass) return [];

    // Check if any ancestor has the "main" role or "main-wrapper" class
    const ancestorIds = getAncestorIds(elementId);
    if (!ancestorIds || ancestorIds.length === 0) return [];

    let isInsideMain = false;

    for (const ancestorId of ancestorIds) {
      // Check role
      if (getRoleForElement) {
        const role = getRoleForElement(ancestorId);
        if (role === "main") {
          isInsideMain = true;
          break;
        }
      }

      // Check class name as fallback
      if (getClassNamesForElement) {
        const ancestorClasses = getClassNamesForElement(ancestorId);
        if (ancestorClasses?.includes("main-wrapper")) {
          isInsideMain = true;
          break;
        }
      }
    }

    if (!isInsideMain) return [];

    const navIdentifier = isNavByTag ? "<nav>" : (classes?.[0]?.className ?? "nav");

    return [
      {
        ruleId: "cf:structure:nav-outside-main",
        name: "Client-First: Nav outside main-wrapper",
        message: `Navigation element "${navIdentifier}" is inside main-wrapper. In Client-First, nav should be placed outside main-wrapper since it is not page-specific content.`,
        severity: "warning",
        className: classes?.[0]?.className ?? "",
        elementId,
        isCombo: false,
        metadata: {
          detectedBy: isNavByTag ? "tag" : "class",
          tagName: tagName ?? undefined,
        },
      },
    ];
  },
});
