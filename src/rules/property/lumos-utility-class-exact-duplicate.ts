import type { PropertyRule } from "@/features/linter/model/rule.types";

export const lumosUtilityClassExactDuplicateRule: PropertyRule = {
  id: "lumos-utility-class-exact-duplicate",
  name: "Exact Duplicate Utility Class",
  description: "Utility classes should not be exact duplicates of other classes.",
  type: "property",
  severity: "error",
  enabled: true,
  category: "semantics",
  targetClassTypes: ["utility"],
  analyze: () => [] 
};


