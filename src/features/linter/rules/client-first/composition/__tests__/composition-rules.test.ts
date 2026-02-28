import { describe, expect, it } from "vitest";
import type { ClassType, ElementAnalysisArgs, ElementClassItem } from "@/features/linter/model/rule.types";
import { createCFComboNotAloneRule } from "@/features/linter/rules/client-first/composition/combo-not-alone";
import { createCFPaddingSectionRequiresGlobalRule } from "@/features/linter/rules/client-first/composition/padding-section-requires-global";

function createMockArgs(
  classes: Array<{
    className: string;
    order: number;
    isCombo?: boolean;
    comboIndex?: number;
  }>,
  classTypeMap: Record<string, ClassType> = {}
): ElementAnalysisArgs {
  const mockGetClassType = (className: string): ClassType => {
    if (classTypeMap[className]) return classTypeMap[className];
    if (className.startsWith("u-")) return "utility";
    if (className.startsWith("is-")) return "combo";
    if (className.includes("_")) return "custom";
    return "utility";
  };

  const elementClasses: ElementClassItem[] = classes.map((c) => ({
    className: c.className,
    order: c.order,
    elementId: "test-element",
    isCombo: c.isCombo,
    comboIndex: c.comboIndex,
  }));

  return {
    elementId: "test-element",
    classes: elementClasses,
    allStyles: [],
    getClassType: mockGetClassType,
    getRuleConfig: () => undefined,
  };
}

// ── cf:composition:combo-not-alone ──────────────────────────────────

describe("cf:composition:combo-not-alone", () => {
  const rule = createCFComboNotAloneRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:composition:combo-not-alone");
    expect(rule.type).toBe("composition");
    expect(rule.severity).toBe("error");
    expect(rule.enabled).toBe(true);
  });

  it("passes when combo has a custom base class", () => {
    const args = createMockArgs([
      { className: "header_content", order: 0 },
      { className: "is-home", order: 1 },
    ]);
    expect(rule.analyzeElement(args)).toEqual([]);
  });

  it("passes when combo has a utility base class", () => {
    const args = createMockArgs([
      { className: "button", order: 0 },
      { className: "is-brand", order: 1 },
    ]);
    expect(rule.analyzeElement(args)).toEqual([]);
  });

  it("flags combo class standing alone", () => {
    const args = createMockArgs([{ className: "is-active", order: 0 }]);
    const results = rule.analyzeElement(args);
    expect(results).toHaveLength(1);
    expect(results[0].ruleId).toBe("cf:composition:combo-not-alone");
    expect(results[0].className).toBe("is-active");
    expect(results[0].severity).toBe("error");
  });

  it("flags when only combo classes present (no base)", () => {
    const args = createMockArgs([
      { className: "is-active", order: 0 },
      { className: "is-large", order: 1 },
    ]);
    const results = rule.analyzeElement(args);
    expect(results).toHaveLength(1);
    expect(results[0].metadata?.combos).toEqual(["is-active", "is-large"]);
  });

  it("returns empty for elements with no combo classes", () => {
    const args = createMockArgs([
      { className: "hero_wrapper", order: 0 },
      { className: "text-size-large", order: 1 },
    ]);
    expect(rule.analyzeElement(args)).toEqual([]);
  });

  it("handles empty class list", () => {
    const args = createMockArgs([]);
    expect(rule.analyzeElement(args)).toEqual([]);
  });
});

// ── cf:composition:padding-section-requires-global ──────────────────

describe("cf:composition:padding-section-requires-global", () => {
  const rule = createCFPaddingSectionRequiresGlobalRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:composition:padding-section-requires-global");
    expect(rule.type).toBe("composition");
    expect(rule.severity).toBe("warning");
    expect(rule.enabled).toBe(true);
  });

  it("passes when padding-section has padding-global", () => {
    const args = createMockArgs([
      { className: "padding-global", order: 0 },
      { className: "padding-section-medium", order: 1 },
    ]);
    expect(rule.analyzeElement(args)).toEqual([]);
  });

  it("flags padding-section without padding-global", () => {
    const args = createMockArgs([{ className: "padding-section-medium", order: 0 }]);
    const results = rule.analyzeElement(args);
    expect(results).toHaveLength(1);
    expect(results[0].ruleId).toBe("cf:composition:padding-section-requires-global");
    expect(results[0].className).toBe("padding-section-medium");
    expect(results[0].fix).toEqual({
      kind: "add-class",
      className: "padding-global",
      scope: "element",
    });
  });

  it("flags padding-section-large without padding-global", () => {
    const args = createMockArgs([{ className: "padding-section-large", order: 0 }]);
    const results = rule.analyzeElement(args);
    expect(results).toHaveLength(1);
    expect(results[0].className).toBe("padding-section-large");
  });

  it("returns empty for elements without padding-section", () => {
    const args = createMockArgs([
      { className: "padding-global", order: 0 },
      { className: "hero_wrapper", order: 1 },
    ]);
    expect(rule.analyzeElement(args)).toEqual([]);
  });

  it("handles empty class list", () => {
    const args = createMockArgs([]);
    expect(rule.analyzeElement(args)).toEqual([]);
  });
});
