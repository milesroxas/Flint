/**
 * Parity Tests
 *
 * Verify that shared rules produce equivalent results across both presets.
 * When the same rule (e.g., color-variable, missing-class-on-div) runs
 * against semantically equivalent input in Lumos vs Client-First, the
 * rule ID, violation count, and severity must match.
 *
 * Why: Shared rules are preset-agnostic by design. These tests guard
 * against regressions where a shared rule accidentally becomes
 * preset-dependent through implicit coupling.
 *
 * Pattern: Inspired by how Biome tests cross-language consistency —
 * same semantic scenario, different syntax, same diagnostic.
 */
import { describe, expect, it } from "vitest";
import {
  clientFirstClassType,
  createElementAnalysisArgs,
  createRuleContext,
  lumosClassType,
} from "@/__tests__/helpers/factories";
import type { StyleInfo } from "@/entities/style/model/style.types";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import type { RuleResult } from "@/features/linter/model/rule.types";
import {
  createColorVariableRule,
  createDuplicateOfUtilityRule,
  type createUtilityDuplicatePropertyRule,
} from "@/features/linter/rules/shared/property";
import { createMissingClassOnDivRule } from "@/features/linter/rules/shared/structure";

// ── Parity helper ──────────────────────────────────────────────────

interface ParityScenario {
  name: string;
  lumos: { classNames: string[]; styles?: StyleInfo[] };
  clientFirst: { classNames: string[]; styles?: StyleInfo[] };
}

/**
 * Run a shared rule against both preset-flavored inputs and
 * return the results for comparison.
 */
function runParityTest(
  ruleFactory: () =>
    | ReturnType<typeof createColorVariableRule>
    | ReturnType<typeof createMissingClassOnDivRule>
    | ReturnType<typeof createDuplicateOfUtilityRule>
    | ReturnType<typeof createUtilityDuplicatePropertyRule>,
  scenario: ParityScenario & {
    lumosElementType?: string;
    cfElementType?: string;
    lumosStyles?: StyleInfo[];
    cfStyles?: StyleInfo[];
  }
): { lumos: RuleResult[]; clientFirst: RuleResult[] } {
  const rule = ruleFactory();

  const lumosStyles = scenario.lumosStyles ?? scenario.lumos.styles ?? [];
  const cfStyles = scenario.cfStyles ?? scenario.clientFirst.styles ?? [];

  if (rule.type === "property" && "analyze" in rule) {
    // Property rules: run analyze() directly
    const lumosResults: RuleResult[] = [];
    const cfResults: RuleResult[] = [];

    for (const className of scenario.lumos.classNames) {
      const style = lumosStyles.find((s) => s.name === className);
      const props = (style?.properties ?? {}) as Record<string, unknown>;
      lumosResults.push(...rule.analyze(className, props, createRuleContext({ allStyles: lumosStyles })));
    }

    for (const className of scenario.clientFirst.classNames) {
      const style = cfStyles.find((s) => s.name === className);
      const props = (style?.properties ?? {}) as Record<string, unknown>;
      cfResults.push(...rule.analyze(className, props, createRuleContext({ allStyles: cfStyles })));
    }

    return { lumos: lumosResults, clientFirst: cfResults };
  }

  if ("analyzeElement" in rule && typeof rule.analyzeElement === "function") {
    // Structure/composition rules: run analyzeElement()
    const lumosArgs = createElementAnalysisArgs({
      classes: scenario.lumos.classNames.map((cn, i) => ({ className: cn, order: i })),
      allStyles: lumosStyles,
      classTypeResolver: lumosClassType,
      elementTypeMap: { "test-element": scenario.lumosElementType ?? "Block" },
    });

    const cfArgs = createElementAnalysisArgs({
      classes: scenario.clientFirst.classNames.map((cn, i) => ({ className: cn, order: i })),
      allStyles: cfStyles,
      classTypeResolver: clientFirstClassType,
      elementTypeMap: { "test-element": scenario.cfElementType ?? "Block" },
    });

    return {
      lumos: rule.analyzeElement(lumosArgs),
      clientFirst: rule.analyzeElement(cfArgs),
    };
  }

  return { lumos: [], clientFirst: [] };
}

// ── Color variable parity ──────────────────────────────────────────

describe("Parity: shared:property:color-variable", () => {
  const factory = createColorVariableRule;

  it("both presets flag hardcoded hex colors identically", () => {
    const styles: StyleInfo[] = [
      { id: "s1", name: "test-class", properties: { "background-color": "#ff0000" }, order: 0, isCombo: false },
    ];

    const { lumos, clientFirst } = runParityTest(factory, {
      name: "hardcoded-hex",
      lumos: { classNames: ["test-class"], styles },
      clientFirst: { classNames: ["test-class"], styles },
    });

    expect(lumos.length).toBe(clientFirst.length);
    expect(lumos.length).toBeGreaterThan(0);
    expect(lumos[0].ruleId).toBe(clientFirst[0].ruleId);
    expect(lumos[0].severity).toBe(clientFirst[0].severity);
  });

  it("both presets pass when color variables are used", () => {
    const styles: StyleInfo[] = [
      {
        id: "s1",
        name: "test-class",
        properties: { "background-color": { id: "variable-blue" } },
        order: 0,
        isCombo: false,
      },
    ];

    const { lumos, clientFirst } = runParityTest(factory, {
      name: "color-variable",
      lumos: { classNames: ["test-class"], styles },
      clientFirst: { classNames: ["test-class"], styles },
    });

    expect(lumos).toEqual([]);
    expect(clientFirst).toEqual([]);
  });

  it("both presets skip transparent and inherit values", () => {
    const styles: StyleInfo[] = [
      {
        id: "s1",
        name: "test-class",
        properties: { color: "transparent", "background-color": "inherit" },
        order: 0,
        isCombo: false,
      },
    ];

    const { lumos, clientFirst } = runParityTest(factory, {
      name: "skip-keywords",
      lumos: { classNames: ["test-class"], styles },
      clientFirst: { classNames: ["test-class"], styles },
    });

    expect(lumos).toEqual([]);
    expect(clientFirst).toEqual([]);
  });

  it("both presets flag rgba colors identically", () => {
    const styles: StyleInfo[] = [
      { id: "s1", name: "test-class", properties: { color: "rgba(255, 0, 0, 1)" }, order: 0, isCombo: false },
    ];

    const { lumos, clientFirst } = runParityTest(factory, {
      name: "rgba-color",
      lumos: { classNames: ["test-class"], styles },
      clientFirst: { classNames: ["test-class"], styles },
    });

    expect(lumos.length).toBe(clientFirst.length);
    expect(lumos.length).toBeGreaterThan(0);
  });
});

// ── Missing class on div parity ────────────────────────────────────

describe("Parity: shared:structure:missing-class-on-div", () => {
  const factory = createMissingClassOnDivRule;

  it("both presets flag classless Block elements identically", () => {
    const { lumos, clientFirst } = runParityTest(factory, {
      name: "classless-block",
      lumos: { classNames: [] },
      clientFirst: { classNames: [] },
      lumosElementType: "Block",
      cfElementType: "Block",
    });

    expect(lumos.length).toBe(clientFirst.length);
    expect(lumos.length).toBe(1);
    expect(lumos[0].ruleId).toBe(clientFirst[0].ruleId);
    expect(lumos[0].ruleId).toBe("shared:structure:missing-class-on-div");
  });

  it("both presets pass when Block has classes", () => {
    const { lumos, clientFirst } = runParityTest(factory, {
      name: "classed-block",
      lumos: { classNames: ["hero_wrap"] },
      clientFirst: { classNames: ["hero_wrapper"] },
      lumosElementType: "Block",
      cfElementType: "Block",
    });

    expect(lumos).toEqual([]);
    expect(clientFirst).toEqual([]);
  });

  it("both presets skip non-Block elements", () => {
    const { lumos, clientFirst } = runParityTest(factory, {
      name: "non-block",
      lumos: { classNames: [] },
      clientFirst: { classNames: [] },
      lumosElementType: "Section",
      cfElementType: "Section",
    });

    expect(lumos).toEqual([]);
    expect(clientFirst).toEqual([]);
  });
});

// ── Duplicate-of-utility parity ────────────────────────────────────

describe("Parity: shared:property:duplicate-of-utility", () => {
  const factory = createDuplicateOfUtilityRule;

  it("both presets flag custom class duplicating a utility", () => {
    // Lumos: utility prefix u-, custom has underscore
    const lumosStyles: StyleInfo[] = [
      { id: "s1", name: "u-red", properties: { color: "red" }, order: 0, isCombo: false },
      { id: "s2", name: "hero_text", properties: { color: "red" }, order: 1, isCombo: false },
    ];

    // CF: utility is dash-only, custom has underscore
    const cfStyles: StyleInfo[] = [
      { id: "s1", name: "text-red", properties: { color: "red" }, order: 0, isCombo: false },
      { id: "s2", name: "hero_text", properties: { color: "red" }, order: 1, isCombo: false },
    ];

    const { lumos, clientFirst } = runParityTest(factory, {
      name: "custom-duplicates-utility",
      lumos: { classNames: ["hero_text"] },
      clientFirst: { classNames: ["hero_text"] },
      lumosStyles,
      cfStyles,
    });

    expect(lumos.length).toBe(clientFirst.length);
    expect(lumos.length).toBe(1);
    expect(lumos[0].ruleId).toBe(clientFirst[0].ruleId);
    expect(lumos[0].ruleId).toBe("shared:property:duplicate-of-utility");
  });

  it("both presets pass when custom class has unique properties", () => {
    const lumosStyles: StyleInfo[] = [
      { id: "s1", name: "u-red", properties: { color: "red" }, order: 0, isCombo: false },
      { id: "s2", name: "hero_text", properties: { "font-size": "2rem" }, order: 1, isCombo: false },
    ];

    const cfStyles: StyleInfo[] = [
      { id: "s1", name: "text-red", properties: { color: "red" }, order: 0, isCombo: false },
      { id: "s2", name: "hero_text", properties: { "font-size": "2rem" }, order: 1, isCombo: false },
    ];

    const { lumos, clientFirst } = runParityTest(factory, {
      name: "unique-properties",
      lumos: { classNames: ["hero_text"] },
      clientFirst: { classNames: ["hero_text"] },
      lumosStyles,
      cfStyles,
    });

    expect(lumos).toEqual([]);
    expect(clientFirst).toEqual([]);
  });
});

// ── Grammar parity ─────────────────────────────────────────────────

describe("Parity: Grammar classification consistency", () => {
  it("both grammars classify utility prefixed classes the same way", () => {
    const utilityClasses = ["u-red", "u-hidden", "u-flex"];
    for (const cls of utilityClasses) {
      const lumosParsed = lumosGrammar.parse(cls);
      const cfParsed = clientFirstGrammar.parse(cls);
      expect(lumosParsed.kind).toBe("utility");
      expect(cfParsed.kind).toBe("utility");
    }
  });

  it("both grammars classify combo prefixed classes the same way", () => {
    const comboClasses = ["is-active", "is-visible", "is-open"];
    for (const cls of comboClasses) {
      const lumosParsed = lumosGrammar.parse(cls);
      const cfParsed = clientFirstGrammar.parse(cls);
      expect(lumosParsed.kind).toBe("combo");
      expect(cfParsed.kind).toBe("combo");
    }
  });

  it("both grammars classify underscore classes as custom", () => {
    const customClasses = ["hero_wrap", "about_text", "nav_link"];
    for (const cls of customClasses) {
      const lumosParsed = lumosGrammar.parse(cls);
      const cfParsed = clientFirstGrammar.parse(cls);
      expect(lumosParsed.kind).toBe("custom");
      expect(cfParsed.kind).toBe("custom");
    }
  });

  it("grammars use different element separators", () => {
    expect(lumosGrammar.elementSeparator).toBe("_");
    expect(clientFirstGrammar.elementSeparator).toBe("-");
  });
});
