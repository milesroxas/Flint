// src/features/linter/services/element-lint-service.ts
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { WebflowElement } from "@/entities/element/model/element.types";
import type { RuleRunner } from "@/features/linter/services/rule-runner";
import type {
  LintContextService,
  LintContext,
} from "@/features/linter/services/lint-context.service";
import { toElementKey } from "@/entities/element/lib/id";
import { createDebugger } from "@/shared/utils/debug";

export type ElementLintService = ReturnType<typeof createElementLintService>;

export function createElementLintService(deps: {
  contextService: LintContextService;
  ruleRunner: RuleRunner;
}) {
  const { contextService, ruleRunner } = deps;
  const debug = createDebugger("element-lint");

  async function lintElement(
    element: WebflowElement,
    pageContext?: LintContext,
    useStructuralContext: boolean = false
  ): Promise<RuleResult[]> {
    if (!element || typeof (element as any).getStyles !== "function") {
      const isComponentInstance =
        (element as any)?.type === "ComponentInstance" ||
        ((element as any)?.id?.component && (element as any)?.id?.element);
      if (!(useStructuralContext && isComponentInstance)) {
        debug.warn(
          "lintElement: element lacks getStyles and is not a component instance in structural mode",
          (element as any)?.type
        );
        return [];
      }
    }

    // 1) Create or reuse context with optional structural context
    const context = await contextService.createElementContextWithStructural(
      element,
      useStructuralContext,
      pageContext
    );

    // 2) Collect styles to analyze
    //    - Structural ON: analyze ALL styles in the section (like page lint but scoped)
    //    - Structural OFF: analyze only the selected element (original behavior)
    const elementId = toElementKey(element);
    const elementStyles = context.elementStyleMap.get(elementId) || [];
    let stylesToAnalyze:
      | typeof elementStyles
      | Array<(typeof elementStyles)[number]> = elementStyles;
    let rolesForRun = context.rolesByElement;

    if (useStructuralContext) {
      // When structural context is enabled, analyze ALL styles in the section
      // This makes it work like page lint but scoped to the component boundary
      stylesToAnalyze = Array.from(context.elementStyleMap.values()).flat();

      // Use all roles in the context (no restriction needed for section-scoped linting)
      rolesForRun = context.rolesByElement;

      debug.log(
        "lintElement: structural context analyzing",
        stylesToAnalyze.length,
        "styles across",
        Object.keys(rolesForRun).length,
        "elements"
      );
    } else {
      debug.log(
        "lintElement: standard context analyzing",
        elementStyles.length,
        "styles for",
        elementId
      );
    }

    // 3) Execute rules via the same runner API used by page scans
    //    Skip page rules when no page context is available
    const results = ruleRunner.runRulesOnStylesWithContext(
      stylesToAnalyze,
      {},
      context.allStyles,
      rolesForRun,
      context.graph.getParentId,
      context.graph.getChildrenIds,
      context.graph.getAncestorIds,
      context.parseClass,
      { getTag: context.graph.getTag },
      (id: string) => context.tagByElementId.get(id) ?? null,
      (id: string) => context.elementTypeByElementId.get(id) ?? null,
      !pageContext // Skip page rules when no page context available
    );

    debug.log("lintElement: rule results count", results.length);

    return results;
  }

  return { lintElement } as const;
}
