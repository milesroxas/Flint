import { createStyleService } from "@/entities/style/model/style.service";
import { createUtilityClassAnalyzer } from "@/features/linter/services/utility-class-analyzer";
import { createRuleRunner } from "@/features/linter/services/rule-runner";
import { ensureLinterInitialized, getRuleRegistry, getCurrentPreset } from "@/features/linter/model/linter.factory";
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { StyleWithElement } from "@/entities/style/model/style.service";
import { createElementContextClassifier } from "@/entities/element/model/element-context-classifier";
import type { WebflowElement, ElementWithClassNames } from "@/entities/element/model/element-context.types";
import type { ElementRole, GrammarAdapter, RoleResolver } from "@/features/linter/model/linter.types";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import { lumosRoles } from "@/features/linter/roles/lumos.roles";
// dynamic presets will supply grammar/roles; keep lumos as safe fallback
import { resolvePresetOrFallback } from "@/presets";

// Declare webflow global
declare const webflow: {
  getAllElements: () => Promise<any[]>;
};

/**
 * Factory for creating an ElementLintService.
 * Handles per-element linting: initializes registry, gathers styles, and runs rules.
 */
const DEBUG = false;

function createServiceInstance() {
  // Instantiate dependencies once
  const styleService = createStyleService();
  const utilityAnalyzer = createUtilityClassAnalyzer();
  const presetId = getCurrentPreset();
  const activePreset = resolvePresetOrFallback(presetId);
  const activeGrammar = activePreset.grammar || lumosGrammar;
  const ruleRunner = createRuleRunner(getRuleRegistry(), utilityAnalyzer, (name: string, isCombo?: boolean) => {
    if (isCombo === true) return "combo";
    const kind = activeGrammar.parse(name).kind as any;
    return kind === "utility" || kind === "combo" ? kind : "custom";
  });
  const elementCtx = createElementContextClassifier(activePreset.contextConfig);
  let cachedContextsMap: Record<string, any> | null = null;
  let cachedElementsSignature: string | null = null;

  function selectGrammarAndRoles(): { grammar: GrammarAdapter; roles: RoleResolver } {
    const preset = resolvePresetOrFallback(getCurrentPreset());
    const grammar = preset.grammar ?? lumosGrammar;
    const roles = preset.roles ?? lumosRoles;
    return { grammar, roles };
  }

  function isCustomKind(name: string): boolean {
    const kind = activeGrammar.parse(name).kind as any;
    return kind === "custom" || kind === "component" || kind === "unknown";
  }

  function computeElementRoles(classNames: string[], contexts: string[]): ElementRole[] {
    if (!Array.isArray(classNames) || classNames.length === 0) return [];
    const { grammar, roles } = selectGrammarAndRoles();
    const firstCustom = classNames.find((n) => isCustomKind(n));
    if (!firstCustom) return [];
    const parsed = grammar.parse(firstCustom);
    let role = roles.mapToRole(parsed);
    // If "wrap" mapped to componentRoot but classifier did not flag root, treat as childGroup
    if (role === "componentRoot" && !contexts.includes("componentRoot")) {
      role = "childGroup";
    }
    return role === "unknown" ? [] : [role];
  }

  /**
   * Lints a single Webflow element by:
   * 1. Ensuring the rule registry is initialized
   * 2. Building property maps from all site styles
   * 3. Retrieving, sorting, and validating applied styles on the element
   */
  async function lintElement(element: any): Promise<RuleResult[]> {
    try {
      // Check if element is valid and has required methods
      if (!element || typeof element.getStyles !== 'function') {
        console.error("[ElementLintService] Invalid element or missing getStyles method:", element);
        return [];
      }

      ensureLinterInitialized();

      if (DEBUG) console.log("[ElementLintService] Starting element lint...");

      // 1. Fetch all styles and build analysis maps once
      const allStyles = await styleService.getAllStylesWithProperties();
      utilityAnalyzer.buildPropertyMaps(allStyles);

      // 2. Get styles applied to the element
      const appliedStyles = await styleService.getAppliedStyles(element);
      if (appliedStyles.length === 0) {
        if (DEBUG) console.log("[ElementLintService] No styles on element, returning default issue.");
        return [
          {
            ruleId: "no-styles-or-classes",
            name: "Element must have styles or classes",
            message: "This element has no classes assigned.",
            severity: "error",
            className: "",
            isCombo: false,
            example: "header_wrap, u-padding-32, is-active"
          }
        ];
      }

      // 3. Sort styles and convert to StyleWithElement format
      const sorted = styleService.sortStylesByType(appliedStyles);
      // Use the same key format as classifier (element.id.element)
      const elementKey =
        (element?.id && (element.id as any).element) ??
        element?.id ??
        element?.nodeId ??
        '';

      const stylesWithElement: StyleWithElement[] = sorted.map(style => ({
        ...style,
        elementId: elementKey
      }));

      // 4. Classify element context
      // Get all elements to build parent map (needed for context classification)
      // Build/reuse page contexts once per page snapshot
      const allElements = await webflow.getAllElements();
      const validElements = allElements.filter(el => el && typeof el.getStyles === 'function');
      const signature = `${validElements.length}`;

      let elementContextsMap: Record<string, any>;
      if (cachedContextsMap && cachedElementsSignature === signature) {
        elementContextsMap = cachedContextsMap;
      } else {
        const allElementsWithClassNames: ElementWithClassNames[] = await Promise.all(
          validElements.map(async (el) => {
            const classNames = await styleService.getAppliedClassNames(el);
            return {
              element: el as WebflowElement,
              classNames: classNames.filter(name => name.trim() !== '')
            };
          })
        );
        elementContextsMap = await elementCtx.classifyPageElements(allElementsWithClassNames);
        cachedContextsMap = elementContextsMap;
        cachedElementsSignature = signature;
      }

      if (DEBUG) {
        console.log("[ElementLintService] Current element key:", elementKey);
        console.log("[ElementLintService] Current element contexts:", elementContextsMap[elementKey]);
      }

      // 5. Run rules with proper element context
      let results = ruleRunner.runRulesOnStylesWithContext(
        stylesWithElement, 
        elementContextsMap, 
        allStyles
      );

      // 6. Attach role metadata for the selected element (if resolvable)
      try {
        const contextsForElement: string[] = elementContextsMap[elementKey] || [];
        const elementClassNames = stylesWithElement.map(s => s.name).filter(n => n.trim() !== "");
        const roles = computeElementRoles(elementClassNames, contextsForElement);
        if (roles.length > 0) {
          const primaryRole = roles[0];
          results = results.map(r => ({
            ...r,
            metadata: { ...(r.metadata ?? {}), role: primaryRole },
          }));
        }
      } catch (e) {
        // ignore role attachment errors to avoid impacting lint results
      }

      console.log(
        `[ElementLintService] Lint completed with ${results.length} issue${results.length === 1 ? "" : "s"}.`
      );

      return results;
    } catch (err) {
      console.error("[ElementLintService] Error linting element:", err);
      return [];
    }
  }

  async function lintElementWithMeta(element: any): Promise<{ results: RuleResult[]; appliedClassNames: string[]; elementContextsMap: Record<string, any>; roles: ElementRole[] }>{
    const [results, applied] = await Promise.all([
      lintElement(element),
      styleService.getAppliedClassNames(element)
    ]);

    const elementKey =
      (element?.id && (element.id as any).element) ?? element?.id ?? element?.nodeId ?? "";

    // Reuse cached contexts map
    const elementContextsMap = cachedContextsMap || {};
    const contextsForElement: string[] = elementContextsMap[elementKey] || [];
    const roles = computeElementRoles(applied.filter((n: string) => n.trim() !== ""), contextsForElement);
    return { results, appliedClassNames: applied, elementContextsMap, roles };
  }

  return { lintElement, lintElementWithMeta };
}

let singletonInstance: ReturnType<typeof createServiceInstance> | null = null;

export function createElementLintService() {
  if (!singletonInstance) {
    singletonInstance = createServiceInstance();
  }
  return singletonInstance;
}