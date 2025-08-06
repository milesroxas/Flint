// src/features/linter/services/page-lint-service.ts
import { StyleService } from "./style-service";
import { RuleRunner }     from "./rule-runner";
import type { RuleResult } from "../types/rule-types";

/**
 * Factory for creating a PageLintService with injected dependencies.
 * @param styleService – fetches site definitions + applied styles
 * @param ruleRunner   – applies lint rules to a list of styles
 */
export function createPageLintService(
  styleService: StyleService,
  ruleRunner: RuleRunner
) {
  /**
   * Lints only the current page’s elements, using site-wide styles for rule context.
   * @param elements – all Webflow elements on the current page
   */
  async function lintCurrentPage(elements: any[]): Promise<RuleResult[]> {
    console.log("[PageLintService] Starting lint for current page…");

    // 1. Load every style definition (for context in rules)
    const allStyles = await styleService.getAllStylesWithProperties();
    console.log(
      `[PageLintService] Loaded ${allStyles.length} style definitions for context.`
    );

    // 2. Pull only the styles actually applied on this page
    const nested = await Promise.all(
      elements.map((el) => styleService.getAppliedStyles(el))
    );
    const appliedStyles = nested.flat();
    console.log(
      `[PageLintService] Collected ${appliedStyles.length} applied style instances on this page.`
    );

    // 3. Run your rules
    const results = ruleRunner.runRulesOnStyles(appliedStyles);
    console.log(
      `[PageLintService] Lint complete. Found ${results.length} issue${results.length === 1 ? "" : "s"}.`
    );

    return results;
  }

  return { lintCurrentPage };
}
