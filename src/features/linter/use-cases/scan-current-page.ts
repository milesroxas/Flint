import type { RuleResult } from "@/features/linter/model/rule.types";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import { getLinterServices } from "@/features/linter/services/linter-service-singleton";

export async function scanCurrentPage(elements: any[]): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const { styleService, analyzer, pageLintService } = getLinterServices();

  const allStyles = await styleService.getAllStylesWithProperties();
  analyzer.buildPropertyMaps(allStyles);

  const valid = (elements || []).filter(
    (el: any) => el && typeof el.getStyles === "function"
  );

  return pageLintService.lintCurrentPage(valid as any);
}

export async function scanCurrentPageWithMeta(
  elements: any[]
): Promise<{ results: RuleResult[]; classNames: string[] }> {
  ensureLinterInitialized();
  const { styleService, analyzer, pageLintService } = getLinterServices();

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

  const results = await pageLintService.lintCurrentPage(valid as any);
  return { results, classNames: Array.from(unique) };
}
