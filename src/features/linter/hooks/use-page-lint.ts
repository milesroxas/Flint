import { StyleService } from "@/features/linter/lib/style-service";
import { RuleRunner } from "@/features/linter/lib/rule-runner";
import type { RuleResult } from "@/features/linter/types/rule-types";

/**
 * Factory for creating a PageLintService with injected dependencies.
 * This service lints styles used on the current page, utilizing site-wide style definitions
 * for context and rule evaluation.
 *
 * @param styleService  - Service to fetch style definitions and applied styles
 * @param ruleRunner    - Engine to execute lint rules against given styles
 */
export function createPageLintService(
  styleService: StyleService,
  ruleRunner: RuleRunner
) {
  /**
   * Perform a lint scan on the current page's styles.
   * It uses all style definitions from the site to evaluate rules, but only runs
   * the rules against styles actually applied on this page.
   *
   * @param elements - Array of Webflow elements from the current page
   * @returns Array of lint rule violations and suggestions
   */
  async function lintCurrentPage(
    elements: any[]
  ): Promise<RuleResult[]> {
    console.log("[PageLintService] Starting lint for current page...");

    // 1. Load site-wide style definitions for context
    const allStyles = await styleService.getAllStylesWithProperties();
    console.log(
      `[PageLintService] Loaded ${allStyles.length} style definitions for context.`
    );

    // 2. Gather applied styles from all page elements
    const nested = await Promise.all(
      elements.map((el) => styleService.getAppliedStyles(el))
    );
    const appliedStyles = nested.flat();
    console.log(
      `[PageLintService] Collected ${appliedStyles.length} applied style instances on this page.`
    );

    // 3. Deduplicate and sort styles, then execute rules
    const results = ruleRunner.runRulesOnStyles(appliedStyles);
    console.log(
      `[PageLintService] Lint complete. Found ${results.length} issue${
        results.length === 1 ? "" : "s"
      }.`
    );

    return results;
  }

  return { lintCurrentPage };
}
