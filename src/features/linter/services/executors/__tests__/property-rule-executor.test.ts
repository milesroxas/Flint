import { describe, expect, it } from "vitest";
import type { StyleInfo } from "@/entities/style/model/style.types";
import { createColorVariableRule } from "@/features/linter/rules/shared/property/color-variable";
import { createUtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";
import { createPropertyRuleExecutor } from "@/features/linter/services/executors/property-rule-executor";
import { createRuleRegistry } from "@/features/linter/services/rule-registry";

describe("createPropertyRuleExecutor", () => {
  it("delegates to the rule and normalizes severity onto results", () => {
    const registry = createRuleRegistry();
    const rule = createColorVariableRule();
    registry.registerRule(rule);
    const analyzer = createUtilityClassAnalyzer();
    const styles: StyleInfo[] = [];
    const exec = createPropertyRuleExecutor(registry, analyzer);
    const out = exec(rule, "my-class", { "background-color": "#ff0000" }, "warning", styles, () => "custom");
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe("warning");
    expect(out[0].ruleId).toBe("shared:property:color-variable");
  });
});
