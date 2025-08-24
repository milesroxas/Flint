import {
  NamingRule,
  RuleResult,
  RuleConfigSchema,
  RuleContext,
} from "@/features/linter/model/rule.types";
import { normalizeToUnderscoreFormat } from "@/features/linter/lib/string-normalization";

/**
 * Gets the known elements for lumos preset
 * This is the single source of truth for lumos recognized elements
 */
function getLumosKnownElements(): string[] {
  return [
    // Layout elements
    "wrap",
    "main",
    "contain",
    "container",
    "layout",
    "inner",
    "content",
    "section",
    // Content elements
    "text",
    "title",
    "heading",
    "eyebrow",
    "label",
    "marker",
    // Media elements
    "icon",
    "img",
    "image",
    // Interactive elements
    "button",
    "link",
    "field",
    // Structure elements
    "group",
    "item",
    "list",
    "card",
    // Testing elements
    "x",
    "y",
    "z",
  ];
}

/**
 * Export the known elements for use by other services
 */
export { getLumosKnownElements };

const customClassConfig: RuleConfigSchema = {
  projectDefinedElements: {
    label: "Project-defined element terms",
    type: "string[]",
    description:
      "Custom terms that are valid as final class segments for this project (e.g. 'flag', 'chip', 'stat').",
    default: [],
  },
};

export const createLumosCustomClassFormatRule = (): NamingRule => ({
  id: "lumos:naming:class-format",
  name: "Lumos Custom Class Format",
  description:
    "Custom classes must be lowercase and underscore-separated with at least 2 segments: type_element or type_variant_element. Child group roots may include additional group segments before the final element (e.g., type[_variant]_[group]_wrap). The final segment should describe the element (e.g. wrap, text, icon).",
  example: "footer_wrap, footer_link_wrap, hero_secondary_content_wrap",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],
  config: customClassConfig,

  test: (className: string): boolean => {
    if (className.startsWith("c-")) return false;
    return true;
  },

  evaluate: (
    className: string,
    context: RuleContext & { config?: Record<string, unknown> }
  ): RuleResult | null => {
    // Skip component classes (handled by component rule)
    if (className.startsWith("c-")) return null;

    // Check basic format requirements
    const pattern = /^[a-z0-9_]+$/;
    if (!pattern.test(className)) {
      const suggested = normalizeToUnderscoreFormat(className);

      return {
        ruleId: "lumos:naming:class-format",
        name: "Lumos Custom Class Format",
        message: `Class "${className}" contains invalid characters. Use only lowercase letters, numbers, and underscores.`,
        severity: "error",
        className,
        isCombo: false,
        example: "footer_wrap or hero_secondary_content_wrap",
        metadata:
          suggested && /^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(suggested)
            ? { suggestedName: suggested }
            : undefined,
      };
    }

    const segments = className.split("_");

    // Must have at least 2 segments
    if (segments.length < 2) {
      const suggestedFix = `${className}_wrap`; // Common fallback element

      return {
        ruleId: "lumos:naming:class-format",
        name: "Lumos Custom Class Format",
        message: `Class "${className}" must have at least 2 segments separated by underscores (e.g., type_element).`,
        severity: "error",
        className,
        isCombo: false,
        example: "footer_wrap or hero_secondary_content_wrap",
        metadata: { suggestedName: suggestedFix },
      };
    }

    // Check for empty segments
    if (segments.some((s) => !s)) {
      const cleanedSegments = segments.filter((s) => s.length > 0);
      const suggestedFix =
        cleanedSegments.length >= 2
          ? cleanedSegments.join("_")
          : `${cleanedSegments[0] || "element"}_wrap`;

      return {
        ruleId: "lumos:naming:class-format",
        name: "Lumos Custom Class Format",
        message: `Class "${className}" contains empty segments. Each segment must contain at least one character.`,
        severity: "error",
        className,
        isCombo: false,
        example: "footer_wrap or hero_secondary_content_wrap",
        metadata: { suggestedName: suggestedFix },
      };
    }

    const finalElement = segments[segments.length - 1];

    // Get known elements from centralized service
    const knownElements = getLumosKnownElements();

    const projectTerms: string[] =
      (context?.config?.projectDefinedElements as string[]) ??
      (customClassConfig.projectDefinedElements.default as string[]);

    // If using a known element, this is valid
    if (knownElements.includes(finalElement)) {
      return null;
    }

    // If using a project-defined element, this is noted but allowed
    if (projectTerms.includes(finalElement)) {
      return {
        ruleId: "lumos:naming:class-format",
        name: "Lumos Custom Class Format",
        message: `Class "${className}" uses project-defined element "${finalElement}".`,
        severity: "suggestion",
        className,
        isCombo: false,
      };
    }

    // Unrecognized element - suggest consideration
    const baseSegments = segments.slice(0, -1);
    const suggestedFix = `${baseSegments.join("_")}_wrap`; // Common fallback element

    return {
      ruleId: "lumos:naming:class-format",
      name: "Lumos Custom Class Format",
      message: `Class "${className}" uses unrecognized element "${finalElement}". Consider using a known element term or adding it to project configuration.`,
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
          isRelevantFor: (violation) =>
            Boolean(violation.metadata?.unrecognizedElement),
        },
      ],
    };
  },
});
