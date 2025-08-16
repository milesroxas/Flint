// src/features/linter/services/page-lint-service.ts
import {
  StyleService,
  StyleWithElement,
} from "@/entities/style/model/style.service";
import { RuleRunner } from "./rule-runner";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { createElementContextClassifier } from "@/entities/element/model/element-context-classifier";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";
import type {
  RoleDetector,
  RoleDetectionConfig,
  RolesByElement,
} from "@/features/linter/model/linter.types";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
// dynamic presets will supply grammar/roles; keep lumos as safe fallback
import { resolvePresetOrFallback } from "@/presets";
import type {
  WebflowElement,
  ElementWithClassNames,
} from "@/entities/element/model/element-context.types";
import { createRoleDetectionService } from "@/features/linter/services/role-detection.service";
import { createElementGraphService } from "@/features/linter/services/element-graph.service";
import { createPageRuleRunner } from "@/features/linter/services/page-rule-runner";
import { createMainSingletonPageRule } from "@/features/linter/rules/canonical/main-singleton.page";
import { createMainHasContentPageRule } from "@/features/linter/rules/canonical/main-children.page";

export function createPageLintService(
  styleService: StyleService,
  ruleRunner: RuleRunner
) {
  const presetId = getCurrentPreset();
  const activePreset = resolvePresetOrFallback(presetId);
  const elementCtx = createElementContextClassifier(activePreset.contextConfig);

  // Grammar/roles selection removed; detection layer uses preset grammar directly

  // Legacy per-element role computation removed; roles are provided by detection service

  async function lintCurrentPage(
    elements: WebflowElement[]
  ): Promise<RuleResult[]> {
    console.log("[PageLintService] Starting lint for current page…");

    // Filter to Designer elements that support getStyles()
    const validElements: WebflowElement[] = (elements || []).filter(
      (el: any) => el && typeof el.getStyles === "function"
    );

    // 1. Load every style definition (for rule context)
    const allStyles = await styleService.getAllStylesWithProperties();
    console.log(
      `[PageLintService] Loaded ${allStyles.length} style definitions for context.`
    );

    // 2. Get styles for each element, maintaining element association
    const elementStylePairs = await Promise.all(
      validElements.map(async (element) => {
        const styles = await styleService.getAppliedStyles(element);
        const elementKey =
          ((element as any)?.id && ((element as any).id as any).element) ??
          (element as any)?.id ??
          (element as any)?.nodeId ??
          "";
        return {
          elementId: String(elementKey),
          element,
          styles: styles.map((style) => ({
            ...style,
            elementId: String(elementKey),
          })) as StyleWithElement[],
        };
      })
    );

    const allAppliedStyles: StyleWithElement[] = elementStylePairs.flatMap(
      (pair) => pair.styles
    );

    console.log(
      `[PageLintService] Collected ${allAppliedStyles.length} applied style instances on this page.`
    );

    // 3. Extract class names for each element (needed for context classification)
    const elementsWithClassNames: ElementWithClassNames[] =
      elementStylePairs.map((pair) => ({
        element: pair.element,
        classNames: pair.styles
          .map((style) => style.name)
          .filter((name) => name.trim() !== ""),
      }));

    console.log(
      `[PageLintService] Extracted class names for ${elementsWithClassNames.length} elements.`
    );

    // 4. Classify elements into contexts using extracted class names
    const elementContexts = await elementCtx.classifyPageElements(
      elementsWithClassNames
    );

    // 5. Detect roles once for the page and build parent map helpers
    const activePresetForRoles = resolvePresetOrFallback(getCurrentPreset());
    const roleDetectors: RoleDetector[] =
      activePresetForRoles.roleDetectors ?? [];
    const roleDetectionConfig: RoleDetectionConfig | undefined =
      activePresetForRoles.roleDetectionConfig;
    let rolesByElement: RolesByElement = {};
    try {
      const roleDetection = createRoleDetectionService({
        grammar: activePresetForRoles.grammar ?? lumosGrammar,
        detectors: roleDetectors,
        config: roleDetectionConfig,
      });
      rolesByElement = roleDetection.detectRolesForPage(elementsWithClassNames);
    } catch (err) {
      rolesByElement = {} as RolesByElement;
    }

    const parentIdByChildId: Record<string, string | null> = {};
    try {
      for (const pair of elementStylePairs) {
        const el: any = pair.element;
        const childId = String(
          (el?.id && el.id.element) ?? el?.id ?? el?.nodeId ?? ""
        );
        const parent =
          typeof el.getParent === "function" ? await el.getParent() : null;
        const parentId = parent
          ? String(
              (parent?.id && parent.id.element) ??
                parent?.id ??
                parent?.nodeId ??
                ""
            )
          : null;
        parentIdByChildId[childId] = parentId;
      }
    } catch {
      // Parent resolution best-effort; leave map partial if API not available
    }

    const getParentId = (elementId: string): string | null =>
      parentIdByChildId[elementId] ?? null;

    // 6. Page-scope canonical rules
    const graph = createElementGraphService(
      elementStylePairs.map((p) => p.element as WebflowElement),
      parentIdByChildId
    );
    const pageRunner = createPageRuleRunner();
    const pageResults = pageRunner.run(
      [createMainSingletonPageRule(), createMainHasContentPageRule()],
      {
        rolesByElement,
        getParentId: graph.getParentId,
        getChildrenIds: graph.getChildrenIds,
      }
    );

    // 7. Element-scope rules with roles
    const results = ruleRunner.runRulesOnStylesWithContext(
      allAppliedStyles,
      elementContexts,
      allStyles,
      rolesByElement,
      getParentId,
      graph.getChildrenIds,
      graph.getAncestorIds,
      (name: string) =>
        (activePresetForRoles.grammar ?? lumosGrammar).parse(name)
    );

    // Role metadata is provided by rolesByElement; no post-stamping here

    console.log(
      `[PageLintService] Lint complete. Found ${results.length} issue${
        results.length === 1 ? "" : "s"
      }.`
    );

    return [...pageResults, ...results];
  }

  return { lintCurrentPage };
}
