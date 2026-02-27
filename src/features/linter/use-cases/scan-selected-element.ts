import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { ElementLintOptions } from "@/features/linter/services/element-lint-service";
import { getLinterServices } from "@/features/linter/services/linter-service-singleton";

export interface ScanSelectedElementResult {
  results: RuleResult[];
  ignoredClassNames: string[];
}

export async function scanSelectedElement(
  element: any,
  useStructuralContext: boolean = false,
  options?: ElementLintOptions
): Promise<ScanSelectedElementResult> {
  ensureLinterInitialized();
  const { elementLintService } = getLinterServices();
  return await elementLintService.lintElement(
    element,
    undefined, // No page context - focus on element-only logic
    useStructuralContext,
    options
  );
}
