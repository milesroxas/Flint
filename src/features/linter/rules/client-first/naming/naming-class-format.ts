import type {
  NamingRule,
  RuleConfigSchema,
  RuleResult,
} from "@/features/linter/model/rule.types";

/**
 * Gets the known elements for client-first preset
 * This is the single source of truth for client-first recognized elements
 */
function getClientFirstKnownElements(): string[] {
  return [
    // Layout elements
    "wrapper",
    "container",
    "inner",
    "section",
    // Content elements
    "text",
    "title",
    "heading",
    "subtitle",
    "label",
    // Component elements
    "card",
    "button",
    "link",
    "form",
    "nav",
    // Media elements
    "image",
    "icon",
    "video",
    // Utility elements
    "spacer",
    "divider",
    "overlay",
  ];
}

/**
 * Export the known elements for use by other services
 */
export { getClientFirstKnownElements };

const customClassConfig: RuleConfigSchema = {
  projectDefinedElements: {
    label: "Project-defined element terms",
    type: "string[]",
    description:
      "Custom terms that are valid as final class segments for this project (e.g. 'flag', 'chip', 'stat').",
    default: [],
  },
};

export const createCFNamingClassFormatRule = (): NamingRule => ({
  id: "cf:naming:class-format",
  name: "Client-First: Custom Class Format",
  description: "Use kebab case for custom classes.",
  example: "feature-card, feature-card-title",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],
  config: customClassConfig,
  test: (className: string): boolean =>
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
  evaluate: (className: string): RuleResult | null => {
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className)) return null;
    return {
      ruleId: "cf:naming:class-format",
      name: "Client-First: Custom Class Format",
      message: "Use kebab case for custom classes.",
      severity: "error",
      className,
      isCombo: false,
    };
  },
});
