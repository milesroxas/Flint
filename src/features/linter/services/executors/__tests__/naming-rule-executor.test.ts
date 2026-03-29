import { describe, expect, it } from "vitest";
import { createCFNamingClassFormatRule } from "@/features/linter/rules/client-first/naming/naming-class-format";
import { createCFUtilityNoUnderscoreRule } from "@/features/linter/rules/client-first/naming/utility-no-underscore";
import { createNamingRuleExecutor } from "@/features/linter/services/executors/naming-rule-executor";

function cfClassType(name: string, isCombo?: boolean) {
  if (isCombo === true) return "combo";
  if (name.startsWith("u-")) return "utility";
  if (name.includes("_")) return "custom";
  return "utility";
}

describe("createNamingRuleExecutor", () => {
  const execute = createNamingRuleExecutor();

  it("runs utility-targeted naming rules on utility-classified names", () => {
    const rule = createCFUtilityNoUnderscoreRule();
    const out = execute(
      rule,
      {
        className: "u-text_size",
        elementId: "el-1",
        severityDefault: "error",
      },
      {
        getClassType: cfClassType,
        getRoleForElement: () => "unknown",
      }
    );
    expect(out).toHaveLength(1);
    expect(out[0].ruleId).toBe("cf:naming:utility-no-underscore");
  });

  it("skips custom-only naming rules when the class is classified as utility", () => {
    const rule = createCFNamingClassFormatRule();
    const out = execute(
      rule,
      {
        className: "text-size-large",
        elementId: "el-1",
        severityDefault: "error",
      },
      {
        getClassType: () => "utility",
        getRoleForElement: () => "unknown",
      }
    );
    expect(out).toEqual([]);
  });
});
