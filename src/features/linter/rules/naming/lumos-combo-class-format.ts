import type { NamingRule } from "@/features/linter/model/rule.types";

export const lumosComboClassFormatRule: NamingRule = {
  id: "lumos-combo-class-format",
  name: "Lumos Combo Class Format",
  description:
    "Combo classes should start with is- or an existing u- utility class.",
  example: "is-state-variant",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["combo"],
  test: (className: string): boolean =>
    /^(?:is[-_][A-Za-z0-9_]+|is[A-Z][A-Za-z0-9_]*|u-[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(
      className
    ),
};
