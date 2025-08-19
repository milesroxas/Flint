// src/features/linter/services/page-lint-service.ts
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { WebflowElement } from "@/entities/element/model/element.types";
import type { StyleWithElement } from "@/entities/style/model/style.types";
import type { RuleRunner } from "@/features/linter/services/rule-runner";
import type { LintContextService } from "@/features/linter/services/lint-context.service";

export type PageLintService = ReturnType<typeof createPageLintService>;

export function createPageLintService(deps: {
  contextService: LintContextService;
  ruleRunner: RuleRunner;
}) {
  const { contextService, ruleRunner } = deps;

  async function lintCurrentPage(
    elements: WebflowElement[]
  ): Promise<RuleResult[]> {
    // 1) Create shared context with caching
    const context = await contextService.createContext(elements);

    // 2) Collect all applied styles from context
    const allAppliedStyles: StyleWithElement[] = Array.from(
      context.elementStyleMap.values()
    ).flat();

    // 3) Run rules via runner (page and element rules are handled by the runner)
    const results = ruleRunner.runRulesOnStylesWithContext(
      allAppliedStyles,
      {},
      context.allStyles,
      context.rolesByElement,
      context.graph.getParentId,
      context.graph.getChildrenIds,
      context.graph.getAncestorIds,
      context.parseClass,
      { getTag: context.graph.getTag },
      (id: string) => context.tagByElementId.get(id) ?? null
    );

    return results;
  }

  return { lintCurrentPage } as const;
}
