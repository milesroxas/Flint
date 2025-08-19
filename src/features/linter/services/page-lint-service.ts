// src/features/linter/services/page-lint-service.ts
import type { RuleResult } from "@/features/linter/model/rule.types";
import type {
  RoleDetectionConfig,
  RolesByElement,
} from "@/features/linter/model/linter.types";
import type { RoleDetector } from "@/features/linter/model/preset.types";

import type {
  WebflowElement,
  ElementWithClassNames,
} from "@/entities/element/model/element.types";

import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import { resolvePresetOrFallback } from "@/features/linter/presets";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";

import { createRoleDetectionService } from "@/features/linter/services/role-detection.service";
import { createElementGraphService } from "@/entities/element/services/element-graph.service";

import type {
  StyleInfo,
  StyleWithElement,
} from "@/entities/style/model/style.types";
import { StyleService } from "@/entities/style/services/style.service";

import type { RuleRunner } from "@/features/linter/services/rule-runner";

const DEBUG = false;

export type PageLintService = ReturnType<typeof createPageLintService>;

export function createPageLintService(deps: {
  styleService: StyleService;
  ruleRunner: RuleRunner;
}) {
  const { styleService, ruleRunner } = deps;

  // Cache roles for the current DOM signature to avoid re-detecting
  let rolesCacheSignature: string | null = null;
  let cachedRolesByElement: RolesByElement | null = null;

  function toElementKey(el: any): string {
    return String((el?.id && el.id.element) ?? el?.id ?? el?.nodeId ?? "");
  }

  function signatureFor(
    pairs: { element: WebflowElement; styles: StyleWithElement[] }[],
    parentOf: Record<string, string | null>
  ): string {
    const rows = pairs
      .map((p) => {
        const id = toElementKey(p.element);
        const names = p.styles
          .map((s) => s.name)
          .filter(Boolean)
          .sort();
        return `${id}:${names.join("|")}`;
      })
      .sort();

    const tree = Object.entries(parentOf)
      .map(([child, parent]) => `${child}->${parent ?? ""}`)
      .sort();

    const djb2 = (s: string) => {
      let h = 5381;
      for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i);
      return (h >>> 0).toString(36);
    };

    return `v2:${djb2(rows.join("\n"))}:${djb2(tree.join("\n"))}`;
  }

  async function lintCurrentPage(
    elements: WebflowElement[]
  ): Promise<RuleResult[]> {
    if (!Array.isArray(elements)) return [];

    // Only elements that support getStyles()
    const validElements = elements.filter(
      (el: any) => el && typeof el.getStyles === "function"
    );

    // 1) Site-wide style context
    const allStyles: StyleInfo[] =
      await styleService.getAllStylesWithProperties();
    if (DEBUG)
      console.log(
        `[PageLintService] Loaded ${allStyles.length} styles site-wide`
      );

    // 2) Collect applied styles with normalized element ids
    const elementStylePairs = await Promise.all(
      validElements.map(async (element) => {
        const applied = await styleService.getAppliedStyles(element);
        const elementId = toElementKey(element);
        const styles: StyleWithElement[] = applied.map((s) => ({
          ...s,
          elementId,
        }));
        return { element, styles };
      })
    );

    const allAppliedStyles: StyleWithElement[] = elementStylePairs.flatMap(
      (p) => p.styles
    );
    if (DEBUG)
      console.log(
        `[PageLintService] Collected ${allAppliedStyles.length} applied style instances`
      );

    // 3) Build ElementWithClassNames for role detection
    const elementsWithClassNames: ElementWithClassNames[] =
      elementStylePairs.map((pair) => ({
        element: pair.element,
        classNames: pair.styles
          .map((s) => s.name)
          .filter((n) => n.trim() !== ""),
      }));

    // 4) Build parent map for graph helpers and role scoring
    const parentIdByChildId: Record<string, string | null> = {};
    for (const { element } of elementStylePairs) {
      const id = toElementKey(element);
      let parentId: string | null = null;
      if (typeof (element as any).getParent === "function") {
        try {
          const parent = await (element as any).getParent();
          parentId = parent ? toElementKey(parent) : null;
        } catch {
          parentId = null;
        }
      }
      parentIdByChildId[id] = parentId;
    }

    // 5) Detect roles once per page with caching
    const activePreset = resolvePresetOrFallback(getCurrentPreset());
    const roleDetectors: readonly RoleDetector[] =
      activePreset.roleDetectors ?? [];
    const roleDetectionConfig: RoleDetectionConfig | undefined =
      activePreset.roleDetectionConfig;

    const sig = signatureFor(elementStylePairs, parentIdByChildId);
    let rolesByElement: RolesByElement;

    if (rolesCacheSignature === sig && cachedRolesByElement) {
      rolesByElement = cachedRolesByElement;
      if (DEBUG) console.log("[PageLintService] Using cached roles");
    } else {
      const roleDetection = createRoleDetectionService({
        detectors: [...roleDetectors],
        config: roleDetectionConfig,
      });
      rolesByElement = roleDetection.detectRolesForPage(elementsWithClassNames);
      rolesCacheSignature = sig;
      cachedRolesByElement = rolesByElement;
      if (DEBUG) console.log("[PageLintService] Computed roles for page");
    }

    // 6) Graph helpers
    const graph = createElementGraphService(
      elementStylePairs.map((p) => p.element),
      parentIdByChildId
    );

    // 7) Run rules via runner (page and element rules are handled by the runner)
    const results = ruleRunner.runRulesOnStylesWithContext(
      allAppliedStyles,
      {},
      allStyles,
      rolesByElement,
      graph.getParentId,
      graph.getChildrenIds,
      graph.getAncestorIds,
      (name: string) => (activePreset.grammar ?? lumosGrammar).parse(name)
    );

    if (DEBUG)
      console.log(
        `[PageLintService] Lint complete with ${results.length} result${
          results.length === 1 ? "" : "s"
        }`
      );

    return results;
  }

  return { lintCurrentPage } as const;
}
