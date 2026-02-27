import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { getLinterServices } from "@/features/linter/services/linter-service-singleton";
import type { PageLintOptions } from "@/features/linter/services/page-lint-service";

export interface ScanCurrentPageWithMetaResult {
  results: RuleResult[];
  classNames: string[];
  ignoredClassNames: string[];
}

function filterValidElements(elements: any[]): any[] {
  return (elements || []).filter((el: any) => {
    if (!el) return false;
    if (typeof el.getStyles === "function") return true;
    const hasComponentElementId = el?.id?.component && el?.id?.element;
    const hasNoType = !el.type || el.type === "";
    return hasComponentElementId && hasNoType;
  });
}

export async function scanCurrentPage(elements: any[], options?: PageLintOptions): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const { styleService, analyzer, pageLintService } = getLinterServices();

  const allStyles = await styleService.getAllStylesWithProperties();
  analyzer.buildPropertyMaps(allStyles);

  const valid = filterValidElements(elements);
  const { results } = await pageLintService.lintCurrentPage(valid as any, options);
  return results;
}

export async function scanCurrentPageWithMeta(
  elements: any[],
  options?: PageLintOptions
): Promise<ScanCurrentPageWithMetaResult> {
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

  const valid = filterValidElements(elements);
  const { results, ignoredClassNames } = await pageLintService.lintCurrentPage(valid as any, options);
  return { results, classNames: Array.from(unique), ignoredClassNames };
}
