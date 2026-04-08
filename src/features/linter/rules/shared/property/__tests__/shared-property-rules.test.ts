import { describe, expect, it } from "vitest";
import type { StyleInfo, StyleWithElement } from "@/entities/style/model/style.types";
import { CF_BUILTIN_UTILITY_CLASSES } from "@/features/linter/grammar/client-first.grammar";
import type { ClassType, ElementAnalysisArgs, ElementClassItem, RuleContext } from "@/features/linter/model/rule.types";
import { createColorVariableRule } from "@/features/linter/rules/shared/property/color-variable";
import { createDuplicateOfUtilityRule } from "@/features/linter/rules/shared/property/utility-duplicate-properties";
import { createUtilityDuplicatePropertyRule } from "@/features/linter/rules/shared/property/utility-duplicate-property";
import { createUtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";
import { createRuleRegistry } from "@/features/linter/services/rule-registry";
import { createRuleRunner } from "@/features/linter/services/rule-runner";

const emptyContext: RuleContext = {
  allStyles: [],
  utilityClassPropertiesMap: new Map(),
  propertyToClassesMap: new Map(),
};

/** Mirrors Client-First grammar classification for class names. */
function clientFirstClassType(name: string, isCombo?: boolean): ClassType {
  if (isCombo === true) return "combo";
  if (name.startsWith("u-")) return "utility";
  if (name.startsWith("c-")) return "custom";
  if (name.startsWith("is-")) return "combo";
  if (name.includes("_")) return "custom";
  return "utility";
}

function elementArgs(
  overrides: Partial<ElementAnalysisArgs> & {
    classes: ElementClassItem[];
    allStyles: StyleInfo[];
  }
): ElementAnalysisArgs {
  return {
    elementId: "el-1",
    ...overrides,
    getClassType: overrides.getClassType ?? ((name: string, combo?: boolean) => clientFirstClassType(name, combo)),
    getRuleConfig: overrides.getRuleConfig ?? (() => undefined),
  };
}

describe("shared:property:color-variable", () => {
  const rule = createColorVariableRule();

  it("flags hardcoded hex on target properties", () => {
    const results = rule.analyze("hero_wrapper", { "background-color": "#ff0000" }, emptyContext);
    expect(results).toHaveLength(1);
    expect(results[0].ruleId).toBe("shared:property:color-variable");
    expect(results[0].severity).toBe("warning");
  });

  it("passes Webflow color variable objects", () => {
    const results = rule.analyze(
      "hero_wrapper",
      { "background-color": { id: "variable-abc123" } as unknown as string },
      emptyContext
    );
    expect(results).toEqual([]);
  });

  it("ignores transparent and unset color channels", () => {
    expect(rule.analyze("x", { color: "transparent" }, emptyContext)).toEqual([]);
    expect(rule.analyze("x", { color: "inherit" }, emptyContext)).toEqual([]);
  });
});

describe("shared:property:duplicate-of-utility (Client-First classification)", () => {
  const rule = createDuplicateOfUtilityRule();

  it("flags a custom class whose declarations match a utility", () => {
    const allStyles: StyleInfo[] = [
      {
        id: "s1",
        name: "text-size-large",
        properties: { "font-size": "3rem", "line-height": "1.2" },
        order: 0,
        isCombo: false,
      },
      {
        id: "s2",
        name: "my_heading",
        properties: { "font-size": "3rem", "line-height": "1.2" },
        order: 1,
        isCombo: false,
      },
    ];

    const args = elementArgs({
      allStyles,
      classes: [{ className: "my_heading", order: 0, elementId: "el-1" }],
    });

    const out = rule.analyzeElement?.(args) ?? [];
    expect(out).toHaveLength(1);
    expect(out[0].ruleId).toBe("shared:property:duplicate-of-utility");
    expect(out[0].message).toContain("text-size-large");
  });

  it("returns empty when no utility baseline exists in allStyles", () => {
    const allStyles: StyleInfo[] = [
      {
        id: "s2",
        name: "my_heading",
        properties: { "font-size": "3rem" },
        order: 0,
        isCombo: false,
      },
    ];
    const args = elementArgs({
      allStyles,
      classes: [{ className: "my_heading", order: 0, elementId: "el-1" }],
    });
    expect(rule.analyzeElement?.(args) ?? []).toEqual([]);
  });
});

describe("canonical:utility-duplicate-property (Client-First preset config)", () => {
  const rule = createUtilityDuplicatePropertyRule({ ignoredClasses: [...CF_BUILTIN_UTILITY_CLASSES] });

  it("flags duplicate single-property utilities not in built-in ignore list", () => {
    const allStyles: StyleInfo[] = [
      {
        id: "a",
        name: "custom-margin-a",
        properties: { "margin-top": "1rem" },
        order: 0,
        isCombo: false,
      },
      {
        id: "b",
        name: "custom-margin-b",
        properties: { "margin-top": "1rem" },
        order: 1,
        isCombo: false,
      },
    ];

    const args = elementArgs({
      allStyles,
      classes: [{ className: "custom-margin-b", order: 1, elementId: "el-1" }],
    });

    const out = rule.analyzeElement(args);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].ruleId).toBe("canonical:utility-duplicate-property");
  });

  it("does not flag utilities that overlap third-party library classes", () => {
    const allStyles: StyleInfo[] = [
      {
        id: "tp",
        name: "swiper-portfolio",
        properties: { display: "block" },
        order: 0,
        isCombo: false,
      },
      {
        id: "u",
        name: "block",
        properties: { display: "block" },
        order: 1,
        isCombo: false,
      },
    ];
    const args = elementArgs({
      allStyles,
      classes: [{ className: "block", order: 1, elementId: "el-1" }],
    });
    expect(rule.analyzeElement?.(args) ?? []).toEqual([]);
  });

  it("does not flag built-in Client-First template utilities that share properties", () => {
    const allStyles: StyleInfo[] = [
      {
        id: "p1",
        name: "padding-global",
        properties: { "padding-left": "1rem", "padding-right": "1rem" },
        order: 0,
        isCombo: false,
      },
      {
        id: "p2",
        name: "padding-global",
        properties: { "padding-left": "1rem", "padding-right": "1rem" },
        order: 1,
        isCombo: false,
      },
    ];

    const args = elementArgs({
      allStyles,
      classes: [{ className: "padding-global", order: 1, elementId: "el-1" }],
    });

    expect(rule.analyzeElement(args)).toEqual([]);
  });

  it("mergedIgnoredLintClasses excludes listed utilities from duplicate detection (single-property)", () => {
    const allStyles: StyleInfo[] = [
      {
        id: "x",
        name: "user-ignored-alias",
        properties: { "margin-top": "1rem" },
        order: 0,
        isCombo: false,
      },
      {
        id: "y",
        name: "duplicate-of-alias",
        properties: { "margin-top": "1rem" },
        order: 1,
        isCombo: false,
      },
    ];

    const args = elementArgs({
      allStyles,
      classes: [{ className: "duplicate-of-alias", order: 1, elementId: "el-1" }],
      mergedIgnoredLintClasses: new Set(["user-ignored-alias"]),
    });

    expect(rule.analyzeElement(args)).toEqual([]);
  });

  it("without mergedIgnoredLintClasses still flags duplicate single-property utilities (control)", () => {
    const allStyles: StyleInfo[] = [
      {
        id: "x",
        name: "user-ignored-alias",
        properties: { "margin-top": "1rem" },
        order: 0,
        isCombo: false,
      },
      {
        id: "y",
        name: "duplicate-of-alias",
        properties: { "margin-top": "1rem" },
        order: 1,
        isCombo: false,
      },
    ];

    const args = elementArgs({
      allStyles,
      classes: [{ className: "duplicate-of-alias", order: 1, elementId: "el-1" }],
    });

    const out = rule.analyzeElement(args);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].ruleId).toBe("canonical:utility-duplicate-property");
  });

  it("Client-First: dash-free semantic utilities (e.g. button) are not consolidated against token utilities", () => {
    const vid = "variable-9f6b6bb4-0795-c8ab-f302-bbebab6f2554";
    const allStyles: StyleInfo[] = [
      {
        id: "a",
        name: "background-color-primary",
        properties: { "background-color": { id: vid } as unknown as string },
        order: 0,
        isCombo: false,
      },
      {
        id: "b",
        name: "button",
        properties: { "background-color": { id: vid } as unknown as string },
        order: 1,
        isCombo: false,
      },
    ];

    const args = elementArgs({
      allStyles,
      classes: [{ className: "button", order: 1, elementId: "el-1" }],
      grammarElementSeparator: "-",
      variableNameById: new Map([[vid, "Background / Primary"]]),
    });

    expect(rule.analyzeElement(args)).toEqual([]);
  });

  it("uses variable display names in duplicate messages when variableNameById is provided", () => {
    const vid = "variable-9f6b6bb4-0795-c8ab-f302-bbebab6f2554";
    const allStyles: StyleInfo[] = [
      {
        id: "a",
        name: "background-color-alt",
        properties: { "background-color": { id: vid } as unknown as string },
        order: 0,
        isCombo: false,
      },
      {
        id: "b",
        name: "background-color-primary",
        properties: { "background-color": { id: vid } as unknown as string },
        order: 1,
        isCombo: false,
      },
    ];

    const args = elementArgs({
      allStyles,
      classes: [{ className: "background-color-primary", order: 1, elementId: "el-1" }],
      grammarElementSeparator: "-",
      variableNameById: new Map([[vid, "Background / Primary"]]),
    });

    const out = rule.analyzeElement(args);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].message).toContain("Background / Primary");
    expect(out[0].message).not.toContain(vid);
  });

  it("mergedIgnoredLintClasses excludes listed utilities from duplicate detection (multi-property)", () => {
    const allStyles: StyleInfo[] = [
      {
        id: "x",
        name: "user-ignored-base",
        properties: { "margin-top": "1rem", "margin-left": "0px" },
        order: 0,
        isCombo: false,
      },
      {
        id: "y",
        name: "duplicate-base",
        properties: { "margin-top": "1rem", "margin-left": "0px" },
        order: 1,
        isCombo: false,
      },
    ];

    const args = elementArgs({
      allStyles,
      classes: [{ className: "duplicate-base", order: 1, elementId: "el-1" }],
      mergedIgnoredLintClasses: new Set(["user-ignored-base"]),
    });

    expect(rule.analyzeElement(args)).toEqual([]);
  });
});

describe("canonical:utility-duplicate-property (rule runner forwards mergedIgnoredLintClasses)", () => {
  it("passes mergedIgnoredLintClasses through runRulesOnStylesWithContext", () => {
    const registry = createRuleRegistry();
    registry.registerRule(createUtilityDuplicatePropertyRule({ ignoredClasses: [...CF_BUILTIN_UTILITY_CLASSES] }));

    const utilityAnalyzer = createUtilityClassAnalyzer({
      isUtilityName: (name) => clientFirstClassType(name) === "utility",
    });
    utilityAnalyzer.buildPropertyMaps([]);

    const runner = createRuleRunner(registry, utilityAnalyzer, clientFirstClassType);

    const styles: StyleWithElement[] = [
      {
        id: "x",
        name: "user-ignored-alias",
        properties: { "margin-top": "1rem" },
        order: 0,
        isCombo: false,
        elementId: "el-1",
      },
      {
        id: "y",
        name: "duplicate-of-alias",
        properties: { "margin-top": "1rem" },
        order: 1,
        isCombo: false,
        elementId: "el-1",
      },
    ];

    const results = runner.runRulesOnStylesWithContext(
      styles,
      {} as Record<string, never[]>,
      styles,
      { "el-1": "unknown" },
      () => null,
      () => [],
      () => [],
      undefined,
      undefined,
      () => null,
      () => null,
      false,
      "-",
      undefined,
      undefined,
      undefined,
      undefined,
      false,
      undefined,
      new Set(["user-ignored-alias"])
    );

    expect(results.filter((r) => r.ruleId === "canonical:utility-duplicate-property")).toHaveLength(0);
  });
});
