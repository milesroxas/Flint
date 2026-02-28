import type { NamingRule, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: Utility classes must use dashes only — no underscores.
 *
 * In Client-First, the underscore character is reserved for custom class folder
 * convention (`folder_element`). Utility classes are always dash-separated.
 *
 * This rule primarily catches explicitly-prefixed utility classes (`u-*`) that
 * erroneously contain underscores. Non-prefixed classes are classified by the
 * grammar based on underscore presence, so they self-sort.
 */
export const createCFUtilityNoUnderscoreRule = (): NamingRule => ({
  id: "cf:naming:utility-no-underscore",
  name: "Client-First: Utility classes use dashes only",
  description:
    "Utility classes in Client-First must use dashes (-) as separators. Underscores are reserved for custom class folders.",
  example: "text-size-large, padding-global",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["utility"],

  test: (className: string): boolean => !className.includes("_"),

  evaluate: (className: string): RuleResult | null => {
    if (!className.includes("_")) return null;

    const suggested = className.replace(/_/g, "-");

    return {
      ruleId: "cf:naming:utility-no-underscore",
      name: "Client-First: Utility classes use dashes only",
      message: `Utility class "${className}" contains underscores. Use dashes instead: "${suggested}".`,
      severity: "error",
      className,
      isCombo: false,
      fix: {
        kind: "rename-class",
        from: className,
        to: suggested,
        scope: "global",
      },
    };
  },
});
