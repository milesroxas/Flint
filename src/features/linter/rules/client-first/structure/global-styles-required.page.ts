import type { PageAnalysisArgs, PageRule, RuleResult } from "@/features/linter/model/rule.types";

const GLOBAL_STYLES_SLUG = "global-styles";

function normalizeComponentLabel(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * True when the page includes a ComponentInstance whose definition is named like the
 * Client-First Global Styles embed (see `webflow.getAllComponents()` + `getName()`).
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
 * Detection: (1) class `global-styles` on an element, or (2) a **canvas** component instance
 * whose definition name normalizes to `global-styles`. `getAllComponents()` is only used to
 * resolve definition id → name; it lists **site-registered** components, not “on this page.”
 */
export const createCFGlobalStylesRequiredRule = (): PageRule => ({
  id: "cf:structure:global-styles-required",
  name: "Client-First: global-styles required",
  description:
    "Every page should include the global-styles component (class or Global Styles embed instance) for project-wide custom CSS.",
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
          'No "global-styles" element found on this page. Add the Global Styles embed (class or component instance) on every page.',
        severity: "suggestion",
        className: "",
        elementId: undefined,
        isCombo: false,
        example: "global-styles",
      },
    ];
  },
});
