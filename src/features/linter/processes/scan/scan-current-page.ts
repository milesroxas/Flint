import type { RuleResult } from "@/features/linter/model/rule.types";
import {
  ensureLinterInitialized,
  getRuleRegistry,
  getCurrentPreset,
} from "@/features/linter/model/linter.factory";
import { createStyleService } from "@/entities/style/model/style.service";
import { createUtilityClassAnalyzer } from "@/features/linter/services/utility-class-analyzer";
import { createRuleRunner } from "@/features/linter/services/rule-runner";
import { resolvePresetOrFallback } from "@/presets";
import { createPageLintService } from "@/features/linter/services/page-lint-service";

export async function scanCurrentPage(elements: any[]): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const styleService = createStyleService();
  const analyzer = createUtilityClassAnalyzer();
  const activePreset = resolvePresetOrFallback(getCurrentPreset());
  const activeGrammar =
    activePreset.grammar ||
    ({ parse: (n: string) => ({ raw: n, kind: "custom" as const }) } as any);
  const ruleRunner = createRuleRunner(
    getRuleRegistry(),
    analyzer,
    (name: string, isCombo?: boolean) => {
      if (isCombo === true) return "combo";
      const kind = activeGrammar.parse(name).kind as any;
      return kind === "utility" || kind === "combo" ? kind : "custom";
    }
  );
  const pageService = createPageLintService(styleService, ruleRunner);
  const allStyles = await styleService.getAllStylesWithProperties();
  analyzer.buildPropertyMaps(allStyles);
  const valid = (elements || []).filter(
    (el: any) => el && typeof el.getStyles === "function"
  );
  return pageService.lintCurrentPage(valid as any);
}

export async function scanCurrentPageWithMeta(
  elements: any[]
): Promise<{ results: RuleResult[]; classNames: string[] }> {
  ensureLinterInitialized();
  const styleService = createStyleService();
  const analyzer = createUtilityClassAnalyzer();
  const activePreset = resolvePresetOrFallback(getCurrentPreset());
  const activeGrammar =
    activePreset.grammar ||
    ({ parse: (n: string) => ({ raw: n, kind: "custom" as const }) } as any);
  const ruleRunner = createRuleRunner(
    getRuleRegistry(),
    analyzer,
    (name: string, isCombo?: boolean) => {
      if (isCombo === true) return "combo";
      const kind = activeGrammar.parse(name).kind as any;
      return kind === "utility" || kind === "combo" ? kind : "custom";
    }
  );
  const pageService = createPageLintService(styleService, ruleRunner);
  const allStyles = await styleService.getAllStylesWithProperties();
  analyzer.buildPropertyMaps(allStyles);
  const unique = new Set<string>();
  for (const el of elements || []) {
    try {
      if (!el || typeof el.getStyles !== "function") continue;
      const styles = await styleService.getAppliedStyles(el);
      styles.forEach((s) => {
        if (s.name) unique.add(s.name);
      });
    } catch {
      console.error("Error getting applied styles", el);
    }
  }
  const valid = (elements || []).filter(
    (el: any) => el && typeof el.getStyles === "function"
  );
  const results = await pageService.lintCurrentPage(valid as any);
  return { results, classNames: Array.from(unique) };
}
