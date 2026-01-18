import { describe, expect, it } from "vitest";
import type { ClassType, ElementAnalysisArgs, ElementClassItem, RuleResult } from "@/features/linter/model/rule.types";
import { createLumosClassOrderRule } from "@/features/linter/rules/lumos/composition/class-order.element";

type Rule = ReturnType<typeof createLumosClassOrderRule>;

// Helper to create mock ElementAnalysisArgs
const createMockElementAnalysisArgs = (
  classes: Array<{
    className: string;
    order: number;
    isCombo?: boolean;
    comboIndex?: number;
  }>,
  classTypeMap: Record<string, ClassType> = {}
): ElementAnalysisArgs => {
  const mockGetClassType = (className: string): ClassType => {
    // Default classification logic
    if (classTypeMap[className]) return classTypeMap[className];
    if (className.startsWith("c-")) return "custom"; // components are classified as custom
    if (className.startsWith("u-") || className.startsWith("u_")) return "utility";
    if (className.startsWith("is-") || className.startsWith("is_")) return "custom"; // variants are custom type
    return "custom"; // default to custom for base classes
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
};

function runRule(
  rule: Rule,
  classes: Array<{
    className: string;
    order: number;
    isCombo?: boolean;
    comboIndex?: number;
  }>,
  classTypeMap: Record<string, ClassType> = {}
): RuleResult[] {
  const args = createMockElementAnalysisArgs(classes, classTypeMap);
  return rule.analyzeElement(args);
}

function expectValid(
  rule: Rule,
  classes: Array<{
    className: string;
    order: number;
    isCombo?: boolean;
    comboIndex?: number;
  }>,
  classTypeMap: Record<string, ClassType> = {}
) {
  const results = runRule(rule, classes, classTypeMap);
  expect(
    results,
    `Expected class order to be valid but got violations: ${results.map((r) => r.message).join(", ")}`
  ).toEqual([]);
}

function expectViolation(
  rule: Rule,
  classes: Array<{
    className: string;
    order: number;
    isCombo?: boolean;
    comboIndex?: number;
  }>,
  expectedViolatingClass: string,
  expectedMessage: string | RegExp,
  classTypeMap: Record<string, ClassType> = {}
): RuleResult {
  const results = runRule(rule, classes, classTypeMap);
  expect(results).toHaveLength(1);

  const result = results[0];
  expect(result.className).toBe(expectedViolatingClass);
  expect(result.ruleId).toBe("lumos:composition:class-order");
  expect(result.severity).toBe("error");
  expect(result.elementId).toBe("test-element");

  if (typeof expectedMessage === "string") {
    expect(result.message).toBe(expectedMessage);
  } else {
    expect(result.message).toMatch(expectedMessage);
  }

  return result;
}

describe("lumos:composition:class-order", () => {
  it("exposes correct rule metadata", () => {
    const rule = createLumosClassOrderRule();
    expect(rule.id).toBe("lumos:composition:class-order");
    expect(rule.name).toBe("Base class must precede variants and utilities");
    expect(rule.type).toBe("structure");
    expect(rule.category).toBe("structure");
    expect(rule.severity).toBe("error");
    expect(rule.enabled).toBe(true);
    expect(rule.example).toBe("base_custom is-active u-hidden");
    expect(rule.description).toContain("base classes (custom/component/combo) must come before variant classes");
  });

  describe("valid class ordering", () => {
    it("accepts correct order: base → variants → utilities", () => {
      const rule = createLumosClassOrderRule();

      expectValid(rule, [
        { className: "hero_wrap", order: 0 },
        { className: "is-active", order: 1 },
        { className: "u-hidden", order: 2 },
      ]);
    });

    it("accepts single base class", () => {
      const rule = createLumosClassOrderRule();

      expectValid(rule, [{ className: "hero_wrap", order: 0 }]);
    });

    it("accepts multiple base classes", () => {
      const rule = createLumosClassOrderRule();

      expectValid(rule, [
        { className: "hero_wrap", order: 0 },
        { className: "section_content", order: 1 },
        { className: "card_inner", order: 2 },
      ]);
    });

    it("accepts base and variants only", () => {
      const rule = createLumosClassOrderRule();

      expectValid(rule, [
        { className: "button_primary", order: 0 },
        { className: "is-active", order: 1 },
        { className: "is-large", order: 2 },
      ]);
    });

    it("accepts base and utilities only", () => {
      const rule = createLumosClassOrderRule();

      expectValid(rule, [
        { className: "content_wrap", order: 0 },
        { className: "u-margin-bottom", order: 1 },
        { className: "u-hidden", order: 2 },
      ]);
    });

    it("accepts variants and utilities only", () => {
      const rule = createLumosClassOrderRule();

      expectValid(rule, [
        { className: "is-active", order: 0 },
        { className: "is-highlighted", order: 1 },
        { className: "u-margin-top", order: 2 },
        { className: "u-hidden", order: 3 },
      ]);
    });

    it("accepts component classes as base", () => {
      const rule = createLumosClassOrderRule();

      expectValid(
        rule,
        [
          { className: "c-button", order: 0 },
          { className: "is-primary", order: 1 },
          { className: "u-margin", order: 2 },
        ],
        { "c-button": "custom" } // components are classified as custom type
      );
    });

    it("accepts combo classes as base", () => {
      const rule = createLumosClassOrderRule();

      expectValid(
        rule,
        [
          { className: "combo-class", order: 0, isCombo: true },
          { className: "is-active", order: 1 },
          { className: "u-hidden", order: 2 },
        ],
        { "combo-class": "combo" }
      );
    });
  });

  describe("base class violations", () => {
    it("detects base class after variant", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "is-active", order: 0 },
          { className: "hero_wrap", order: 1 },
        ],
        "hero_wrap",
        'Base class "hero_wrap" appears after a variant class. Base must come first.'
      );
    });

    it("detects base class after utility", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "u-hidden", order: 0 },
          { className: "card_content", order: 1 },
        ],
        "card_content",
        'Base class "card_content" appears after a utility class. Base must come first.'
      );
    });

    it("detects base class after variant and utility (reports utility)", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "is-active", order: 0 },
          { className: "u-margin", order: 1 },
          { className: "section_wrap", order: 2 },
        ],
        "section_wrap",
        'Base class "section_wrap" appears after a utility class. Base must come first.'
      );
    });

    it("reports only the first violation when multiple base classes are misplaced", () => {
      const rule = createLumosClassOrderRule();

      const results = runRule(rule, [
        { className: "is-active", order: 0 },
        { className: "first_base", order: 1 },
        { className: "second_base", order: 2 },
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].className).toBe("first_base");
    });
  });

  describe("variant class violations", () => {
    it("detects variant class after utility", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "hero_wrap", order: 0 },
          { className: "u-margin", order: 1 },
          { className: "is-active", order: 2 },
        ],
        "is-active",
        'Variant class "is-active" appears after a utility class. Variants must come before utilities.'
      );
    });

    it("detects multiple variants after utilities (reports first)", () => {
      const rule = createLumosClassOrderRule();

      const results = runRule(rule, [
        { className: "section_content", order: 0 },
        { className: "u-hidden", order: 1 },
        { className: "is-active", order: 2 },
        { className: "is-highlighted", order: 3 },
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].className).toBe("is-active");
    });
  });

  describe("class type detection", () => {
    it("recognizes utility classes by prefix", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "u-margin", order: 0 },
          { className: "hero_wrap", order: 1 },
        ],
        "hero_wrap",
        /Base class.*appears after a utility class/
      );
    });

    it("recognizes utility classes by underscore prefix", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "u_margin", order: 0 },
          { className: "content_wrap", order: 1 },
        ],
        "content_wrap",
        /Base class.*appears after a utility class/
      );
    });

    it("recognizes utility classes by type classification", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "custom-utility", order: 0 },
          { className: "base_class", order: 1 },
        ],
        "base_class",
        /Base class.*appears after a utility class/,
        { "custom-utility": "utility" }
      );
    });

    it("recognizes variant classes by prefix", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "is-active", order: 0 },
          { className: "hero_wrap", order: 1 },
        ],
        "hero_wrap",
        /Base class.*appears after a variant class/
      );
    });

    it("recognizes variant classes by underscore prefix", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "is_active", order: 0 },
          { className: "section_content", order: 1 },
        ],
        "section_content",
        /Base class.*appears after a variant class/
      );
    });
  });

  describe("fix suggestions and metadata", () => {
    it("provides reorder fix for simple case", () => {
      const rule = createLumosClassOrderRule();

      const result = expectViolation(
        rule,
        [
          { className: "is-active", order: 0 },
          { className: "hero_wrap", order: 1 },
          { className: "u-hidden", order: 2 },
        ],
        "hero_wrap",
        /Base class.*appears after a variant class/
      );

      expect(result.fix).toEqual({
        kind: "reorder-classes",
        order: ["hero_wrap", "is-active", "u-hidden"],
        scope: "element",
      });

      expect(result.metadata).toEqual({
        currentOrder: ["is-active", "hero_wrap", "u-hidden"],
        desiredOrder: ["hero_wrap", "is-active", "u-hidden"],
      });
    });

    it("provides reorder fix for complex case", () => {
      const rule = createLumosClassOrderRule();

      const result = expectViolation(
        rule,
        [
          { className: "is-active", order: 0 },
          { className: "u-margin", order: 1 },
          { className: "hero_wrap", order: 2 },
          { className: "is-highlighted", order: 3 },
          { className: "u-hidden", order: 4 },
        ],
        "hero_wrap",
        /Base class.*appears after a utility class/
      );

      expect(result.fix).toEqual({
        kind: "reorder-classes",
        order: ["hero_wrap", "is-active", "is-highlighted", "u-margin", "u-hidden"],
        scope: "element",
      });
    });

    it("preserves relative order within each category", () => {
      const rule = createLumosClassOrderRule();

      const result = expectViolation(
        rule,
        [
          { className: "is-first", order: 0 },
          { className: "u-first", order: 1 },
          { className: "base_first", order: 2 },
          { className: "base_second", order: 3 },
          { className: "is-second", order: 4 },
          { className: "u-second", order: 5 },
        ],
        "base_first",
        /Base class.*appears after a utility class/
      );

      expect(result.fix).toMatchObject({
        kind: "reorder-classes",
        scope: "element",
      });
      if (result.fix?.kind === "reorder-classes") {
        expect(result.fix.order).toEqual(["base_first", "base_second", "is-first", "is-second", "u-first", "u-second"]);
      }
    });

    it("includes example in violation result", () => {
      const rule = createLumosClassOrderRule();

      const result = expectViolation(
        rule,
        [
          { className: "u-hidden", order: 0 },
          { className: "hero_wrap", order: 1 },
        ],
        "hero_wrap",
        /Base class.*appears after a utility class/
      );

      expect(result.example).toBe("base_custom is-active u-hidden");
    });
  });

  describe("combo classes", () => {
    it("treats combo classes as base classes", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "is-active", order: 0 },
          { className: "combo-class", order: 1, isCombo: true, comboIndex: 0 },
        ],
        "combo-class",
        /Base class.*appears after a variant class/
      );
    });

    it("includes combo metadata in violation", () => {
      const rule = createLumosClassOrderRule();

      const result = expectViolation(
        rule,
        [
          { className: "u-margin", order: 0 },
          { className: "combo-class", order: 1, isCombo: true, comboIndex: 2 },
        ],
        "combo-class",
        /Base class.*appears after a utility class/
      );

      expect(result.isCombo).toBe(true);
      expect(result.comboIndex).toBe(2);
    });
  });

  describe("edge cases", () => {
    it("handles empty class list", () => {
      const rule = createLumosClassOrderRule();
      expectValid(rule, []);
    });

    it("handles missing getClassType function", () => {
      const rule = createLumosClassOrderRule();
      const args: ElementAnalysisArgs = {
        elementId: "test",
        classes: [{ className: "test", order: 0, elementId: "test" }],
        allStyles: [],
        getClassType: undefined as any,
        getRuleConfig: () => undefined,
      };

      const results = rule.analyzeElement(args);
      expect(results).toEqual([]);
    });

    it("handles classes with same order numbers", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "is-active", order: 0 },
          { className: "hero_wrap", order: 0 }, // same order
        ],
        "hero_wrap",
        /Base class.*appears after a variant class/
      );
    });

    it("correctly identifies unknown class types as base", () => {
      const rule = createLumosClassOrderRule();

      expectViolation(
        rule,
        [
          { className: "is-active", order: 0 },
          { className: "unknown-class", order: 1 },
        ],
        "unknown-class",
        /Base class.*appears after a variant class/,
        { "unknown-class": "unknown" as ClassType }
      );
    });
  });
});
