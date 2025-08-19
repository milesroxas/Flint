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
import { createParentRelationshipService } from "@/entities/element/services/parent-relationship.service";

import type {
  StyleInfo,
  StyleWithElement,
} from "@/entities/style/model/style.types";
import { StyleService } from "@/entities/style/services/style.service";

import type { RuleRunner } from "@/features/linter/services/rule-runner";

export type PageLintService = ReturnType<typeof createPageLintService>;

export function createPageLintService(deps: {
  styleService: StyleService;
  ruleRunner: RuleRunner;
}) {
  const { styleService, ruleRunner } = deps;

  // Cache roles and tags for the current DOM signature to avoid re-detecting
  let rolesCacheSignature: string | null = null;
  let cachedRolesByElement: RolesByElement | null = null;
  let tagCacheSignature: string | null = null;
  let cachedTagsByElement: Map<string, string | null> | null = null;

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

    // 3) Build ElementWithClassNames for role detection
    const elementsWithClassNames: ElementWithClassNames[] =
      elementStylePairs.map((pair) => ({
        element: pair.element,
        classNames: pair.styles
          .map((s) => s.name)
          .filter((n) => n.trim() !== ""),
      }));

    // 4) Build parent map for graph helpers and role scoring
    const parentRelationshipService = createParentRelationshipService();
    const validElementsForGraph = elementStylePairs.map(
      ({ element }) => element
    );
    const parentIdByChildId =
      await parentRelationshipService.buildParentChildMap(
        validElementsForGraph
      );

    // DEBUG: Log final parent map
    console.log("[DEBUG] Complete parentIdByChildId map:", parentIdByChildId);

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
    } else {
      const roleDetection = createRoleDetectionService({
        detectors: [...roleDetectors],
        config: roleDetectionConfig,
      });
      rolesByElement = roleDetection.detectRolesForPage(elementsWithClassNames);
      rolesCacheSignature = sig;
      cachedRolesByElement = rolesByElement;
    }

    // 6) Graph helpers and tag collection
    const graph = createElementGraphService(
      elementStylePairs.map((p) => p.element),
      parentIdByChildId
    );

    // 6.5) Collect tag information with caching
    let tagByElementId: Map<string, string | null>;

    if (tagCacheSignature === sig && cachedTagsByElement) {
      tagByElementId = cachedTagsByElement;
    } else {
      tagByElementId = new Map<string, string | null>();
      await Promise.all(
        elementStylePairs.map(async ({ element }) => {
          const id = toElementKey(element);

          try {
            const tag = await graph.getTag(id);

            tagByElementId.set(id, tag);
          } catch (error) {
            tagByElementId.set(id, null);
          }
        })
      );
      tagCacheSignature = sig;
      cachedTagsByElement = tagByElementId;
    }

    // 7) Run rules via runner (page and element rules are handled by the runner)
    const results = ruleRunner.runRulesOnStylesWithContext(
      allAppliedStyles,
      {},
      allStyles,
      rolesByElement,
      graph.getParentId,
      graph.getChildrenIds,
      graph.getAncestorIds,
      (name: string) => (activePreset.grammar ?? lumosGrammar).parse(name),
      { getTag: graph.getTag },
      (id: string) => tagByElementId.get(id) ?? null
    );

    return results;
  }

  return { lintCurrentPage } as const;
}
