import type { NamingRule, RuleResult } from "@/features/linter/model/rule.types";

export const cfCustomKebabCaseRule: NamingRule = {
  id: "cf-custom-kebab-case",
  name: "Client-First: Custom Kebab Case",
  description: "Use kebab case for custom classes.",
  example: "feature-card, feature-card-title",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],
  test: (className: string): boolean => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
  evaluate: (className: string): RuleResult | null => {
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className)) return null;
    return {
      ruleId: "cf-custom-kebab-case",
      name: "Client-First: Custom Kebab Case",
      message: "Use kebab case for custom classes.",
      severity: "warning",
      className,
      isCombo: false,
    };
  },
};


