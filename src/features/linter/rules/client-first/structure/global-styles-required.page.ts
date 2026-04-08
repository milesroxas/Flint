import type { PageAnalysisArgs, PageRule, RuleResult } from "@/features/linter/model/rule.types";

const GLOBAL_STYLES_SLUG = "global-styles";

function normalizeComponentLabel(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * True when the page includes a `ComponentInstance` whose site definition display name
 * normalizes to `global-styles` (e.g. cloneable **Global Styles** from `getName()`).
 * Same resolution path as `PageAnalysisArgs.componentIdByElementId` +
 * `siteComponentNameById` in `rule.types.ts`.
 */
function pageHasGlobalStylesComponentInstance(args: PageAnalysisArgs): boolean {
  const { siteComponentNameById, componentIdByElementId } = args;
  if (!siteComponentNameById?.size || !componentIdByElementId?.size) return false;
  for (const compDefId of componentIdByElementId.values()) {
    const name = siteComponentNameById.get(compDefId);
    if (name && normalizeComponentLabel(name) === GLOBAL_STYLES_SLUG) return true;
  }
  return false;
}

/**
 * Client-First: Every page should include a `global-styles` element.
 *
 * From the Client-First Quick Guide: "Global Styles embed is the embed code
 * that comes with the Client-First cloneable and it has necessary code snippets
 * of the system. Global Styles embed component must be applied to every page
 * in the project."
 *
 * Detection: (1) a **ComponentInstance** on this page whose definition name from the site
 * catalog normalizes to `global-styles` (typical: **Global Styles** embed), or (2) any element
 * with the `global-styles` class. The catalog (`getAllComponents()` + `getName()`) maps
 * definition id → name for (1); it lists site-registered components, not “only on this page.”
 */
export const createCFGlobalStylesRequiredRule = (): PageRule => ({
  id: "cf:structure:global-styles-required",
  name: "Client-First: global-styles required",
  description:
    "Every page should include the Global Styles embed (component instance) or a `global-styles` class for project-wide custom CSS.",
  example: "global-styles",
  type: "page",
  category: "structure",
  severity: "suggestion",
  enabled: true,

  analyzePage: (args): RuleResult[] => {
    const hasGlobalStylesClass = args.styles.some((s) => s.name === "global-styles");
    if (hasGlobalStylesClass || pageHasGlobalStylesComponentInstance(args)) return [];

    return [
      {
        ruleId: "cf:structure:global-styles-required",
        name: "Client-First: global-styles required",
        message:
          'No Global Styles embed or "global-styles" class on this page. Add the site\'s Global Styles component (or an element with the global-styles class) on every page.',
        severity: "suggestion",
        className: "",
        elementId: undefined,
        isCombo: false,
        example: "global-styles",
      },
    ];
  },
});
