// src/features/linter/services/element-lint-service.ts
import type { RuleResult } from "@/features/linter/model/rule.types";
import type {
  RoleDetectionConfig,
  RolesByElement,
} from "@/features/linter/model/linter.types";
import type { RoleDetector } from "@/features/linter/model/preset.types";
import type { WebflowElement } from "@/entities/element/model/element.types";

import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import { resolvePresetOrFallback } from "@/features/linter/presets";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";
import { createRoleDetectionService } from "@/features/linter/services/role-detection.service";
import { createElementGraphService } from "@/entities/element/services/element-graph.service";
import { createParentRelationshipService } from "@/entities/element/services/parent-relationship.service";
import { toElementKey } from "@/entities/element/lib/id";

import type {
  StyleWithElement,
  StyleInfo,
} from "@/entities/style/model/style.types";
import { StyleService } from "@/entities/style/services/style.service";
import type { RuleRunner } from "@/features/linter/services/rule-runner";

export type ElementLintService = ReturnType<typeof createElementLintService>;

export function createElementLintService(deps: {
  styleService: StyleService;
  ruleRunner: RuleRunner;
}) {
  const { styleService, ruleRunner } = deps;

  async function lintElement(element: WebflowElement): Promise<RuleResult[]> {
    if (!element || typeof (element as any).getStyles !== "function") return [];

    // 1) Resolve active preset with grammar fallback
    const activePreset = resolvePresetOrFallback(getCurrentPreset());
    const grammar = activePreset.grammar ?? lumosGrammar;
    const parseClass = (name: string) => grammar.parse(name);
    const roleDetectors: readonly RoleDetector[] =
      activePreset.roleDetectors ?? [];
    const roleDetectionConfig: RoleDetectionConfig | undefined =
      activePreset.roleDetectionConfig;

    // 2) Site-wide style info for property lookups
    const allStyles: StyleInfo[] =
      await styleService.getAllStylesWithProperties();

    // 3) Applied styles for the selected element
    const elementId = toElementKey(element);
    const applied = await styleService.getAppliedStyles(element);
    const appliedWithElement: StyleWithElement[] = applied.map((s) => ({
      ...s,
      elementId,
    }));

    // 4) Build a minimal graph around the element using parent relationship service
    const parentRelationshipService = createParentRelationshipService();
    const parentIdByChildId =
      await parentRelationshipService.buildParentChildMap([element]);

    const graph = createElementGraphService([element], parentIdByChildId);

    // 5) Detect roles using the same service as page scans
    const roleDetection = createRoleDetectionService({
      detectors: [...roleDetectors],
      config: roleDetectionConfig,
    });

    const rolesByElement: RolesByElement = roleDetection.detectRolesForPage([
      { element, classNames: applied.map((s) => s.name).filter(Boolean) },
    ]);

    // 6) Get tag for this element synchronously for rules that need it
    let elementTag: string | null = null;
    try {
      elementTag = await graph.getTag(elementId);
    } catch (error) {
      console.warn(`Failed to get tag for element ${elementId}:`, error);
    }

    // 7) Execute rules via the same runner API used by page scans
    //    Keep the call signature identical to page-lint-service for parity
    //    But skip page rules since we only have one element context
    const results = ruleRunner.runRulesOnStylesWithContext(
      appliedWithElement,
      {},
      allStyles,
      rolesByElement,
      graph.getParentId,
      graph.getChildrenIds,
      graph.getAncestorIds,
      parseClass,
      { getTag: graph.getTag },
      (id: string) => (id === elementId ? elementTag : null), // Only this element's tag available
      true // skipPageRules = true for element lint mode
    );

    return results;
  }

  return { lintElement } as const;
}
