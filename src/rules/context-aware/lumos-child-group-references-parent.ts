import { createContextAwareNamingRule } from "@/features/linter/utils/context-rule-helpers";
import type { NamingRule } from "@/features/linter/model/rule.types";

// Fires when classifier marks a child group as invalid (i.e., name does not reference the root type)
export const lumosChildGroupReferencesParentRule: NamingRule = createContextAwareNamingRule({
  id: "lumos-child-group-references-parent",
  name: "Child group must reference parent root",
  description: "Child group wraps (e.g., footer_link_wrap) must include the root type token (e.g., footer).",
  example: "footer_wrap > footer_link_wrap",
  context: "childGroupInvalid",
  category: "semantics",
  severity: "error",
  targetClassTypes: ["custom"],
  // Context-level rule; test always fails to emit violation when context matches
  test: () => false,
});


