import type { NamingRule, RuleResult } from "@/features/linter/model/rule.types";

// Enforce that an is-* combo modifies an existing custom/component class (c-)
export const lumosVariantOnComponentRule: NamingRule = {
  id: "lumos-variant-on-component",
  name: "Lumos Variant on Component",
  description: "Variant classes (is-*) should modify an existing component/custom class (c- or custom).",
  example: "c-card is-active",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["combo"],
  // Evaluated in runner context via evaluate hook using metadata.combos if available
  test: () => true,
  evaluate: (className: string): RuleResult | null => {
    // Pure format check: ensure dashes, no underscores
    if (!/^is-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className)) {
      return {
        ruleId: "lumos-variant-on-component",
        name: "Lumos Variant on Component",
        message: "Variant classes must start with is- and use dashes (no underscores).",
        severity: "warning",
        className,
        isCombo: true,
      };
    }
    return null;
  },
};


