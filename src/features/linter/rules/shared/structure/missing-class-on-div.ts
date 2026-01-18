import type { ElementAnalysisArgs, RuleResult, StructureRule } from "@/features/linter/model/rule.types";

/**
 * Shared structural rule: checks that all block elements have style classes assigned.
 * Ensures there are no unstyled block elements in the page structure.
 */
export const createMissingClassOnDivRule = (): StructureRule => ({
  id: "shared:structure:missing-class-on-div",
  name: "Block elements must have style classes",
  description:
    "All block elements should have at least one style class assigned. Unstyled blocks can indicate incomplete implementations or unnecessary elements.",
  example: "Add a style class to provide visual structure or remove empty blocks",
  category: "structure",
  type: "structure",
  severity: "warning",
  enabled: true,
  targetClassTypes: ["custom", "utility", "combo"],

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { elementId, classes, getElementType } = args;

    if (!elementId || !getElementType) return [];

    try {
      // Get the element type for this element
      const elementType = getElementType(elementId);

      // Only check Block elements (Webflow's equivalent to divs)
      if (elementType !== "Block") return [];

      // Check if element has any classes assigned
      if (!classes || classes.length === 0) {
        const violation: RuleResult = {
          ruleId: "shared:structure:missing-class-on-div",
          name: "Block elements must have style classes",
          message:
            "This block element has no style classes assigned. Consider adding styling or removing if unnecessary.",
          severity: "warning",
          elementId,
          className: "", // No class name since there are no classes
          isCombo: false,
          metadata: {
            elementType,
            reason: "no-classes-assigned",
            suggestion: "Add a style class or remove the element if it serves no purpose",
          },
        };

        return [violation];
      }

      // Element has classes, so it passes the rule
      return [];
    } catch (error) {
      console.error(`[shared:structure:missing-class-on-div] Error analyzing element ${elementId}:`, error);
      return [];
    }
  },
});
