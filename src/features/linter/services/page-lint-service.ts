// src/features/linter/services/page-lint-service.ts
import { StyleService, StyleWithElement } from "@/entities/style/model/style.service";
import { RuleRunner } from "./rule-runner";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { createElementContextClassifier } from "@/entities/element/model/element-context-classifier";
import type { WebflowElement, ElementWithClassNames } from "@/entities/element/model/element-context.types";

export function createPageLintService(
  styleService: StyleService,
  ruleRunner: RuleRunner
) {
  const elementCtx = createElementContextClassifier({
    parentClassPatterns: [
      "section_contain",
      /^u-section/,
      /^c-/,
      // add any other container selectors here
    ],
  });

  async function lintCurrentPage(
    elements: WebflowElement[]
  ): Promise<RuleResult[]> {
    console.log("[PageLintService] Starting lint for current page…");

    // Filter to Designer elements that support getStyles()
    const validElements: WebflowElement[] = (elements || []).filter(
      (el: any) => el && typeof el.getStyles === "function"
    );

    // 1. Load every style definition (for rule context)
    const allStyles = await styleService.getAllStylesWithProperties();
    console.log(
      `[PageLintService] Loaded ${allStyles.length} style definitions for context.`
    );

    // 2. Get styles for each element, maintaining element association
    const elementStylePairs = await Promise.all(
      validElements.map(async (element) => {
        const styles = await styleService.getAppliedStyles(element);
        const elementKey =
          ((element as any)?.id && ((element as any).id as any).element) ??
          (element as any)?.id ??
          (element as any)?.nodeId ??
          "";
        return {
          elementId: String(elementKey),
          element,
          styles: styles.map(style => ({
            ...style,
            elementId: String(elementKey)
          })) as StyleWithElement[]
        };
      })
    );

    const allAppliedStyles: StyleWithElement[] = elementStylePairs
      .flatMap(pair => pair.styles);

    console.log(
      `[PageLintService] Collected ${allAppliedStyles.length} applied style instances on this page.`
    );

    // 3. Extract class names for each element (needed for context classification)
    const elementsWithClassNames: ElementWithClassNames[] = elementStylePairs.map(pair => ({
      element: pair.element,
      classNames: pair.styles.map(style => style.name).filter(name => name.trim() !== '')
    }));

    console.log(
      `[PageLintService] Extracted class names for ${elementsWithClassNames.length} elements.`
    );

    // 4. Classify elements into contexts using extracted class names
    const elementContexts = await elementCtx.classifyPageElements(elementsWithClassNames);

    // 5. Run rules with proper element-to-context mapping
    const results = ruleRunner.runRulesOnStylesWithContext(
      allAppliedStyles,
      elementContexts,
      allStyles
    );

    console.log(
      `[PageLintService] Lint complete. Found ${results.length} issue${
        results.length === 1 ? "" : "s"
      }.`
    );

    return results;
  }

  return { lintCurrentPage };
}