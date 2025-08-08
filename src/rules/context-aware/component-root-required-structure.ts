import { createComponentRootRule } from "@/features/linter/utils/context-rule-helpers";
import type { NamingRule } from "@/features/linter/model/rule.types";

export const componentRootRequiredStructure: NamingRule = createComponentRootRule({
  id: "component-root-required-structure", 
  name: "Component Root Required Structure",
  description: "Component root elements must follow structural conventions",
  example: "component_wrap with proper container structure",
  category: "semantics",
  severity: "suggestion",
  test: (className) => className.endsWith('_wrap') && !className.includes('__'),
});


