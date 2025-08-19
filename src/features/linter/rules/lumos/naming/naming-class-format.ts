import {
  NamingRule,
  RuleResult,
  RuleConfigSchema,
  RuleContext,
} from "@/features/linter/model/rule.types";

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
      const suggested = className
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

      return {
        ruleId: "lumos:naming:class-format",
        name: "Lumos Custom Class Format",
        message: `Class "${className}" contains invalid characters. Use only lowercase letters, numbers, and underscores.`,
        severity: "error",
        className,
        isCombo: false,
        example: "footer_wrap or hero_secondary_content_wrap",
        fix:
          suggested && /^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(suggested)
            ? {
                kind: "rename-class",
                from: className,
                to: suggested,
                scope: "element",
              }
            : undefined,
      };
    }

    const segments = className.split("_");

    // Must have at least 2 segments
    if (segments.length < 2) {
      return {
        ruleId: "lumos:naming:class-format",
        name: "Lumos Custom Class Format",
        message: `Class "${className}" must have at least 2 segments separated by underscores (e.g., type_element).`,
        severity: "error",
        className,
        isCombo: false,
        example: "footer_wrap or hero_secondary_content_wrap",
      };
    }

    // Check for empty segments
    if (segments.some((s) => !s)) {
      return {
        ruleId: "lumos:naming:class-format",
        name: "Lumos Custom Class Format",
        message: `Class "${className}" contains empty segments. Each segment must contain at least one character.`,
        severity: "error",
        className,
        isCombo: false,
        example: "footer_wrap or hero_secondary_content_wrap",
      };
    }

    const finalElement = segments[segments.length - 1];

    // Known element terms that are considered valid
    const knownElements = [
      "wrap",
      "main",
      "contain",
      "container",
      "layout",
      "text",
      "title",
      "icon",
      "img",
      "image",
      "eyebrow",
      "marker",
      "group",
      "label",
      "heading",
      "button",
      "link",
      "field",
      "inner",
      "content",
      "section",
      "item",
      "list",
      "card",
      // Short generic elements for testing/demos
      "x",
      "y",
      "z",
    ];

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
    return {
      ruleId: "lumos:naming:class-format",
      name: "Lumos Custom Class Format",
      message: `Class "${className}" uses unrecognized element "${finalElement}". Consider using a known element term or adding it to project configuration.`,
      severity: "suggestion",
      className,
      isCombo: false,
      metadata: { unrecognizedElement: finalElement },
    };
  },
});
