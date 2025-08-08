import type { NamingRule, RuleResult } from "@/features/linter/model/rule.types";

const UTILITY_HEADS = new Set([
  "padding", "margin", "gap", "display", "flex", "grid", "align",
  "justify", "text", "heading-style", "width", "height", "overflow", "position"
]);

export const cfUnknownUtilityFamilyRule: NamingRule = {
  id: "cf-unknown-utility-family",
  name: "Client-First: Unknown Utility Family",
  description: "Unknown utility family. Consider a custom class instead.",
  example: "padding-16, flex-row, text-small",
  type: "naming",
  severity: "suggestion",
  enabled: true,
  category: "format",
  targetClassTypes: ["utility"],
  test: (className: string): boolean => {
    const head = className.split("-")[0];
    return UTILITY_HEADS.has(head);
  },
  evaluate: (className: string): RuleResult | null => {
    const head = className.split("-")[0];
    if (UTILITY_HEADS.has(head)) return null;
    return {
      ruleId: "cf-unknown-utility-family",
      name: "Client-First: Unknown Utility Family",
      message: "Unknown utility family. Consider a custom class instead.",
      severity: "suggestion",
      className,
      isCombo: false,
    };
  }
};


