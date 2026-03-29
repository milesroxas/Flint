/**
 * Fixture Integration Tests
 *
 * These tests exercise the full linter pipeline end-to-end:
 *   Preset → Grammar → Rule Registry → Rule Runner → Results
 *
 * Each test uses a realistic page fixture and verifies that the correct
 * violations (or lack thereof) are produced. This is the linter equivalent
 * of ESLint's RuleTester with full config — testing rules in context, not
 * in isolation.
 *
 * Why: Unit tests verify individual rules work. Integration tests verify
 * that rules, registries, executors, and grammars compose correctly when
 * the full pipeline runs on a real page structure.
 */
import { describe, expect, it } from "vitest";
import {
  clientFirstCleanPage,
  clientFirstPaddingGlobalChildDriftPage,
  clientFirstViolationsPage,
  lumosCleanPage,
  lumosViolationsPage,
  type PageFixture,
} from "@/__tests__/fixtures/pages";
import { clientFirstClassType, lumosClassType } from "@/__tests__/helpers/factories";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { clientFirstPreset } from "@/features/linter/presets/client-first.preset";
import { lumosPreset } from "@/features/linter/presets/lumos.preset";
import { createUtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";
import { createRuleRegistry } from "@/features/linter/services/rule-registry";
import { createRuleRunner } from "@/features/linter/services/rule-runner";

// ── Helpers ────────────────────────────────────────────────────────

type PresetConfig = {
  preset: typeof lumosPreset | typeof clientFirstPreset;
  classTypeResolver: (name: string, isCombo?: boolean) => import("@/features/linter/model/rule.types").ClassType;
  grammar: typeof lumosGrammar | typeof clientFirstGrammar;
};

/**
 * Run the full linter pipeline against a page fixture and return results.
 */
function runPipeline(fixture: PageFixture, config: PresetConfig): RuleResult[] {
  const registry = createRuleRegistry();
  const { preset, classTypeResolver, grammar } = config;

  // Register all rules from preset (element/class-scope)
  for (const rule of preset.rules) {
    if (rule.type === "page") {
      registry.registerPageRule(rule);
    } else {
      registry.registerRule(rule);
    }
  }

  const utilityAnalyzer = createUtilityClassAnalyzer({
    isUtilityName: (name) => classTypeResolver(name) === "utility",
  });

  // Build property maps from all styles in the fixture
  utilityAnalyzer.buildPropertyMaps(fixture.styles);

  const runner = createRuleRunner(registry, utilityAnalyzer, classTypeResolver);

  return runner.runRulesOnStylesWithContext(
    fixture.styles,
    {} as Record<string, never[]>,
    fixture.styles,
    fixture.rolesByElement,
    (id) => fixture.parentMap[id] ?? null,
    (id) => fixture.childrenMap[id] ?? [],
    (id) => {
      const ancestors: string[] = [];
      let cur = fixture.parentMap[id] ?? null;
      while (cur) {
        ancestors.push(cur);
        cur = fixture.parentMap[cur] ?? null;
      }
      return ancestors;
    },
    (name) => grammar.parse(name),
    undefined,
    (id) => fixture.tagMap[id] ?? null,
    (id) => fixture.elementTypeMap[id] ?? null,
    false,
    grammar.elementSeparator
  );
}

const lumosConfig: PresetConfig = {
  preset: lumosPreset,
  classTypeResolver: lumosClassType,
  grammar: lumosGrammar,
};

const cfConfig: PresetConfig = {
  preset: clientFirstPreset,
  classTypeResolver: clientFirstClassType,
  grammar: clientFirstGrammar,
};

// ── Lumos integration tests ────────────────────────────────────────

describe("Fixture Integration: Lumos preset", () => {
  it("produces zero violations on a clean page", () => {
    const results = runPipeline(lumosCleanPage, lumosConfig);
    expect(
      results,
      `Expected zero violations but got: ${results.map((r) => `[${r.ruleId}] ${r.message}`).join("\n")}`
    ).toEqual([]);
  });

  it("detects naming violations (single-segment class)", () => {
    const results = runPipeline(lumosViolationsPage, lumosConfig);
    const namingViolations = results.filter((r) => r.ruleId.includes("naming"));
    expect(namingViolations.length).toBeGreaterThanOrEqual(1);
    expect(namingViolations.some((v) => v.className === "heading")).toBe(true);
  });

  it("detects property violations (hardcoded color)", () => {
    const results = runPipeline(lumosViolationsPage, lumosConfig);
    const colorViolations = results.filter((r) => r.ruleId === "shared:property:color-variable");
    expect(colorViolations.length).toBeGreaterThanOrEqual(1);
    expect(colorViolations.some((v) => v.className === "hero_primary_img")).toBe(true);
  });

  it("detects structure violations (missing class on div)", () => {
    const results = runPipeline(lumosViolationsPage, lumosConfig);
    const structureViolations = results.filter((r) => r.ruleId === "shared:structure:missing-class-on-div");
    expect(structureViolations.length).toBeGreaterThanOrEqual(1);
    expect(structureViolations.some((v) => v.elementId === "el-unclassed-div")).toBe(true);
  });

  it("returns results with correct severity types", () => {
    const results = runPipeline(lumosViolationsPage, lumosConfig);
    for (const result of results) {
      expect(["suggestion", "warning", "error"]).toContain(result.severity);
    }
  });

  it("attaches elementId metadata to every result", () => {
    const results = runPipeline(lumosViolationsPage, lumosConfig);
    for (const result of results) {
      expect(result.elementId).toBeDefined();
      expect(typeof result.elementId).toBe("string");
    }
  });
});

// ── Client-First integration tests ────────────────────────────────

describe("Fixture Integration: Client-First preset", () => {
  it("produces zero violations on a clean page", () => {
    const results = runPipeline(clientFirstCleanPage, cfConfig);
    expect(
      results,
      `Expected zero violations but got: ${results.map((r) => `[${r.ruleId}] ${r.message}`).join("\n")}`
    ).toEqual([]);
  });

  it("detects naming violations (uppercase custom class)", () => {
    const results = runPipeline(clientFirstViolationsPage, cfConfig);
    const namingViolations = results.filter((r) => r.ruleId.includes("naming"));
    expect(namingViolations.length).toBeGreaterThanOrEqual(1);
    expect(namingViolations.some((v) => v.className === "Hero_Title")).toBe(true);
  });

  it("detects property violations (hardcoded color)", () => {
    const results = runPipeline(clientFirstViolationsPage, cfConfig);
    const colorViolations = results.filter((r) => r.ruleId === "shared:property:color-variable");
    expect(colorViolations.length).toBeGreaterThanOrEqual(1);
    expect(colorViolations.some((v) => v.className === "Hero_Title")).toBe(true);
  });

  it("detects structure violations (missing class on div)", () => {
    const results = runPipeline(clientFirstViolationsPage, cfConfig);
    const structureViolations = results.filter((r) => r.ruleId === "shared:structure:missing-class-on-div");
    expect(structureViolations.length).toBeGreaterThanOrEqual(1);
    expect(structureViolations.some((v) => v.elementId === "el-unclassed-div")).toBe(true);
  });

  it("flags padding-global child with custom container-like CSS (integration)", () => {
    const results = runPipeline(clientFirstPaddingGlobalChildDriftPage, cfConfig);
    const drift = results.filter((r) => r.ruleId === "cf:structure:padding-global-child-container");
    expect(drift).toHaveLength(1);
    expect(drift[0].elementId).toBe("el-drift");
    expect(drift[0].className).toBe("hero_custom-inner");
  });

  it("returns results with correct severity types", () => {
    const results = runPipeline(clientFirstViolationsPage, cfConfig);
    for (const result of results) {
      expect(["suggestion", "warning", "error"]).toContain(result.severity);
    }
  });

  it("attaches elementId metadata to every result", () => {
    const results = runPipeline(clientFirstViolationsPage, cfConfig);
    for (const result of results) {
      expect(result.elementId).toBeDefined();
      expect(typeof result.elementId).toBe("string");
    }
  });
});

// ── Pipeline correctness tests ─────────────────────────────────────

describe("Fixture Integration: Pipeline correctness", () => {
  it("rule registry seeds all rules from the Lumos preset", () => {
    const registry = createRuleRegistry();
    for (const rule of lumosPreset.rules) {
      if (rule.type === "page") registry.registerPageRule(rule);
      else registry.registerRule(rule);
    }
    expect(registry.getAllRules().length + registry.getPageRules().length).toBe(lumosPreset.rules.length);
  });

  it("rule registry seeds all rules from the Client-First preset", () => {
    const registry = createRuleRegistry();
    for (const rule of clientFirstPreset.rules) {
      if (rule.type === "page") registry.registerPageRule(rule);
      else registry.registerRule(rule);
    }
    expect(registry.getAllRules().length + registry.getPageRules().length).toBe(clientFirstPreset.rules.length);
  });

  it("disabled rules produce no violations", () => {
    const registry = createRuleRegistry();
    for (const rule of lumosPreset.rules) {
      if (rule.type === "page") registry.registerPageRule(rule);
      else registry.registerRule(rule);
    }

    // Disable all rules
    for (const rule of lumosPreset.rules) {
      registry.updateRuleConfiguration(rule.id, { enabled: false });
    }

    const utilityAnalyzer = createUtilityClassAnalyzer();
    const runner = createRuleRunner(registry, utilityAnalyzer, lumosClassType);

    const results = runner.runRulesOnStylesWithContext(
      lumosViolationsPage.styles,
      {} as Record<string, never[]>,
      lumosViolationsPage.styles,
      lumosViolationsPage.rolesByElement,
      (id) => lumosViolationsPage.parentMap[id] ?? null,
      (id) => lumosViolationsPage.childrenMap[id] ?? [],
      (id) => {
        const ancestors: string[] = [];
        let cur = lumosViolationsPage.parentMap[id] ?? null;
        while (cur) {
          ancestors.push(cur);
          cur = lumosViolationsPage.parentMap[cur] ?? null;
        }
        return ancestors;
      },
      (name) => lumosGrammar.parse(name),
      undefined,
      (id) => lumosViolationsPage.tagMap[id] ?? null,
      (id) => lumosViolationsPage.elementTypeMap[id] ?? null,
      false,
      lumosGrammar.elementSeparator
    );

    expect(results).toEqual([]);
  });

  it("severity overrides are reflected in results", () => {
    const registry = createRuleRegistry();
    for (const rule of lumosPreset.rules) {
      if (rule.type === "page") registry.registerPageRule(rule);
      else registry.registerRule(rule);
    }

    // Override color-variable to "suggestion"
    registry.updateRuleConfiguration("shared:property:color-variable", {
      severity: "suggestion",
    });

    const utilityAnalyzer = createUtilityClassAnalyzer();
    const runner = createRuleRunner(registry, utilityAnalyzer, lumosClassType);

    const results = runner.runRulesOnStylesWithContext(
      lumosViolationsPage.styles,
      {} as Record<string, never[]>,
      lumosViolationsPage.styles,
      lumosViolationsPage.rolesByElement,
      (id) => lumosViolationsPage.parentMap[id] ?? null,
      (id) => lumosViolationsPage.childrenMap[id] ?? [],
      (id) => {
        const ancestors: string[] = [];
        let cur = lumosViolationsPage.parentMap[id] ?? null;
        while (cur) {
          ancestors.push(cur);
          cur = lumosViolationsPage.parentMap[cur] ?? null;
        }
        return ancestors;
      },
      (name) => lumosGrammar.parse(name),
      undefined,
      (id) => lumosViolationsPage.tagMap[id] ?? null,
      (id) => lumosViolationsPage.elementTypeMap[id] ?? null,
      false,
      lumosGrammar.elementSeparator
    );

    const colorResults = results.filter((r) => r.ruleId === "shared:property:color-variable");
    for (const r of colorResults) {
      expect(r.severity).toBe("suggestion");
    }
  });
});
