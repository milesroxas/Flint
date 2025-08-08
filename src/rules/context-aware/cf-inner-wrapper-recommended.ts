import { createComponentRootRule } from "@/features/linter/utils/context-rule-helpers";
import type { NamingRule } from "@/features/linter/model/rule.types";

export const cfInnerWrapperRecommendedRule: NamingRule = createComponentRootRule({
  id: "cf-inner-wrapper-recommended",
  name: "Client-First: Inner Wrapper Recommended",
  description: "Add an inner wrapper to hold spacing and layout utilities.",
  example: "feature-card (root) ➜ feature-card_wrap (inner)",
  category: "semantics",
  severity: "suggestion",
  test: () => false, // Suggestion determined via context enrichment in future step
});


