import { createStyleService } from "@/features/linter/services/style-service";
import { createUtilityClassAnalyzer } from "@/features/linter/services/utility-class-analyzer";
import { createRuleRunner } from "@/features/linter/services/rule-runner";
import { ruleRegistry, initializeRuleRegistry } from "@/features/linter/services/registry";
import type { RuleResult } from "@/features/linter/types/rule-types";
import type { StyleWithElement } from "@/features/linter/services/style-service";
import { createElementContextClassifier } from "./element-context-classifier";
import type { WebflowElement, ElementWithClassNames } from "../types/element-context";

// Declare webflow global
declare const webflow: {
  getAllElements: () => Promise<any[]>;
};

/**
 * Factory for creating an ElementLintService.
 * Handles per-element linting: initializes registry, gathers styles, and runs rules.
 */
export function createElementLintService() {
  let registryInitialized = false;

  // Instantiate dependencies once
  const styleService = createStyleService();
  const utilityAnalyzer = createUtilityClassAnalyzer();
  const ruleRunner = createRuleRunner(ruleRegistry, utilityAnalyzer);
  const elementCtx = createElementContextClassifier();

  /**
   * Lints a single Webflow element by:
   * 1. Ensuring the rule registry is initialized
   * 2. Building property maps from all site styles
   * 3. Retrieving, sorting, and validating applied styles on the element
   */
  async function lintElement(element: any): Promise<RuleResult[]> {
    try {
      // Check if element is valid and has required methods
      if (!element || typeof element.getStyles !== 'function') {
        console.error("[ElementLintService] Invalid element or missing getStyles method:", element);
        return [];
      }

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

      // 3. Sort styles and convert to StyleWithElement format
      const sorted = styleService.sortStylesByType(appliedStyles);
      const elementId = element?.id || element?.nodeId || '';
      
      const stylesWithElement: StyleWithElement[] = sorted.map(style => ({
        ...style,
        elementId
      }));

      // 4. Classify element context
      // Get all elements to build parent map (needed for context classification)
      const allElements = await webflow.getAllElements();
      
      // Filter out elements that don't have getStyles method
      const validElements = allElements.filter(el => 
        el && typeof el.getStyles === 'function'
      );
      
      console.log(`[ElementLintService] Found ${allElements.length} total elements, ${validElements.length} valid elements`);
      
      const allElementsWithClassNames: ElementWithClassNames[] = await Promise.all(
        validElements.map(async (el) => {
          const styles = await styleService.getAppliedStyles(el);
          return {
            element: el as WebflowElement,
            classNames: styles.map(style => style.name).filter(name => name.trim() !== '')
          };
        })
      );
      
      const elementContextsMap = await elementCtx.classifyPageElements(allElementsWithClassNames);

      console.log("[ElementLintService] Element contexts map:", elementContextsMap);
      console.log("[ElementLintService] Current element ID:", elementId);
      console.log("[ElementLintService] Current element contexts:", elementContextsMap[elementId]);

      // 5. Run rules with proper element context
      const results = ruleRunner.runRulesOnStylesWithContext(
        stylesWithElement, 
        elementContextsMap, 
        allStyles
      );

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