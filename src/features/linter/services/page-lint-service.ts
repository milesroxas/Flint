// src/features/linter/services/page-lint-service.ts
import { StyleService, StyleWithElement } from "@/entities/style/model/style.service";
import { RuleRunner } from "./rule-runner";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { createElementContextClassifier } from "@/entities/element/model/element-context-classifier";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";
import type { ElementRole, GrammarAdapter, RoleResolver } from "@/features/linter/model/linter.types";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import { lumosRoles } from "@/features/linter/roles/lumos.roles";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";
import { clientFirstRoles } from "@/features/linter/roles/client-first.roles";
import type { WebflowElement, ElementWithClassNames } from "@/entities/element/model/element-context.types";

export function createPageLintService(
  styleService: StyleService,
  ruleRunner: RuleRunner
) {
  const elementCtx = createElementContextClassifier({
    parentClassPatterns: [
      "section_contain",
      /^u-section/,
      /^c-/,
      // add any other container selectors here
    ],
  });

  function selectGrammarAndRoles(): { grammar: GrammarAdapter; roles: RoleResolver } {
    const preset = getCurrentPreset();
    if (preset === "client-first") {
      return { grammar: clientFirstGrammar, roles: clientFirstRoles };
    }
    return { grammar: lumosGrammar, roles: lumosRoles };
  }

  function getClassTypeQuick(name: string): "custom" | "utility" | "combo" | "unknown" {
    if (name.startsWith("is-")) return "combo";
    if (name.startsWith("u-")) return "utility";
    if (name.startsWith("c-")) return "unknown";
    return "custom";
  }

  function computeElementRoleForList(classNames: string[], contexts: string[]): ElementRole | null {
    if (!Array.isArray(classNames) || classNames.length === 0) return null;
    const { grammar, roles } = selectGrammarAndRoles();
    const firstCustom = classNames.find((n) => getClassTypeQuick(n) === "custom");
    if (!firstCustom) return null;
    const parsed = grammar.parse(firstCustom);
    let role = roles.mapToRole(parsed);
    if (role === "componentRoot" && !contexts.includes("componentRoot")) {
      role = "childGroup";
    }
    return role === "unknown" ? null : role;
  }

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
          styles: styles.map(style => ({
            ...style,
            elementId: String(elementKey)
          })) as StyleWithElement[]
        };
      })
    );

    const allAppliedStyles: StyleWithElement[] = elementStylePairs
      .flatMap(pair => pair.styles);

    console.log(
      `[PageLintService] Collected ${allAppliedStyles.length} applied style instances on this page.`
    );

    // 3. Extract class names for each element (needed for context classification)
    const elementsWithClassNames: ElementWithClassNames[] = elementStylePairs.map(pair => ({
      element: pair.element,
      classNames: pair.styles.map(style => style.name).filter(name => name.trim() !== '')
    }));

    console.log(
      `[PageLintService] Extracted class names for ${elementsWithClassNames.length} elements.`
    );

    // 4. Classify elements into contexts using extracted class names
    const elementContexts = await elementCtx.classifyPageElements(elementsWithClassNames);

    // 5. Run rules with proper element-to-context mapping
    let results = ruleRunner.runRulesOnStylesWithContext(
      allAppliedStyles,
      elementContexts,
      allStyles
    );

    // 6. Attach role metadata when resolvable, per elementId, to aid UI grouping/badges
    try {
      const byElement = new Map<string, string[]>();
      for (const s of allAppliedStyles) {
        const list = byElement.get(s.elementId) ?? [];
        list.push(s.name);
        byElement.set(s.elementId, list);
      }
      const elementIdToRole = new Map<string, ElementRole>();
      for (const [elId, names] of byElement.entries()) {
        const contexts = elementContexts[elId] || [];
        const role = computeElementRoleForList(names.filter(n => n.trim() !== ''), contexts);
        if (role) elementIdToRole.set(elId, role);
      }
      if (elementIdToRole.size > 0) {
        results = results.map(r => {
          const elId = r.metadata?.elementId;
          const role = elId ? elementIdToRole.get(String(elId)) : undefined;
          return role ? { ...r, metadata: { ...(r.metadata ?? {}), role } } : r;
        });
      }
    } catch {}

    console.log(
      `[PageLintService] Lint complete. Found ${results.length} issue${
        results.length === 1 ? "" : "s"
      }.`
    );

    return results;
  }

  return { lintCurrentPage };
}