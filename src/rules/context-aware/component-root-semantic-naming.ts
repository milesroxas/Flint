import { createComponentRootRule, validateComponentRootNaming } from "@/features/linter/utils/context-rule-helpers";
import type { NamingRule } from "@/features/linter/model/rule.types";

export const componentRootSemanticNaming: NamingRule = createComponentRootRule({
  id: "component-root-semantic-naming",
  name: "Component Root Semantic Naming", 
  description: "Name component roots with a type and descriptive element token.",
  example: "header_wrap, navigation_wrap, card_wrap",
  test: validateComponentRootNaming,
  category: "semantics",
  severity: "suggestion"
});


