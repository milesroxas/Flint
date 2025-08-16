import { describe, it } from "vitest";
import { createRuleRegistry } from "@/features/linter/services/rule-registry";
import { createUtilityClassAnalyzer } from "@/features/linter/services/utility-class-analyzer";
import { createRuleRunner } from "@/features/linter/services/rule-runner";
import type {
  StyleInfo,
  StyleWithElement,
} from "@/entities/style/model/style.service";
import type { Rule, RuleResult } from "@/features/linter/model/rule.types";
import type { ElementContext } from "@/entities/element/model/element-context.types";

// Minimal helpers to quickly exercise a rule through the rule runner.
// Copy this file and replace the commented sections inside tests with your rule/preset.

const COMBO_LIKE_RE = /^(?:is-[A-Za-z0-9]|is_[A-Za-z0-9]|is[A-Z]).*/;

const toAllStyles = (
  classNames: string[],
  propertiesByClass: Record<string, any> = {}
): StyleInfo[] => {
  return classNames.map((name, index) => {
    const properties = propertiesByClass[name] ?? {};
    const isCombo = COMBO_LIKE_RE.test(name);
    return {
      id: `s-${index + 1}`,
      name,
      properties,
      order: index,
      isCombo,
      detectionSource: "heuristic",
    };
  });
};

const toStylesWithElement = (
  elementId: string,
  classNames: string[],
  propertiesByClass: Record<string, any> = {}
): StyleWithElement[] => {
  return toAllStyles(classNames, propertiesByClass).map((s) => ({
    ...s,
    elementId,
  }));
};

export const runRuleOnClasses = (
  rule: Rule,
  classNames: string[],
  options?: {
    propertiesByClass?: Record<string, any>;
    elementId?: string;
    contexts?: ElementContext[];
  }
): RuleResult[] => {
  const elementId = options?.elementId ?? "el-1";
  const propertiesByClass = options?.propertiesByClass ?? {};
  const contexts = options?.contexts ?? [];

  const allStyles = toAllStyles(classNames, propertiesByClass);
  const stylesWithElement = toStylesWithElement(
    elementId,
    classNames,
    propertiesByClass
  );
  const elementContextsMap: Record<string, ElementContext[]> = {
    [elementId]: contexts,
  };

  const registry = createRuleRegistry();
  registry.registerRule(rule);

  const analyzer = createUtilityClassAnalyzer();
  // Ensure analyzer maps are populated for any property-based rules
  analyzer.buildPropertyMaps(allStyles);

  const runner = createRuleRunner(registry as any, analyzer);
  return runner.runRulesOnStylesWithContext(
    stylesWithElement,
    elementContextsMap,
    allStyles
  );
};

describe.skip("Rule Template (copy and adapt)", () => {
  it("naming rule example (replace with your rule import)", () => {
    // import { yourRule } from '@/rules/your/new-rule';
    // const results = runRuleOnClasses(yourRule, ['bad', 'good_custom-name']);
    // expect(results.some(r => r.ruleId === yourRule.id)).toBe(true);
  });

  it("property rule example (duplicate class properties)", () => {
    // import { yourPropertyRule } from '@/rules/property/your-rule';
    // const props = {
    //   'u-red': { color: 'red' },
    //   'u-red-dup': { color: 'red' }
    // } as const;
    // const results = runRuleOnClasses(yourPropertyRule, ['u-red', 'u-red-dup'], { propertiesByClass: props });
    // expect(results.some(r => r.ruleId === yourPropertyRule.id)).toBe(true);
  });

  it("preset smoke (register preset and assert a rule triggers)", () => {
    // import { lumosPreset } from '@/presets/lumos.preset';
    // const registry = createRuleRegistry();
    // registry.registerRules(lumosPreset.rules);
    // const analyzer = createUtilityClassAnalyzer();
    // const runner = createRuleRunner(registry as any, analyzer);
    // const allStyles = toAllStyles(['foo', 'is-active']);
    // analyzer.buildPropertyMaps(allStyles);
    // const results = runner.runRulesOnStylesWithContext(
    //   toStylesWithElement('el-1', ['foo', 'is-active']),
    //   { 'el-1': [] },
    //   allStyles
    // );
    // expect(results.length).toBeGreaterThan(0);
  });
});
