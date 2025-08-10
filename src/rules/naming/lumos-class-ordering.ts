import type { NamingRule, RuleConfigSchema } from "@/features/linter/model/rule.types";

export const lumosUtilitiesAfterCustomOrderingRule: NamingRule = {
  id: "lumos-utilities-after-custom-ordering",
  name: "Utilities should follow base custom class",
  description: "Warn when utilities precede the base custom class.",
  example: "base_custom is-* u-*",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["utility"],
  // Element-level check is performed in rule-runner; keep test permissive
  test: () => true,
};

export const lumosCombosAfterCustomOrderingRule: NamingRule = {
  id: "lumos-combos-after-custom-ordering",
  name: "Combos should follow base custom class",
  description: "Warn when combo classes precede the base custom class.",
  example: "base_custom is-*",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["combo"],
  test: () => true,
};

const comboLimitConfig: RuleConfigSchema = {
  maxCombos: {
    label: "Maximum combo classes",
    type: "number",
    default: 2,
    description: "Maximum allowed combo classes on an element",
  },
};

export const lumosComboLimitRule: NamingRule = {
  id: "lumos-combo-class-limit",
  name: "Too many combo classes",
  description: "Limit the number of combo classes applied to an element.",
  example: "base_custom is-large is-active",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["combo"],
  config: comboLimitConfig,
  test: () => true,
};


