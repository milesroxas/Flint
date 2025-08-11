import type { NamingRule } from "@/features/linter/model/rule.types";

export const lumosComponentClassFormatRule: NamingRule = {
  id: "lumos-component-class-format",
  name: "Lumos Component Class Format",
  description: "Component classes must start with c- and use dash-delimited tokens (no underscores).",
  example: "c-card, c-card-title",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],
  test: (className: string): boolean => {
    // Only enforce when it is a component class; otherwise pass.
    if (!className.startsWith("c-")) return true;
    return /^c-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className);
  },
};


