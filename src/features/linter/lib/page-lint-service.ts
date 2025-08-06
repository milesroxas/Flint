import { StyleService } from "./style-service";
import { RuleRunner } from "./rule-runner";
import type { RuleResult } from "../types/rule-types";

/**
 * Factory for creating a PageLintService with injected dependencies.
 * @param styleService - Responsible for fetching styles with properties.
 * @param ruleRunner - Executes lint rules against provided styles.
 */
export function createPageLintService(
  styleService: StyleService,
  ruleRunner: RuleRunner
) {
  /**
   * Runs all configured lint rules against every style on the Webflow site.
   * @returns Array of lint rule results found site-wide.
   */
  async function lintEntirePage(): Promise<RuleResult[]> {
    console.log("[PageLintService] Starting site-wide lint scan...");

    // 1. Fetch all named styles and their properties
    const styles = await styleService.getAllStylesWithProperties();
    console.log(
      `[PageLintService] Retrieved ${styles.length} style${styles.length === 1 ? "" : "s"} with properties.`
    );

    // 2. Execute lint rules on the collected styles
    const results = ruleRunner.runRulesOnStyles(styles);
    console.log(
      `[PageLintService] Lint complete. Found ${results.length} issue${results.length === 1 ? "" : "s"}.`
    );

    return results;
  }

  return { lintEntirePage };
}
