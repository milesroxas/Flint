// src/features/linter/services/element-lint-service.ts
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { WebflowElement } from "@/entities/element/model/element.types";
import type { RuleRunner } from "@/features/linter/services/rule-runner";
import type {
  LintContextService,
  LintContext,
} from "@/features/linter/services/lint-context.service";
import { toElementKey } from "@/entities/element/lib/id";

export type ElementLintService = ReturnType<typeof createElementLintService>;

export function createElementLintService(deps: {
  contextService: LintContextService;
  ruleRunner: RuleRunner;
}) {
  const { contextService, ruleRunner } = deps;

  async function lintElement(
    element: WebflowElement,
    pageContext?: LintContext
  ): Promise<RuleResult[]> {
    if (!element || typeof (element as any).getStyles !== "function") return [];

    // 1) Create or reuse context
    const context = await contextService.createElementContext(
      element,
      pageContext
    );

    // 2) Get styles for this specific element
    const elementId = toElementKey(element);
    const elementStyles = context.elementStyleMap.get(elementId) || [];

    // 3) Execute rules via the same runner API used by page scans
    //    Skip page rules when no page context is available
    const results = ruleRunner.runRulesOnStylesWithContext(
      elementStyles,
      {},
      context.allStyles,
      context.rolesByElement,
      context.graph.getParentId,
      context.graph.getChildrenIds,
      context.graph.getAncestorIds,
      context.parseClass,
      { getTag: context.graph.getTag },
      (id: string) => context.tagByElementId.get(id) ?? null,
      !pageContext // Skip page rules when no page context available
    );

    return results;
  }

  return { lintElement } as const;
}
