import type { NamingRule, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: Combo classes must use the `is-` prefix.
 *
 * From the Client-First docs: "Use prefix 'is-' to define a combo class."
 * Combo classes are variant modifiers that inherit styles from a base class
 * and add additional styles on top.
 *
 * Valid: `is-brand`, `is-home`, `is-active`
 * Invalid: `is-`, `is-Brand`, `is_active`
 */
const COMBO_FORMAT_RE = /^is-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const createCFComboIsPrefixRule = (): NamingRule => ({
  id: "cf:naming:combo-is-prefix",
  name: "Client-First: Combo class format",
  description:
    "Combo classes must use the is- prefix followed by a lowercase descriptor with dashes (e.g., is-brand, is-active).",
  example: "button is-brand, header_content is-home",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["combo"],

  test: (className: string): boolean => COMBO_FORMAT_RE.test(className),

  evaluate: (className: string): RuleResult | null => {
    if (COMBO_FORMAT_RE.test(className)) return null;

    // Determine the specific issue
    let message: string;

    if (className === "is-") {
      message = `Combo class "is-" is incomplete. Add a descriptor after the prefix (e.g., "is-active").`;
    } else if (/^is-.*[A-Z]/.test(className)) {
      const suggested = className.toLowerCase();
      message = `Combo class "${className}" contains uppercase characters. Use lowercase: "${suggested}".`;
      return {
        ruleId: "cf:naming:combo-is-prefix",
        name: "Client-First: Combo class format",
        message,
        severity: "error",
        className,
        isCombo: true,
        fix: {
          kind: "rename-class",
          from: className,
          to: suggested,
          scope: "global",
        },
      };
    } else if (className.includes("_")) {
      const suggested = className.replace(/_/g, "-");
      message = `Combo class "${className}" uses underscores. Use dashes instead: "${suggested}".`;
      return {
        ruleId: "cf:naming:combo-is-prefix",
        name: "Client-First: Combo class format",
        message,
        severity: "error",
        className,
        isCombo: true,
        fix: {
          kind: "rename-class",
          from: className,
          to: suggested,
          scope: "global",
        },
      };
    } else {
      message = `Combo class "${className}" does not follow the is-[descriptor] format (e.g., "is-active").`;
    }

    return {
      ruleId: "cf:naming:combo-is-prefix",
      name: "Client-First: Combo class format",
      message,
      severity: "error",
      className,
      isCombo: true,
    };
  },
});
