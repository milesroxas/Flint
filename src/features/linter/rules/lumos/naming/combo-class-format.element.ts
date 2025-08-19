// src/features/linter/rules/lumos/naming/combo-class-format.element.ts
import type {
  NamingRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

export const createLumosComboClassFormatRule = (): NamingRule => ({
  id: "lumos:naming:combo-class-format",
  name: "Combo class format",
  description:
    "After the base custom class, combos must be either a variant (is-) or a utility (u-). Component bases (c-*) are not valid combos.",
  example: "base_custom is-active u-hidden",
  type: "naming",
  category: "format",
  severity: "error",
  enabled: true,
  targetClassTypes: ["combo", "utility"],

  test: (className: string): boolean => {
    if (!className) return false;
    return (
      /^is-/.test(className) || /^u-/.test(className) || /^c-/.test(className)
    );
  },

  evaluate: (className: string): RuleResult | null => {
    const VARIANT_RE = /^is-[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const UTILITY_RE = /^u-[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (className.startsWith("c-")) {
      return {
        ruleId: "lumos:naming:combo-class-format",
        name: "Combo class format",
        message:
          "Component base classes (c-*) cannot be used as a combo. Use a variant (is-) or a utility (u-).",
        severity: "error",
        className,
        isCombo: true,
        example: "base_custom is-active",
      };
    }

    if (className.startsWith("u-")) {
      if (UTILITY_RE.test(className)) return null;

      const candidate = (() => {
        const lower = className.trim().toLowerCase();
        const noPrefix = lower.replace(/^u[_-]?/, "");
        const normalized = noPrefix
          .replace(/[^a-z0-9-]/g, "")
          .replace(/_+/g, "-")
          .replace(/--+/g, "-")
          .replace(/^-+|-+$/g, "");
        const proposed = `u-${normalized}`;
        return UTILITY_RE.test(proposed) ? proposed : null;
      })();

      return {
        ruleId: "lumos:naming:combo-class-format",
        name: "Combo class format",
        message:
          "Utility classes used in the combo position must be lowercase, hyphen-separated, and start with u-.",
        severity: "error",
        className,
        isCombo: false,
        example: "base_custom is-active u-hidden",
        ...(candidate
          ? {
              fix: {
                kind: "rename-class",
                from: className,
                to: candidate,
                scope: "element",
              } as const,
            }
          : {}),
      };
    }

    if (VARIANT_RE.test(className)) return null;

    const suggested = (() => {
      const lower = className.trim().toLowerCase();
      const stripped = lower.replace(/^is[_-]?/, "");
      const normalized = stripped
        .replace(/[^a-z0-9-]/g, "")
        .replace(/_+/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "");
      const candidate = `is-${normalized}`;
      return VARIANT_RE.test(candidate) ? candidate : null;
    })();

    return {
      ruleId: "lumos:naming:combo-class-format",
      name: "Combo class format",
      message:
        "Combo custom classes must be lowercase variant tokens starting with is- or be valid utilities starting with u-.",
      severity: "error",
      className,
      isCombo: true,
      example: "base_custom is-active",
      ...(suggested
        ? {
            fix: {
              kind: "rename-class",
              from: className,
              to: suggested,
              scope: "element",
            } as const,
          }
        : {}),
    };
  },
});
