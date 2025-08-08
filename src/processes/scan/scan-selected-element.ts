import type { RuleResult } from "@/features/linter/model/rule.types";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import { createElementLintService } from "@/features/linter/services/element-lint-service";
// removed heavy imports; lint pass returns needed metadata
import type { ElementContext } from "@/entities/element/model/element-context.types";

declare const webflow: {
  getAllElements: () => Promise<WebflowElement[]>;
};

export async function scanSelectedElement(element: any): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const { lintElement } = createElementLintService();
  return lintElement(element);
}

export async function scanSelectedElementWithMeta(
  element: any
): Promise<{ results: RuleResult[]; classNames: string[]; contexts: ElementContext[] }> {
  ensureLinterInitialized();

  // Reuse lint pass metadata to avoid recomputation
  const { lintElementWithMeta } = createElementLintService();
  const { results, appliedClassNames, elementContextsMap } = await lintElementWithMeta(element);

  const elKey =
    (element?.id && (element.id as any).element) ??
    element?.id ??
    element?.nodeId ??
    "";
  const contexts = elementContextsMap[elKey] || [];

  return { results, classNames: appliedClassNames, contexts };
}


