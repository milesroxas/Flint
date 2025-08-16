import type { RolesByElement } from "@/features/linter/model/linter.types";
import type { RuleResult } from "@/features/linter/model/rule.types";

export type PageRule = {
  id: string;
  name: string;
  severity: "error" | "warning" | "suggestion";
  run: (args: {
    rolesByElement: RolesByElement;
    getParentId: (id: string) => string | null;
    getChildrenIds: (id: string) => string[];
  }) => RuleResult[];
};

export function createPageRuleRunner() {
  const run = (rules: PageRule[], args: Parameters<PageRule["run"]>[0]) =>
    rules.flatMap((r) => r.run(args));
  return { run } as const;
}
