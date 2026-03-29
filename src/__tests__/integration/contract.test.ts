/**
 * Contract Tests
 *
 * Verify that every rule, preset, and service adheres to the interfaces
 * and invariants defined by the system's type contracts. These tests
 * catch violations that TypeScript alone cannot:
 *
 * - Rules must have non-empty IDs, names, and descriptions
 * - Rule IDs must be unique within a preset
 * - NamingRules must implement test() and target at least one class type
 * - PropertyRules must implement analyze()
 * - Structure/Composition rules must implement analyzeElement()
 * - PageRules must implement analyzePage()
 * - Presets must include a grammar and at least one rule
 * - Rule results must conform to the RuleResult shape
 *
 * Why: Like ESLint's rule meta validation and Biome's diagnostic contract
 * tests — ensures that every rule in the system is well-formed and that
 * adding a new rule doesn't silently break pipeline assumptions.
 */
import { describe, expect, it } from "vitest";

import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import type {
  CompositionRule,
  NamingRule,
  PageRule,
  PropertyRule,
  Rule,
  StructureRule,
} from "@/features/linter/model/rule.types";
import { clientFirstPreset } from "@/features/linter/presets/client-first.preset";
import { lumosPreset } from "@/features/linter/presets/lumos.preset";
import { createMainChildrenPageRule } from "@/features/linter/rules/canonical/main-children.page";
import { createUtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";
import { createNamingRuleExecutor } from "@/features/linter/services/executors/naming-rule-executor";
import { createPropertyRuleExecutor } from "@/features/linter/services/executors/property-rule-executor";
import { createRuleRegistry } from "@/features/linter/services/rule-registry";

// ── Helpers ────────────────────────────────────────────────────────

const allPresets = [
  { name: "Lumos", preset: lumosPreset },
  { name: "Client-First", preset: clientFirstPreset },
] as const;

const allGrammars = [
  { name: "Lumos", grammar: lumosGrammar },
  { name: "Client-First", grammar: clientFirstGrammar },
] as const;

function isNamingRule(rule: Rule): rule is NamingRule {
  return rule.type === "naming";
}
function isPropertyRule(rule: Rule): rule is PropertyRule {
  return rule.type === "property";
}
function isStructureRule(rule: Rule): rule is StructureRule {
  return rule.type === "structure";
}
function isCompositionRule(rule: Rule): rule is CompositionRule {
  return rule.type === "composition";
}

// ── Rule contract tests ────────────────────────────────────────────

describe("Contract: Rule shape invariants", () => {
  for (const { name, preset } of allPresets) {
    describe(`${name} preset rules`, () => {
      it("every rule has a non-empty id, name, and description", () => {
        for (const rule of preset.rules) {
          expect(rule.id, `Rule missing id in ${name}`).toBeTruthy();
          expect(rule.name, `Rule ${rule.id} missing name`).toBeTruthy();
          expect(rule.description, `Rule ${rule.id} missing description`).toBeTruthy();
          expect(typeof rule.id).toBe("string");
          expect(typeof rule.name).toBe("string");
          expect(typeof rule.description).toBe("string");
        }
      });

      it("every rule has a valid type", () => {
        const validTypes = ["naming", "property", "structure", "composition", "page"];
        for (const rule of preset.rules) {
          expect(validTypes, `Rule ${rule.id} has invalid type "${rule.type}"`).toContain(rule.type);
        }
      });

      it("every rule has a valid severity", () => {
        const validSeverities = ["suggestion", "warning", "error"];
        for (const rule of preset.rules) {
          expect(validSeverities, `Rule ${rule.id} has invalid severity "${rule.severity}"`).toContain(rule.severity);
        }
      });

      it("every rule has a valid category", () => {
        const validCategories = [
          "structure",
          "format",
          "composition",
          "semantics",
          "performance",
          "accessibility",
          "maintainability",
          "custom",
        ];
        for (const rule of preset.rules) {
          expect(validCategories, `Rule ${rule.id} has invalid category "${rule.category}"`).toContain(rule.category);
        }
      });

      it("rule IDs are unique within the preset", () => {
        const ids = preset.rules.map((r) => r.id);
        const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
        expect(duplicates, `Duplicate rule IDs: ${duplicates.join(", ")}`).toEqual([]);
      });

      it("every rule has a boolean enabled field", () => {
        for (const rule of preset.rules) {
          expect(typeof rule.enabled, `Rule ${rule.id} enabled is not boolean`).toBe("boolean");
        }
      });
    });
  }
});

// ── Rule-type-specific contracts ───────────────────────────────────

describe("Contract: NamingRule interface", () => {
  for (const { name, preset } of allPresets) {
    const namingRules = preset.rules.filter(isNamingRule);

    if (namingRules.length === 0) continue;

    describe(`${name} naming rules`, () => {
      it("every naming rule has a test() function", () => {
        for (const rule of namingRules) {
          expect(typeof rule.test, `Rule ${rule.id} missing test()`).toBe("function");
        }
      });

      it("every naming rule targets at least one class type", () => {
        for (const rule of namingRules) {
          expect(rule.targetClassTypes.length, `Rule ${rule.id} targets zero class types`).toBeGreaterThan(0);
        }
      });

      it("test() returns a boolean", () => {
        for (const rule of namingRules) {
          const result = rule.test("test_class");
          expect(typeof result, `Rule ${rule.id}.test() did not return boolean`).toBe("boolean");
        }
      });

      it("evaluate() returns null or a valid RuleResult shape", () => {
        for (const rule of namingRules) {
          if (!rule.evaluate) continue;

          const result = rule.evaluate("test_class", {
            allStyles: [],
            utilityClassPropertiesMap: new Map(),
            propertyToClassesMap: new Map(),
          });

          if (result === null || result === undefined) continue;

          expect(result.ruleId, `Rule ${rule.id}.evaluate() result missing ruleId`).toBeTruthy();
          expect(result.message, `Rule ${rule.id}.evaluate() result missing message`).toBeTruthy();
          expect(typeof result.className).toBe("string");
          expect(typeof result.isCombo).toBe("boolean");
        }
      });
    });
  }
});

describe("Contract: PropertyRule interface", () => {
  for (const { name, preset } of allPresets) {
    const propertyRules = preset.rules.filter(isPropertyRule);

    if (propertyRules.length === 0) continue;

    describe(`${name} property rules`, () => {
      it("every property rule has an analyze() function", () => {
        for (const rule of propertyRules) {
          expect(typeof rule.analyze, `Rule ${rule.id} missing analyze()`).toBe("function");
        }
      });

      it("every property rule targets at least one class type", () => {
        for (const rule of propertyRules) {
          expect(rule.targetClassTypes.length, `Rule ${rule.id} targets zero class types`).toBeGreaterThan(0);
        }
      });

      it("analyze() returns an array", () => {
        for (const rule of propertyRules) {
          const result = rule.analyze(
            "test-class",
            {},
            {
              allStyles: [],
              utilityClassPropertiesMap: new Map(),
              propertyToClassesMap: new Map(),
            }
          );
          expect(Array.isArray(result), `Rule ${rule.id}.analyze() did not return array`).toBe(true);
        }
      });
    });
  }
});

describe("Contract: StructureRule / CompositionRule interface", () => {
  for (const { name, preset } of allPresets) {
    const elementRules = preset.rules.filter(
      (r): r is StructureRule | CompositionRule => isStructureRule(r) || isCompositionRule(r)
    );

    if (elementRules.length === 0) continue;

    describe(`${name} element-scope rules`, () => {
      it("every element-scope rule has analyzeElement()", () => {
        for (const rule of elementRules) {
          expect(typeof rule.analyzeElement, `Rule ${rule.id} missing analyzeElement()`).toBe("function");
        }
      });

      it("analyzeElement() returns an array when called with minimal args", () => {
        for (const rule of elementRules) {
          const result = rule.analyzeElement({
            elementId: "test",
            classes: [],
            allStyles: [],
            getClassType: () => "custom",
            getRuleConfig: () => undefined,
          });
          expect(Array.isArray(result), `Rule ${rule.id}.analyzeElement() did not return array`).toBe(true);
        }
      });
    });
  }
});

describe("Contract: PageRule interface", () => {
  // Page rules are registered separately from presets (canonical rules).
  const canonicalPageRules = [createMainChildrenPageRule()];

  it("every page rule has analyzePage()", () => {
    for (const rule of canonicalPageRules) {
      expect(typeof rule.analyzePage, `Rule ${rule.id} missing analyzePage()`).toBe("function");
    }
  });

  it("analyzePage() returns an array when called with empty page", () => {
    for (const rule of canonicalPageRules) {
      const result = rule.analyzePage({
        rolesByElement: {},
        graph: {
          getParentId: () => null,
          getChildrenIds: () => [],
          getAncestorIds: () => [],
          getDescendantIds: () => [],
          getTag: async () => null,
        },
        styles: [],
        getRoleForElement: () => "unknown",
        getRuleConfig: (ruleId: string) => ({
          ruleId,
          enabled: true,
          severity: "error",
          customSettings: {} as any,
        }),
        getTagName: () => null,
        getElementType: () => null,
      });
      expect(Array.isArray(result), `Rule ${rule.id}.analyzePage() did not return array`).toBe(true);
    }
  });

  it("page rules have valid metadata", () => {
    for (const rule of canonicalPageRules) {
      expect(rule.id).toBeTruthy();
      expect(rule.name).toBeTruthy();
      expect(rule.type).toBe("page");
      expect(["suggestion", "warning", "error"]).toContain(rule.severity);
    }
  });
});

// ── Preset contract tests ──────────────────────────────────────────

describe("Contract: Preset structure", () => {
  for (const { name, preset } of allPresets) {
    describe(`${name} preset`, () => {
      it("has a non-empty id", () => {
        expect(preset.id).toBeTruthy();
        expect(typeof preset.id).toBe("string");
      });

      it("includes a grammar adapter", () => {
        expect(preset.grammar).toBeDefined();
        expect(typeof preset.grammar?.parse).toBe("function");
        expect(typeof preset.grammar?.elementSeparator).toBe("string");
      });

      it("includes at least one rule", () => {
        expect(preset.rules.length).toBeGreaterThan(0);
      });

      it("includes role detectors", () => {
        expect(Array.isArray(preset.roleDetectors)).toBe(true);
        expect((preset.roleDetectors ?? []).length).toBeGreaterThan(0);
      });

      it("each role detector has id and detect()", () => {
        for (const detector of preset.roleDetectors ?? []) {
          expect(detector.id).toBeTruthy();
          expect(typeof detector.detect).toBe("function");
        }
      });

      it("has role detection config with threshold", () => {
        expect(preset.roleDetectionConfig).toBeDefined();
        const threshold = preset.roleDetectionConfig?.threshold ?? 0;
        expect(typeof threshold).toBe("number");
        expect(threshold).toBeGreaterThan(0);
        expect(threshold).toBeLessThanOrEqual(1);
      });
    });
  }
});

// ── Grammar contract tests ─────────────────────────────────────────

describe("Contract: Grammar adapter", () => {
  for (const { name, grammar } of allGrammars) {
    describe(`${name} grammar`, () => {
      it("has a non-empty id", () => {
        expect(grammar.id).toBeTruthy();
      });

      it("parse() returns a ParsedClass with raw and kind", () => {
        const result = grammar.parse("test_class");
        expect(result.raw).toBe("test_class");
        expect(result.kind).toBeTruthy();
      });

      it("parse() handles utility prefix", () => {
        const result = grammar.parse("u-hidden");
        expect(result.kind).toBe("utility");
      });

      it("parse() handles combo prefix", () => {
        const result = grammar.parse("is-active");
        expect(result.kind).toBe("combo");
      });

      it("parse() returns tokens for custom classes", () => {
        const result = grammar.parse("hero_primary_wrap");
        expect(result.kind).toBe("custom");
        expect(result.tokens).toBeDefined();
        expect((result.tokens ?? []).length).toBeGreaterThanOrEqual(2);
      });

      it("parse() returns componentKey for wrapper classes", () => {
        const result = grammar.parse("hero_primary_wrap");
        expect(result.componentKey).toBeTruthy();
      });

      it("has defined separators and prefixes", () => {
        expect(typeof grammar.elementSeparator).toBe("string");
        expect(grammar.elementSeparator.length).toBeGreaterThan(0);
      });
    });
  }
});

// ── Service contract tests ─────────────────────────────────────────

describe("Contract: RuleRegistry", () => {
  it("getAllRules() returns empty array on fresh registry", () => {
    const registry = createRuleRegistry();
    expect(registry.getAllRules()).toEqual([]);
  });

  it("registerRule stores and retrieves rule by ID", () => {
    const registry = createRuleRegistry();
    const mockRule: Rule = {
      id: "test-rule",
      name: "Test Rule",
      description: "A test",
      type: "structure",
      severity: "warning",
      enabled: true,
      category: "structure",
      analyzeElement: () => [],
    } as StructureRule;

    registry.registerRule(mockRule);
    expect(registry.getRule("test-rule")).toBe(mockRule);
  });

  it("creates default configuration on registration", () => {
    const registry = createRuleRegistry();
    const mockRule: Rule = {
      id: "test-rule",
      name: "Test",
      description: "Test",
      type: "structure",
      severity: "error",
      enabled: true,
      category: "structure",
      analyzeElement: () => [],
    } as StructureRule;

    registry.registerRule(mockRule);
    const config = registry.getRuleConfiguration("test-rule");
    expect(config).toBeDefined();
    expect(config?.enabled).toBe(true);
    expect(config?.severity).toBe("error");
  });

  it("updateRuleConfiguration merges correctly", () => {
    const registry = createRuleRegistry();
    const mockRule: Rule = {
      id: "test-rule",
      name: "Test",
      description: "Test",
      type: "structure",
      severity: "error",
      enabled: true,
      category: "structure",
      analyzeElement: () => [],
    } as StructureRule;

    registry.registerRule(mockRule);
    registry.updateRuleConfiguration("test-rule", { severity: "warning", enabled: false });

    const config = registry.getRuleConfiguration("test-rule");
    expect(config?.severity).toBe("warning");
    expect(config?.enabled).toBe(false);
  });

  it("clear() removes all rules and configurations", () => {
    const registry = createRuleRegistry();
    registry.registerRule({
      id: "r1",
      name: "R",
      description: "R",
      type: "structure",
      severity: "error",
      enabled: true,
      category: "structure",
      analyzeElement: () => [],
    } as StructureRule);

    registry.clear();
    expect(registry.getAllRules()).toEqual([]);
    expect(registry.getRuleConfiguration("r1")).toBeUndefined();
  });

  it("getRulesByClassType filters correctly", () => {
    const registry = createRuleRegistry();
    registry.registerRule({
      id: "naming-1",
      name: "N",
      description: "N",
      type: "naming",
      severity: "error",
      enabled: true,
      category: "format",
      targetClassTypes: ["custom"],
      test: () => true,
    } as NamingRule);

    registry.registerRule({
      id: "naming-2",
      name: "N2",
      description: "N2",
      type: "naming",
      severity: "error",
      enabled: true,
      category: "format",
      targetClassTypes: ["utility"],
      test: () => true,
    } as NamingRule);

    const customRules = registry.getRulesByClassType("custom");
    expect(customRules).toHaveLength(1);
    expect(customRules[0].id).toBe("naming-1");
  });

  it("page rules are stored separately from element rules", () => {
    const registry = createRuleRegistry();
    registry.registerRule({
      id: "element-rule",
      name: "E",
      description: "E",
      type: "structure",
      severity: "error",
      enabled: true,
      category: "structure",
      analyzeElement: () => [],
    } as StructureRule);

    registry.registerPageRule({
      id: "page-rule",
      name: "P",
      description: "P",
      type: "page",
      severity: "error",
      enabled: true,
      category: "structure",
      analyzePage: () => [],
    } as PageRule);

    expect(registry.getAllRules()).toHaveLength(1);
    expect(registry.getPageRules()).toHaveLength(1);
    expect(registry.getAllRules()[0].id).toBe("element-rule");
    expect(registry.getPageRules()[0].id).toBe("page-rule");
  });
});

describe("Contract: UtilityClassAnalyzer", () => {
  it("starts with empty maps", () => {
    const analyzer = createUtilityClassAnalyzer();
    expect(analyzer.getUtilityClassPropertiesMap().size).toBe(0);
    expect(analyzer.getPropertyToClassesMap().size).toBe(0);
  });

  it("buildPropertyMaps indexes styles correctly", () => {
    const analyzer = createUtilityClassAnalyzer();
    analyzer.buildPropertyMaps([
      { id: "s1", name: "u-red", properties: { color: "red" }, order: 0, isCombo: false },
      { id: "s2", name: "u-blue", properties: { color: "blue" }, order: 1, isCombo: false },
    ]);

    expect(analyzer.getUtilityClassPropertiesMap().size).toBe(2);
    expect(analyzer.getPropertyToClassesMap().size).toBe(2);
  });

  it("reset() clears all maps", () => {
    const analyzer = createUtilityClassAnalyzer();
    analyzer.buildPropertyMaps([{ id: "s1", name: "u-red", properties: { color: "red" }, order: 0, isCombo: false }]);
    analyzer.reset();
    expect(analyzer.getUtilityClassPropertiesMap().size).toBe(0);
  });

  it("caches results when styles haven't changed", () => {
    const analyzer = createUtilityClassAnalyzer();
    const styles = [{ id: "s1", name: "u-red", properties: { color: "red" }, order: 0, isCombo: false }];
    analyzer.buildPropertyMaps(styles);
    const map1 = analyzer.getUtilityClassPropertiesMap();

    // Call again with same styles — should be cached
    analyzer.buildPropertyMaps(styles);
    const map2 = analyzer.getUtilityClassPropertiesMap();

    expect(map1).toBe(map2); // Same reference = cache hit
  });

  it("respects isUtilityName classifier", () => {
    const analyzer = createUtilityClassAnalyzer({
      isUtilityName: (name) => name.startsWith("u-"),
    });

    analyzer.buildPropertyMaps([
      { id: "s1", name: "u-red", properties: { color: "red" }, order: 0, isCombo: false },
      { id: "s2", name: "hero_text", properties: { color: "blue" }, order: 1, isCombo: false },
    ]);

    // Only the utility class should be indexed
    expect(analyzer.getUtilityClassPropertiesMap().has("u-red")).toBe(true);
    expect(analyzer.getUtilityClassPropertiesMap().has("hero_text")).toBe(false);
  });
});

describe("Contract: NamingRuleExecutor", () => {
  it("returns empty array for passing test", () => {
    const executor = createNamingRuleExecutor();
    const result = executor(
      {
        id: "test",
        name: "Test",
        description: "Test",
        type: "naming",
        severity: "error",
        enabled: true,
        category: "format",
        targetClassTypes: ["custom"],
        test: () => true,
      },
      {
        className: "hero_wrap",
        severityDefault: "error",
      },
      {
        getClassType: () => "custom",
      }
    );
    expect(result).toEqual([]);
  });

  it("returns violation for failing test", () => {
    const executor = createNamingRuleExecutor();
    const result = executor(
      {
        id: "test",
        name: "Test",
        description: "Test rule",
        type: "naming",
        severity: "error",
        enabled: true,
        category: "format",
        targetClassTypes: ["custom"],
        test: () => false,
      },
      {
        className: "bad-class",
        severityDefault: "error",
      },
      {
        getClassType: () => "custom",
      }
    );
    expect(result).toHaveLength(1);
    expect(result[0].ruleId).toBe("test");
    expect(result[0].className).toBe("bad-class");
  });

  it("skips utility classes when rule does not target them", () => {
    const executor = createNamingRuleExecutor();
    const result = executor(
      {
        id: "test",
        name: "Test",
        description: "Test",
        type: "naming",
        severity: "error",
        enabled: true,
        category: "format",
        targetClassTypes: ["custom"],
        test: () => false,
      },
      {
        className: "u-hidden",
        severityDefault: "error",
      },
      {
        getClassType: () => "utility",
      }
    );
    expect(result).toEqual([]);
  });
});

describe("Contract: PropertyRuleExecutor", () => {
  it("delegates to rule.analyze() and returns results", () => {
    const registry = createRuleRegistry();
    const analyzer = createUtilityClassAnalyzer();

    const rule: PropertyRule = {
      id: "test-prop",
      name: "Test Prop",
      description: "Test",
      type: "property",
      severity: "warning",
      enabled: true,
      category: "maintainability",
      targetClassTypes: ["custom"],
      analyze: (className, properties) => {
        if (properties.color === "red") {
          return [
            {
              ruleId: "test-prop",
              name: "Test Prop",
              message: "Red is not allowed",
              severity: "warning",
              className,
              isCombo: false,
            },
          ];
        }
        return [];
      },
    };

    registry.registerRule(rule);
    const executor = createPropertyRuleExecutor(registry, analyzer);

    const results = executor(rule, "test-class", { color: "red" }, "warning", []);

    expect(results).toHaveLength(1);
    expect(results[0].ruleId).toBe("test-prop");
  });
});
