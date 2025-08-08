import type { RuleResult } from "@/features/linter/model/rule.types";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import { createElementLintService } from "@/features/linter/services/element-lint-service";

export async function scanSelectedElement(element: any): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const { lintElement } = createElementLintService();
  return lintElement(element);
}


