// src/features/linter/services/page-lint-service.ts

import type { WebflowElement } from "@/entities/element/model/element.types";
import type { StyleWithElement } from "@/entities/style/model/style.types";
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { LintContextService } from "@/features/linter/services/lint-context.service";
import type { RuleRunner } from "@/features/linter/services/rule-runner";

export interface PageLintOptions {
  classFilter?: (name: string) => boolean;
}

export interface PageLintResult {
  results: RuleResult[];
  ignoredClassNames: string[];
}

export type PageLintService = ReturnType<typeof createPageLintService>;

export function createPageLintService(deps: { contextService: LintContextService; ruleRunner: RuleRunner }) {
  const { contextService, ruleRunner } = deps;

  async function lintCurrentPage(elements: WebflowElement[], options?: PageLintOptions): Promise<PageLintResult> {
    // 1) Create shared context with caching
    const context = await contextService.createContext(elements);

    // 2) Collect all applied styles from context
    let allAppliedStyles: StyleWithElement[] = Array.from(context.elementStyleMap.values()).flat();

    // 3) Apply third-party class filter before running rules
    const ignoredClassNames: string[] = [];
    const classFilter = options?.classFilter;
    if (classFilter) {
      const seen = new Set<string>();
      allAppliedStyles = allAppliedStyles.filter((s) => {
        if (!classFilter(s.name)) {
          if (!seen.has(s.name)) {
            seen.add(s.name);
            ignoredClassNames.push(s.name);
          }
          return false;
        }
        return true;
      });
    }

    // 4) Run rules via runner (page and element rules are handled by the runner)
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
      (id: string) => context.tagByElementId.get(id) ?? null,
      (id: string) => context.elementTypeByElementId.get(id) ?? null
    );

    return { results, ignoredClassNames };
  }

  return { lintCurrentPage } as const;
}
