import type {
  StructureRule,
  RuleResult,
  ElementAnalysisArgs,
} from "@/features/linter/model/rule.types";

/**
 * Shared structural rule: checks that all div elements have style classes assigned.
 * Ensures there are no unstyled div elements in the page structure.
 */
export const createMissingClassOnDivRule = (): StructureRule => ({
  id: "shared:structure:missing-class-on-div",
  name: "Div elements must have style classes",
  description:
    "All div elements should have at least one style class assigned. Unstyled divs can indicate incomplete implementations or unnecessary elements.",
  example: "Add a style class to provide visual structure or remove empty divs",
  category: "structure",
  type: "structure",
  severity: "warning",
  enabled: true,
  targetClassTypes: ["custom", "utility", "combo"],

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { elementId, classes, getTagName } = args;

    if (!elementId || !getTagName) return [];

    try {
      // Get the tag name for this element
      const tagName = getTagName(elementId);

      // Only check div elements
      if (tagName !== "div") return [];

      // Check if element has any classes assigned
      if (!classes || classes.length === 0) {
        const violation: RuleResult = {
          ruleId: "shared:structure:missing-class-on-div",
          name: "Div elements must have style classes",
          message:
            "This div element has no style classes assigned. Consider adding styling or removing if unnecessary.",
          severity: "warning",
          elementId,
          className: "", // No class name since there are no classes
          isCombo: false,
          metadata: {
            tagName,
            reason: "no-classes-assigned",
            suggestion:
              "Add a style class or remove the element if it serves no purpose",
          },
        };

        return [violation];
      }

      // Element has classes, so it passes the rule
      return [];
    } catch (error) {
      console.error(
        `[shared:structure:missing-class-on-div] Error analyzing element ${elementId}:`,
        error
      );
      return [];
    }
  },
});
