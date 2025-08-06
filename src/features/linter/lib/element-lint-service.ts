import { StyleService } from "@/features/linter/lib/style-service";
import { UtilityClassAnalyzer } from "@/features/linter/lib/utility-class-analyzer";
import { RuleRunner } from "@/features/linter/lib/rule-runner";
import { ruleRegistry, initializeRuleRegistry } from "@/features/linter/lib/registry";
import type { RuleResult } from "@/features/linter/types/rule-types";

/**
 * Factory for creating an ElementLintService.
 * Handles per-element linting: initializes registry, gathers styles, and runs rules.
 */
export function createElementLintService() {
  let registryInitialized = false;

  // Instantiate dependencies once
  const styleService = new StyleService();
  const utilityAnalyzer = new UtilityClassAnalyzer();
  const ruleRunner = new RuleRunner(ruleRegistry, utilityAnalyzer);

  /**
   * Lints a single Webflow element by:
   * 1. Ensuring the rule registry is initialized
   * 2. Building property maps from all site styles
   * 3. Retrieving, sorting, and validating applied styles on the element
   */
  async function lintElement(element: any): Promise<RuleResult[]> {
    try {
      if (!registryInitialized) {
        initializeRuleRegistry();
        registryInitialized = true;
      }

      console.log("[ElementLintService] Starting element lint...");

      // 1. Fetch all styles and build analysis maps once
      const allStyles = await styleService.getAllStylesWithProperties();
      utilityAnalyzer.buildPropertyMaps(allStyles);

      // 2. Get styles applied to the element
      const appliedStyles = await styleService.getAppliedStyles(element);
      if (appliedStyles.length === 0) {
        console.log("[ElementLintService] No styles on element, returning default issue.");
        return [
          {
            ruleId: "no-styles-or-classes",
            name: "Element must have styles or classes",
            message: "This element has no styles or classes applied.",
            severity: "error",
            className: "",
            isCombo: false,
            example: "header_wrap, u-padding-32, is-active"
          }
        ];
      }

      // 3. Sort and lint
      const sorted = styleService.sortStylesByType(appliedStyles);
      const results = ruleRunner.runRulesOnStyles(sorted);

      console.log(
        `[ElementLintService] Lint completed with ${results.length} issue${results.length === 1 ? "" : "s"}.`
      );

      return results;
    } catch (err) {
      console.error("[ElementLintService] Error linting element:", err);
      return [];
    }
  }

  return { lintElement };
}
