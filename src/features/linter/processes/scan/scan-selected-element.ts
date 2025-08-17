import type { RuleResult } from "@/features/linter/model/rule.types";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import { createElementLintService } from "@/features/linter/services/element-lint-service";
import type { ElementRole } from "@/features/linter/model/linter.types";

export async function scanSelectedElement(element: any): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const { lintElement } = createElementLintService();
  return await lintElement(element);
}

export type SelectedElementMeta = {
  results: RuleResult[];
  classNames: string[];
  roles: ElementRole[];
};

export async function scanSelectedElementWithMeta(
  element: any
): Promise<SelectedElementMeta> {
  ensureLinterInitialized();
  const { lintElementWithMeta } = createElementLintService();
  const { results, appliedClassNames, roles } = await lintElementWithMeta(
    element
  );
  return { results, classNames: appliedClassNames, roles };
}
