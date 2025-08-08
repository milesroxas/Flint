import type { NamingRule } from "@/features/linter/model/rule.types";

export const lumosUtilityClassFormatRule: NamingRule = {
  id: "lumos-utility-class-format",
  name: "Lumos Utility Class Format",
  description: "Utility classes must start with u- and use dash-delimited tokens.",
  example: "u-property-value",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["utility"],
  test: (className: string): boolean =>
    /^u-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
};


