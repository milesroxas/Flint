// src/features/linter/services/page-lint-service.ts

import {
  enrichSiteComponentNamesForDefinitions,
  fetchSiteComponentNameById,
} from "@/entities/component/services/component-catalog.service";
import type { WebflowElement } from "@/entities/element/model/element.types";
import type { StyleWithElement } from "@/entities/style/model/style.types";
import { getIsEditingComponentDefinition } from "@/features/linter/lib/webflow-component-definition-edit-mode";
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { LintContextService } from "@/features/linter/services/lint-context.service";
import type { RuleRunner } from "@/features/linter/services/rule-runner";

export interface PageLintOptions {
  classFilter?: (name: string) => boolean;
  mergedIgnoredLintClasses?: ReadonlySet<string>;
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
    const filteredElementIds = new Set<string>();
    const classFilter = options?.classFilter;
    if (classFilter) {
      const beforeFilterIds = new Set(allAppliedStyles.map((s) => s.elementId));
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
      const afterFilterIds = new Set(allAppliedStyles.map((s) => s.elementId));
      for (const id of beforeFilterIds) {
        if (!afterFilterIds.has(id)) filteredElementIds.add(id);
      }
    }

    // 4) Site component catalog (Designer getAllComponents) + per-definition fill via getComponent(id)
    const siteComponentNameById = await enrichSiteComponentNamesForDefinitions(
      await fetchSiteComponentNameById(),
      context.componentIdByElementId.values()
    );

    const isEditingComponentDefinition = await getIsEditingComponentDefinition();

    // 5) Run rules via runner (page and element rules are handled by the runner)
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
      (id: string) => context.elementTypeByElementId.get(id) ?? null,
      false,
      context.grammarElementSeparator,
      filteredElementIds,
      siteComponentNameById,
      context.componentIdByElementId,
      context.placedComponentSubtreeElementIds,
      isEditingComponentDefinition,
      context.variableNameById,
      options?.mergedIgnoredLintClasses
    );

    return { results, ignoredClassNames };
  }

  return { lintCurrentPage } as const;
}
