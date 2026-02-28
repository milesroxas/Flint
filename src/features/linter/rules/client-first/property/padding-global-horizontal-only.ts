import type { PropertyRule, RuleContext, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: `padding-global` should only set horizontal padding.
 *
 * From the Client-First docs: "Horizontal spacing of a page's content.
 * Used for site-wide left and right outer padding of each page."
 *
 * The padding-global class should only contain padding-left and padding-right.
 * Any other properties (especially vertical padding) are unexpected.
 */
const ALLOWED_PROPERTIES = new Set(["padding-left", "padding-right"]);

export const createCFPaddingGlobalHorizontalOnlyRule = (): PropertyRule => ({
  id: "cf:property:padding-global-horizontal-only",
  name: "Client-First: padding-global horizontal only",
  description:
    "The padding-global class should only contain horizontal padding (left/right). Vertical padding should use padding-section-[size] classes.",
  example: "padding-global: { padding-left: 1.25rem; padding-right: 1.25rem; }",
  type: "property",
  severity: "warning",
  enabled: true,
  category: "structure",
  targetClassTypes: ["utility"],

  analyze: (
    className: string,
    properties: Record<string, unknown>,
    _context: RuleContext & { config?: Record<string, unknown> }
  ): RuleResult[] => {
    // Only check the padding-global class
    if (className !== "padding-global") return [];

    const results: RuleResult[] = [];
    const propertyNames = Object.keys(properties);

    for (const prop of propertyNames) {
      if (ALLOWED_PROPERTIES.has(prop)) continue;

      // Skip internal Webflow metadata properties (non-CSS)
      if (prop.startsWith("__") || prop === "order") continue;

      results.push({
        ruleId: "cf:property:padding-global-horizontal-only",
        name: "Client-First: padding-global horizontal only",
        message: `Property "${prop}" on padding-global is unexpected. This class should only define horizontal padding (left/right). Use padding-section-[size] for vertical spacing.`,
        severity: "warning",
        className,
        isCombo: false,
        metadata: {
          unexpectedProperty: prop,
          allowedProperties: [...ALLOWED_PROPERTIES],
        },
      });
    }

    return results;
  },
});
