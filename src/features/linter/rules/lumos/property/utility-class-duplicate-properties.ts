import type { PropertyRule } from "@/features/linter/model/rule.types";

export const lumosUtilityClassDuplicatePropertiesRule: PropertyRule = {
  id: "lumos-utility-class-duplicate-properties",
  name: "Duplicate Utility Class Properties",
  description: "Utility classes should avoid having duplicate properties with other classes.",
  type: "property",
  severity: "suggestion",
  enabled: false,
  category: "semantics",
  targetClassTypes: ["utility"],
  analyze: () => [], // Handled by UtilityClassAnalyzer
};
