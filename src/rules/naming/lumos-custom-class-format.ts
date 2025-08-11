import type { NamingRule, RuleConfigSchema, RuleResult } from "@/features/linter/model/rule.types";

const customClassConfig: RuleConfigSchema = {
  projectDefinedElements: {
    label: "Project-defined element terms",
    type: "string[]",
    description:
      "Custom terms that are valid as final class segments for this project (e.g. 'flag', 'chip', 'stat').",
    default: []
  }
};

export const lumosCustomClassFormatRule: NamingRule = {
  id: "lumos-custom-class-format",
  name: "Lumos Custom Class Format",
  description:
    "Custom classes must be lowercase, underscore-separated, with 2 or 3 segments: type_element or type_variant_element. The final segment should describe the element (e.g. wrap, text, icon).",
  example: "footer_wrap or footer_link_wrap",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],
  config: customClassConfig,

  test: (className: string): boolean => {
    // Allow component classes (validated separately by component rule)
    if (className.startsWith("c-")) return true;
    const pattern = /^[a-z0-9_]+$/;
    if (!pattern.test(className)) return false;
    const segments = className.split("_");
    return segments.length >= 2 && segments.length <= 3 && !segments.some(s => !s);
  },

  evaluate: (
    className: string,
    context?: { config?: Record<string, unknown> }
  ): RuleResult | null => {
    // Allow component classes (validated by the component rule)
    if (className.startsWith("c-")) return null;
    if (!lumosCustomClassFormatRule.test(className)) {
      // Provide a minimal suggested correction that fits Lumos format
      const suggested = className
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

      return {
        ruleId: lumosCustomClassFormatRule.id,
        name: lumosCustomClassFormatRule.name,
        message: `"${className}" is not a valid custom class format. Must be lowercase, underscore-separated, with 2 or 3 segments (type_element or type_variant_element).`,
        severity: "error",
        className,
        isCombo: false,
        example: "footer_wrap or footer_link_wrap",
        metadata:
          suggested && lumosCustomClassFormatRule.test(suggested)
            ? { suggestedName: suggested }
            : undefined,
      };
    }

    const segments = className.split("_");
    const element = segments[segments.length - 1];

    const knownElements = [
      "wrap", "contain", "container", "text", "title", "icon",
      "img", "image", "group", "label", "heading", "button", "link", "field"
    ];

    const projectTerms: string[] =
      (context?.config?.projectDefinedElements as string[]) ??
      (customClassConfig.projectDefinedElements.default as string[]);

    const isCombo = false;

    if (knownElements.includes(element)) {
      return null;
    }

    if (projectTerms.includes(element)) {
      return {
        ruleId: lumosCustomClassFormatRule.id,
        name: lumosCustomClassFormatRule.name,
        message: `"${className}" uses a project-defined element name "${element}".`,
        severity: "suggestion",
        className,
        isCombo,
      };
    }

    return {
      ruleId: lumosCustomClassFormatRule.id,
      name: lumosCustomClassFormatRule.name,
      message: `"${className}" uses an unrecognized element "${element}". Consider updating or whitelisting this term.`,
      severity: "suggestion",
      className,
      isCombo,
      metadata: { unrecognizedElement: true }
    };
  }
};


