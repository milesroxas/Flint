import type { RuleResult } from "@/features/linter/model/rule.types";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import { getLinterServices } from "@/features/linter/services/linter-service-singleton";
import type { ElementRole } from "@/features/linter/model/linter.types";

export async function scanSelectedElement(element: any): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const { elementLintService } = getLinterServices();
  return await elementLintService.lintElement(element);
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
  const { elementLintService } = getLinterServices();
  const results = await elementLintService.lintElement(element);
  return { results, classNames: [], roles: [] };
}
