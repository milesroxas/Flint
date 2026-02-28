import type { PropertyRule, RuleContext, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: Prefer rem units over px for sizing-related properties.
 *
 * From the Client-First docs: "Apply rem to all elements in Client-First,
 * including typography, spacing, widths, and anything else that requires
 * a size unit." and "1rem = 16px (font size of the root element)."
 *
 * This rule checks sizing-related CSS properties for px values and
 * suggests rem alternatives. Uses suggestion severity to avoid being
 * overly disruptive.
 */

/** CSS properties where rem is preferred over px */
const SIZING_PROPERTIES = new Set([
  "font-size",
  "line-height",
  "letter-spacing",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "gap",
  "row-gap",
  "column-gap",
  "top",
  "right",
  "bottom",
  "left",
  "border-radius",
  "border-width",
]);

/** Pattern matching px values like "16px", "1.5px", etc. */
const PX_VALUE_RE = /(\d+(?:\.\d+)?)px/;

function pxToRem(pxValue: number): string {
  const rem = pxValue / 16;
  // Clean up floating point: round to 4 decimal places
  const rounded = Math.round(rem * 10000) / 10000;
  return `${rounded}rem`;
}

export const createCFPreferRemRule = (): PropertyRule => ({
  id: "cf:property:prefer-rem",
  name: "Client-First: Prefer rem units",
  description:
    "Client-First recommends rem units for all sizing properties. Rem enables accessible, fluid responsive websites.",
  example: "font-size: 1rem (not 16px), padding: 1.25rem (not 20px)",
  type: "property",
  severity: "suggestion",
  enabled: true,
  category: "accessibility",
  targetClassTypes: ["custom", "utility", "combo"],

  analyze: (
    className: string,
    properties: Record<string, unknown>,
    _context: RuleContext & { config?: Record<string, unknown> }
  ): RuleResult[] => {
    const results: RuleResult[] = [];

    for (const [prop, value] of Object.entries(properties)) {
      if (!SIZING_PROPERTIES.has(prop)) continue;
      if (typeof value !== "string") continue;

      const match = PX_VALUE_RE.exec(value);
      if (!match) continue;

      const pxNum = Number.parseFloat(match[1]);
      // Skip very small values (1px borders, etc.) to reduce noise
      if (pxNum <= 1) continue;

      const remSuggestion = pxToRem(pxNum);

      results.push({
        ruleId: "cf:property:prefer-rem",
        name: "Client-First: Prefer rem units",
        message: `Property "${prop}" uses px (${value}). Consider using rem: ${remSuggestion}. Rem enables accessible, fluid responsive design.`,
        severity: "suggestion",
        className,
        isCombo: false,
        metadata: {
          property: prop,
          currentValue: value,
          suggestedValue: remSuggestion,
          pxValue: pxNum,
        },
      });
    }

    return results;
  },
});
