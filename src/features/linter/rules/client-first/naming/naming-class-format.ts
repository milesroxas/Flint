import type { NamingRule, RuleConfigSchema, RuleContext, RuleResult } from "@/features/linter/model/rule.types";

/** Single source of truth for Client-First recognised element tokens */
function getClientFirstKnownElements(): string[] {
  return [
    // Layout
    "wrapper",
    "container",
    "inner",
    "section",
    "grid",
    // Content
    "content",
    "text",
    "title",
    "heading",
    "subtitle",
    "label",
    // Component
    "header",
    "footer",
    "hero",
    "card",
    "button",
    "link",
    "form",
    "nav",
    // Media
    "image",
    "icon",
    "video",
    // Utility-ish nouns sometimes used at tail
    "spacer",
    "divider",
    "overlay",
    "fixed",
    "small",
    "medium",
    "large",
    "xlarge",
    "xxlarge",
  ];
}
export { getClientFirstKnownElements };

/** Client-First utility class systems: prefixes and exacts that should never be flagged */
const CF_UTILITY_PREFIXES = [
  // Core structure
  "container-",
  "padding-section-",
  // Typography systems
  "heading-style-",
  "text-size-",
  "text-style-",
  "text-weight-",
  "text-align-",
  "text-color-",
  // Spacing systems
  "margin-",
  "padding-",
  // Useful utilities
  "hide",
  "display-inlineflex",
  "max-width-",
  "icon-height-",
  "icon-1x1-",
  "background-color-",
  "z-index-",
  "pointer-events-",
  "overflow-",
  "aspect-ratio-",
];

const CF_UTILITY_EXACTS = new Set([
  "padding-global",
  "button",
  "spacing-clean",
  "max-width-full",
  "align-center",
  "layer",
]);

/** Accept lowercase tokens separated by hyphen OR underscore */
const CLIENT_FIRST_NAME_RE = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

const customClassConfig: RuleConfigSchema = {
  projectDefinedElements: {
    label: "Project-defined element terms",
    type: "string[]",
    description: "Custom terms that are valid as final class segments for this project (e.g. 'flag', 'chip', 'stat').",
    default: [],
  },
};

export const createCFNamingClassFormatRule = (): NamingRule => ({
  id: "cf:naming:class-format",
  name: "Client-First: Custom Class Format",
  description: "Use lowercase tokens separated by hyphens or underscores (Client-First style).",
  example: "section_about, hero-content, feature-card_title",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],
  config: customClassConfig,

  test: (className: string): boolean => CLIENT_FIRST_NAME_RE.test(className),

  evaluate: (className: string, context: RuleContext & { config?: Record<string, unknown> }): RuleResult | null => {
    // 1) Format validation
    if (!CLIENT_FIRST_NAME_RE.test(className)) {
      return {
        ruleId: "cf:naming:class-format",
        name: "Client-First: Custom Class Format",
        message: "Use lowercase tokens separated by hyphens or underscores (no spaces or uppercase).",
        severity: "error",
        className,
        isCombo: false,
      };
    }

    // Canonical form (treat hyphens and underscores equally for utilities)
    const canonical = className.replace(/_/g, "-");

    // 2) Utility systems short-circuit
    if (CF_UTILITY_EXACTS.has(canonical)) return null;
    for (const prefix of CF_UTILITY_PREFIXES) {
      const escaped = prefix.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
      // If the prefix already ends with a hyphen/underscore, don't force an extra boundary
      const needsBoundary = !/[-_]$/.test(prefix);
      const re = new RegExp(`^${escaped}${needsBoundary ? "(?:$|[-_])" : ""}`);
      if (re.test(canonical)) return null;
    }

    // 3) Element recognition (suggestion-level) for non-utility classes
    const tokens = className.split(/[-_]/).filter(Boolean);
    if (tokens.length < 2) return null;
    const finalElement = tokens[tokens.length - 1];

    const knownElements = getClientFirstKnownElements();
    const projectTerms: string[] =
      (context?.config?.projectDefinedElements as string[]) ??
      (customClassConfig.projectDefinedElements.default as string[]);

    if (knownElements.includes(finalElement)) return null;
    if (projectTerms.includes(finalElement)) {
      return {
        ruleId: "cf:naming:class-format",
        name: "Client-First: Custom Class Format",
        message: `Class "${className}" uses project-defined element "${finalElement}".`,
        severity: "suggestion",
        className,
        isCombo: false,
      };
    }

    // 4) Fallback suggestion: preserve delimiter and suggest wrapper
    const delimiter = className.includes("_") ? "_" : "-";
    const baseSegments = tokens.slice(0, -1);
    const suggestedFix = `${baseSegments.join(delimiter)}${delimiter}wrapper`;

    return {
      ruleId: "cf:naming:class-format",
      name: "Client-First: Custom Class Format",
      message: `Class "${className}" uses unrecognized element "${finalElement}". Consider using a known element term or add it to project configuration.`,
      severity: "suggestion",
      className,
      isCombo: false,
      metadata: {
        unrecognizedElement: finalElement,
        suggestedName: suggestedFix,
      },
      expandedViewCapabilities: [
        {
          contentType: "recognized-elements",
          title: "View Recognized Elements",
          description: "See all recognized element names for this preset",
          isRelevantFor: (violation) => Boolean(violation.metadata?.unrecognizedElement),
        },
      ],
    };
  },
});
