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
    pageContext?: LintContext,
    useStructuralContext: boolean = false
  ): Promise<RuleResult[]> {
    if (!element || typeof (element as any).getStyles !== "function") return [];

    // 1) Create or reuse context with optional structural context
    const context = await contextService.createElementContextWithStructural(
      element,
      useStructuralContext,
      pageContext
    );

    // 2) Collect styles to analyze
    //    - Structural ON: analyze target + its structural context (children, etc.)
    //    - Structural OFF: analyze only the selected element (original behavior)
    const elementId = toElementKey(element);
    const elementStyles = context.elementStyleMap.get(elementId) || [];
    let stylesToAnalyze:
      | typeof elementStyles
      | Array<(typeof elementStyles)[number]> = elementStyles;
    let rolesForRun = context.rolesByElement;

    if (useStructuralContext) {
      // Collect all descendants via graph API and include the element itself
      let descendantIds: string[] = [];
      const hasGetDesc =
        typeof (context.graph as any).getDescendantIds === "function";
      if (hasGetDesc) {
        descendantIds = [
          elementId,
          ...((context.graph as any).getDescendantIds(elementId) || []),
        ];
      } else {
        // Fallback BFS using getChildrenIds
        const visited = new Set<string>();
        const queue: string[] = [elementId];
        while (queue.length > 0) {
          const currentId = queue.shift() as string;
          if (visited.has(currentId)) continue;
          visited.add(currentId);
          descendantIds.push(currentId);
          const children = context.graph.getChildrenIds(currentId) || [];
          for (const childId of children)
            if (!visited.has(childId)) queue.push(childId);
        }
      }

      // Gather styles for target + descendants only
      const collected: (typeof elementStyles)[number][] = [];
      for (const id of descendantIds) {
        const styles = context.elementStyleMap.get(id);
        if (styles && styles.length > 0) collected.push(...styles);
      }
      stylesToAnalyze =
        collected.length > 0
          ? collected
          : Array.from(context.elementStyleMap.values()).flat();

      // Also include ancestors of each collected element so structural rules can resolve roles
      const includeIds = new Set<string>(descendantIds);
      for (const id of descendantIds) {
        const ancestors = context.graph.getAncestorIds(id) || [];
        for (const anc of ancestors) includeIds.add(anc);
      }

      // Restrict roles map to only included ids (descendants + ancestors)
      const limitedRoles: Record<string, (typeof rolesForRun)[string]> =
        {} as any;
      for (const [id, role] of Object.entries(context.rolesByElement)) {
        if (includeIds.has(id)) limitedRoles[id] = role;
      }
      rolesForRun = limitedRoles;
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

    return results;
  }

  return { lintElement } as const;
}
