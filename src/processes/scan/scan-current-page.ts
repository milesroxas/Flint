import type { RuleResult } from "@/features/linter/model/rule.types";
import { ensureLinterInitialized, getRuleRegistry } from "@/features/linter/model/linter.factory";
import { createStyleService } from "@/entities/style/model/style.service";
import { createUtilityClassAnalyzer } from "@/features/linter/services/utility-class-analyzer";
import { createRuleRunner } from "@/features/linter/services/rule-runner";
import { createPageLintService } from "@/features/linter/services/page-lint-service";

export async function scanCurrentPage(elements: any[]): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const styleService = createStyleService();
  const analyzer = createUtilityClassAnalyzer();
  const ruleRunner = createRuleRunner(getRuleRegistry(), analyzer);
  const pageService = createPageLintService(styleService, ruleRunner);
  return pageService.lintCurrentPage(elements as any);
}


