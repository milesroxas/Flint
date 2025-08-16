import type { PropertyRule } from "@/features/linter/model/rule.types";

export const lumosUtilityClassExactDuplicateRule: PropertyRule = {
  id: "lumos-utility-class-exact-duplicate",
  name: "Exact Duplicate Class",
  description:
    "Classes should not be exact duplicates (by their unique properties) of other classes.",
  type: "property",
  severity: "error",
  enabled: true,
  category: "semantics",
  targetClassTypes: ["utility", "combo", "custom"],
  analyze: () => [],
};
