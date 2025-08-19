// src/features/linter/services/linter-service-factory.ts
import { createStyleService } from "@/entities/style/services/style.service";
import { createUtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";
import { createRuleRunner } from "@/features/linter/services/rule-runner";
import { createElementLintService } from "@/features/linter/services/element-lint-service";
import { createPageLintService } from "@/features/linter/services/page-lint-service";
import { getRuleRegistry, getCurrentPreset } from "@/features/linter/model/linter.factory";
import { resolvePresetOrFallback } from "@/features/linter/presets";

/**
 * Centralized factory for creating linter services with shared dependencies.
 * Reduces redundant service creation and ensures consistency.
 */
export function createLinterServices() {
  // Core services - created once and shared
  const styleService = createStyleService();
  const analyzer = createUtilityClassAnalyzer();
  
  // Get active preset for grammar-aware rule runner
  const activePreset = resolvePresetOrFallback(getCurrentPreset());
  const activeGrammar = activePreset.grammar || 
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

  // Higher-level services
  const elementLintService = createElementLintService({ styleService, ruleRunner });
  const pageLintService = createPageLintService({ styleService, ruleRunner });

  return {
    styleService,
    analyzer,
    ruleRunner,
    elementLintService,
    pageLintService,
    activePreset,
    activeGrammar,
  } as const;
}

export type LinterServices = ReturnType<typeof createLinterServices>;
