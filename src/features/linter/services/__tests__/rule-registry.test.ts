import { describe, expect, it } from "vitest";
import { createColorVariableRule } from "@/features/linter/rules/shared/property/color-variable";
import { createRuleRegistry } from "@/features/linter/services/rule-registry";

describe("createRuleRegistry", () => {
  it("registers rules, seeds configuration defaults, and filters by class type", () => {
    const registry = createRuleRegistry();
    const rule = createColorVariableRule();
    registry.registerRule(rule);

    expect(registry.getRule("shared:property:color-variable")).toBe(rule);
    expect(registry.getRulesByClassType("utility").map((r) => r.id)).toContain("shared:property:color-variable");

    const cfg = registry.getRuleConfiguration("shared:property:color-variable");
    expect(cfg?.enabled).toBe(true);
    expect(cfg?.customSettings).toHaveProperty("targetProperties");

    registry.updateRuleConfiguration("shared:property:color-variable", {
      customSettings: { targetProperties: ["color"] },
    });
    expect(registry.getRuleConfiguration("shared:property:color-variable")?.customSettings?.targetProperties).toEqual([
      "color",
    ]);

    registry.clear();
    expect(registry.getAllRules()).toHaveLength(0);
  });

  it("round-trips configuration export/import", () => {
    const registry = createRuleRegistry();
    registry.registerRule(createColorVariableRule());
    const exported = registry.exportConfiguration();
    registry.updateRuleConfiguration("shared:property:color-variable", { enabled: false });
    registry.importConfiguration(exported);
    expect(registry.getRuleConfiguration("shared:property:color-variable")?.enabled).toBe(true);
  });
});
