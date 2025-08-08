import type { NamingRule } from "@/features/linter/model/rule.types";

export const cfContainersCleanRule: NamingRule = {
  id: "cf-containers-clean",
  name: "Client-First: Containers Should Be Clean",
  description: "Prefer putting spacing on inner child rather than the container element.",
  example: "container + padding-* ➜ move padding-* to inner wrapper",
  type: "naming",
  severity: "suggestion",
  enabled: true,
  category: "semantics",
  targetClassTypes: ["custom"],
  test: () => true, // placeholder; actual detection will rely on context enrichment
};


