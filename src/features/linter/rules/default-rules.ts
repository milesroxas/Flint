// features/linter/rules/default-rules.ts
import type {
  Rule,
  NamingRule,
  RuleConfigSchema,
  RuleResult
} from "../types/rule-types";

// -------------------------
// Config schema for custom-class rule
// -------------------------
const customClassConfig: RuleConfigSchema = {
  projectDefinedElements: {
    label: "Project-defined element terms",
    type: "string[]",
    description:
      "Custom terms that are valid as final class segments for this project (e.g. 'flag', 'chip', 'stat').",
    default: []
  }
};

// -------------------------
// lumos-custom-class-format rule
// -------------------------
const lumosCustomClassFormatRule: NamingRule = {
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
    const pattern = /^[a-z0-9_]+$/;
    if (!pattern.test(className)) return false;
    const segments = className.split("_");
    return segments.length >= 2 && segments.length <= 3 && !segments.some(s => !s);
  },

  evaluate: (
    className: string,
    context?: { config?: Record<string, unknown> }
  ): RuleResult | null => {
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
      return {
        ruleId: lumosCustomClassFormatRule.id,
        name: lumosCustomClassFormatRule.name,
        message: `"${className}" uses a valid element name "${element}".`,
        severity: "error",
        className,
        isCombo,
      };
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
    };
  }
};

// -------------------------
// Default rules array
// -------------------------
export const defaultRules: Rule[] = [
  lumosCustomClassFormatRule,

  {
    id: "lumos-utility-class-format",
    name: "Lumos Utility Class Format",
    description:
      "Utility classes must start with u-, use dashes only, and always be stacked on a custom class.",
    example: "u-property-value",
    type: "naming",
    severity: "error",
    enabled: true,
    category: "format",
    targetClassTypes: ["utility"],
    test: (className: string): boolean =>
      /^u-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
  },

  {
    id: "lumos-combo-class-format",
    name: "Lumos Combo Class Format",
    description:
      "Combo classes must start with is-, use dashes only, and modify existing component classes.",
    example: "is-state-variant",
    type: "naming",
    severity: "error",
    enabled: true,
    category: "format",
    targetClassTypes: ["combo"],
    test: (className: string): boolean =>
      /^is-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
  },

  {
    id: "lumos-utility-class-exact-duplicate",
    name: "Exact Duplicate Utility Class",
    description: "Utility classes should not be exact duplicates of other classes.",
    type: "property",
    severity: "error",
    enabled: true,
    category: "semantics",
    targetClassTypes: ["utility"],
    analyze: () => [] // Handled by UtilityClassAnalyzer
  },

  {
    id: "lumos-utility-class-duplicate-properties",
    name: "Duplicate Utility Class Properties",
    description:
      "Utility classes should avoid having duplicate properties with other classes.",
    type: "property",
    severity: "suggestion",
    enabled: true,
    category: "semantics",
    targetClassTypes: ["utility"],
    analyze: () => [] // Handled by UtilityClassAnalyzer
  }
];
