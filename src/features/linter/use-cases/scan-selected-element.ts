import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { getLinterServices } from "@/features/linter/services/linter-service-singleton";

export async function scanSelectedElement(element: any, useStructuralContext: boolean = false): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const { elementLintService } = getLinterServices();
  return await elementLintService.lintElement(
    element,
    undefined, // No page context - focus on element-only logic
    useStructuralContext
  );
}
