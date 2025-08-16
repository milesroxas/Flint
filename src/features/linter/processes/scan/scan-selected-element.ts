import type { RuleResult } from "@/features/linter/model/rule.types";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import { createElementLintService } from "@/features/linter/services/element-lint-service";
import type { ElementContext } from "@/entities/element/model/element-context.types";
import type { ElementRole } from "@/features/linter/model/linter.types";

export async function scanSelectedElement(element: any): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const { lintElement } = createElementLintService();
  return await lintElement(element);
}

export type SelectedElementMeta = {
  results: RuleResult[];
  classNames: string[];
  contexts: ElementContext[];
  roles: ElementRole[];
};

export async function scanSelectedElementWithMeta(
  element: any
): Promise<SelectedElementMeta> {
  ensureLinterInitialized();
  const { lintElementWithMeta } = createElementLintService();
  const { results, appliedClassNames, elementContextsMap, roles } =
    await lintElementWithMeta(element);
  const elKey =
    (element?.id && (element.id as any).element) ??
    element?.id ??
    element?.nodeId ??
    "";
  const contexts = elementContextsMap[elKey] || [];
  return { results, classNames: appliedClassNames, contexts, roles };
}
