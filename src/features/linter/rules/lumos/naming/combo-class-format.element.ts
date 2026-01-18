// src/features/linter/rules/lumos/naming/combo-class-format.element.ts

import { normalizeUtilityClass, normalizeVariantClass } from "@/features/linter/lib/string-normalization";
import type { NamingRule, QuickFix, RuleResult } from "@/features/linter/model/rule.types";

// Rule metadata constants
const RULE_ID = "lumos:naming:combo-class-format";
const RULE_NAME = "Combo class format";

/**
 * Creates a quick fix for renaming a class
 */
function createRenameFix(from: string, to: string): QuickFix {
  return {
    kind: "rename-class",
    from,
    to,
    scope: "element",
  } as const;
}

/**
 * Creates a rule result with common fields populated
 */
function createRuleResult(
  className: string,
  message: string,
  isCombo: boolean,
  example?: string,
  fix?: QuickFix
): RuleResult {
  return {
    ruleId: RULE_ID,
    name: RULE_NAME,
    message,
    severity: "error",
    className,
    isCombo,
    example,
    fix,
  };
}

/**
 * Validates and processes utility classes
 */
function validateUtilityClass(className: string): RuleResult | null {
  const normalizedClass = normalizeUtilityClass(className);

  // If normalization returns the same class, it's already valid
  if (normalizedClass === className) return null;

  const fix = normalizedClass ? createRenameFix(className, normalizedClass) : undefined;

  return createRuleResult(
    className,
    "Utility classes used in the combo position must be lowercase, hyphen-separated, and start with u-.",
    false,
    "base_custom is-active u-hidden",
    fix
  );
}

/**
 * Validates and processes variant classes
 */
function validateVariantClass(className: string): RuleResult | null {
  const normalizedClass = normalizeVariantClass(className);

  // If normalization returns the same class, it's already valid
  if (normalizedClass === className) return null;

  const fix = normalizedClass ? createRenameFix(className, normalizedClass) : undefined;

  return createRuleResult(
    className,
    "Combo custom classes must be lowercase variant tokens starting with is- or be valid utilities starting with u-.",
    true,
    "base_custom is-active",
    fix
  );
}

export const createLumosComboClassFormatRule = (): NamingRule => ({
  id: RULE_ID,
  name: RULE_NAME,
  description:
    "After the base custom class, combos must be either a variant (is-) or a utility (u-). Component bases (c-*) are not valid combos.",
  example: "base_custom is-active u-hidden",
  type: "naming",
  category: "format",
  severity: "error",
  enabled: true,
  targetClassTypes: ["combo", "utility"],

  test: (className: string): boolean => {
    // Only test classes that could potentially be combo classes
    // This includes is-, u-, c-, and any other potential combo classes
    return Boolean(className && className.length > 2);
  },

  evaluate: (className: string): RuleResult | null => {
    // Use charAt for faster prefix checking than startsWith
    const firstChar = className.charAt(0);
    const prefix = className.slice(0, 2);

    // Component classes are not valid combos
    if (firstChar === "c" && prefix === "c-") {
      return createRuleResult(
        className,
        "Component base classes (c-*) cannot be used as a combo. Use a variant (is-) or a utility (u-).",
        true,
        "base_custom is-active",
        undefined // No fix available for component classes
      );
    }

    // Validate utility classes
    if (firstChar === "u" && prefix === "u-") {
      return validateUtilityClass(className);
    }

    // Validate variant classes (is- prefix)
    if (firstChar === "i" && prefix === "is") {
      return validateVariantClass(className);
    }

    // If not u-, c-, or is-, it's not a valid combo class format
    return createRuleResult(
      className,
      "Combo classes must be either a variant (is-) or a utility (u-). Component bases (c-*) are not valid combos.",
      true,
      "base_custom is-active u-hidden",
      undefined // No specific fix for unknown formats
    );
  },
});
