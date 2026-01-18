import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { getLinterServices } from "@/features/linter/services/linter-service-singleton";

export async function scanCurrentPage(elements: any[]): Promise<RuleResult[]> {
  ensureLinterInitialized();
  const { styleService, analyzer, pageLintService } = getLinterServices();

  const allStyles = await styleService.getAllStylesWithProperties();
  analyzer.buildPropertyMaps(allStyles);

  // Include elements with getStyles() AND potential page slots
  const valid = (elements || []).filter((el: any) => {
    if (!el) return false;

    // Include elements that have getStyles (normal elements)
    if (typeof el.getStyles === "function") return true;

    // Also include potential page slots (no element type but has component+element ID structure)
    const hasComponentElementId = el?.id?.component && el?.id?.element;
    const hasNoType = !el.type || el.type === "";

    console.log(`[DEBUG] Element filter check:`, {
      elementId: el?.id?.element || el?.id || "unknown",
      hasGetStyles: typeof el.getStyles === "function",
      hasComponentElementId,
      hasNoType,
      included: typeof el.getStyles === "function" || (hasComponentElementId && hasNoType),
    });

    return hasComponentElementId && hasNoType;
  });

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

  // Include elements with getStyles() AND potential page slots
  const valid = (elements || []).filter((el: any) => {
    if (!el) return false;

    // Include elements that have getStyles (normal elements)
    if (typeof el.getStyles === "function") return true;

    // Also include potential page slots (no element type but has component+element ID structure)
    const hasComponentElementId = el?.id?.component && el?.id?.element;
    const hasNoType = !el.type || el.type === "";

    return hasComponentElementId && hasNoType;
  });

  const results = await pageLintService.lintCurrentPage(valid as any);
  return { results, classNames: Array.from(unique) };
}
