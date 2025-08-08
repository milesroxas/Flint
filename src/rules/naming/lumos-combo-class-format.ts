import type { NamingRule } from "@/features/linter/model/rule.types";

export const lumosComboClassFormatRule: NamingRule = {
  id: "lumos-combo-class-format",
  name: "Lumos Combo Class Format",
  description: "Combo classes should start with is-.",
  example: "is-state-variant",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["combo"],
  test: (className: string): boolean =>
    /^is-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
};


