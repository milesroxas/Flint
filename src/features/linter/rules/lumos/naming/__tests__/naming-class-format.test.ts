import { describe, expect, it } from "vitest";
import type { RuleContext, RuleResult } from "@/features/linter/model/rule.types";
import { createLumosCustomClassFormatRule } from "@/features/linter/rules/lumos/naming/naming-class-format";

type Rule = ReturnType<typeof createLumosCustomClassFormatRule>;

// Minimal RuleContext for testing
const createMinimalRuleContext = (
  config?: Record<string, unknown>
): RuleContext & { config?: Record<string, unknown> } => ({
  allStyles: [],
  utilityClassPropertiesMap: new Map(),
  propertyToClassesMap: new Map(),
  config,
});

function run(rule: Rule, className: string, ctx?: { config?: Record<string, unknown> }): RuleResult | null {
  // Gate: rule should decide if it wants to run on this className
  const shouldRun = rule.test(className);
  if (!shouldRun) return null;

  const ruleContext = createMinimalRuleContext(ctx?.config);
  const result = rule.evaluate?.(className, ruleContext);
  return result ?? null; // Ensure we return null instead of undefined
}

function expectValid(rule: Rule, className: string, ctx?: { config?: Record<string, unknown> }) {
  const result = run(rule, className, ctx);
  expect(result, `Expected "${className}" to be valid but got: ${result?.message}`).toBeNull();
}

function expectInvalid(
  rule: Rule,
  className: string,
  severity: "error" | "warning" | "suggestion" = "error",
  ctx?: { config?: Record<string, unknown> }
): RuleResult {
  const result = run(rule, className, ctx);
  expect(result, `Expected "${className}" to be invalid`).toBeTruthy();

  // Assert full RuleResult shape
  expect(result).toMatchObject({
    ruleId: "lumos:naming:class-format",
    name: "Lumos Custom Class Format",
    message: expect.any(String),
    severity,
    className,
    isCombo: false,
  });

  expect(result?.message.length).toBeGreaterThan(0);

  // If fix is provided, assert its shape
  if (result?.fix) {
    expect(result?.fix).toMatchObject({
      kind: expect.any(String),
      scope: expect.any(String),
    });

    if (result?.fix.kind === "rename-class") {
      expect(result?.fix).toMatchObject({
        kind: "rename-class",
        from: className,
        to: expect.any(String),
        scope: "element",
      });
    }
  }

  if (!result) {
    throw new Error(`Expected result for className "${className}" but got null/undefined`);
  }

  return result;
}

describe("lumos:naming:class-format", () => {
  it("exposes correct metadata", () => {
    const rule = createLumosCustomClassFormatRule();
    expect(rule.id).toBe("lumos:naming:class-format");
    expect(rule.type).toBe("naming");
    expect(rule.category).toBe("format");
    expect(rule.severity).toBe("error");
    expect(rule.enabled).toBe(true);
    expect(rule.targetClassTypes).toEqual(["custom"]);
  });

  it("accepts valid custom class formats with known elements", () => {
    const rule = createLumosCustomClassFormatRule();

    const validKnownElements = [
      // basic: type_element (known elements)
      "footer_wrap",
      "header_text",
      "hero_title",
      "section_icon",
      "card_image",
      "nav_button",
      "form_field",
      "content_group",

      // with variant: type_variant_element
      "hero_secondary_wrap",
      "card_featured_inner",
      "button_primary_text",
      "section_highlighted_content",

      // child-group roots with group segments before final element
      "hero_content_wrap",
      "section_main_content_wrap",
      "footer_social_link_wrap",
      "hero_secondary_cta_button",
      "navigation_mobile_menu_container",

      // with numbers
      "section2_main_wrap",
      "hero_v2_content_text",
    ];

    for (const className of validKnownElements) {
      expectValid(rule, className);
    }
  });

  it("rejects invalid formats: casing errors", () => {
    const rule = createLumosCustomClassFormatRule();

    const invalidCasing = ["Footer_wrap", "HERO_wrap", "hero_Wrap", "Hero_Title", "section_Main_content"];

    for (const className of invalidCasing) {
      expectInvalid(rule, className, "error");
    }
  });

  it("rejects invalid formats: separator and character errors", () => {
    const rule = createLumosCustomClassFormatRule();

    const invalidSeparators = [
      // Wrong separators
      "hero-wrap",
      "hero.wrap",
      "hero/wrap",
      "hero wrap",
      "hero@wrap",

      // Multiple underscores
      "hero__wrap",
      "hero___wrap",

      // Leading/trailing underscores
      "_hero_wrap",
      "hero_wrap_",
      "_hero_wrap_",

      // Special characters
      "hero_wrap!",
      "hero_wrap?",
      "hero_wrap#",
      "hero-wrap-text",
    ];

    for (const className of invalidSeparators) {
      expectInvalid(rule, className, "error");
    }
  });

  it("rejects invalid formats: segment count and empty segments", () => {
    const rule = createLumosCustomClassFormatRule();

    const invalidSegments = [
      // Too few segments
      "hero",
      "wrap",
      "button",

      // Empty segments
      "hero__wrap",
      "__wrap",
      "hero__",
      "___",
      "_",
      "",
    ];

    for (const className of invalidSegments) {
      expectInvalid(rule, className, "error");
    }
  });

  it("handles unrecognized elements with suggestions", () => {
    const rule = createLumosCustomClassFormatRule();

    const unrecognizedElements = ["hero_widget", "section_gadget", "footer_thingy", "nav_doohickey"];

    for (const className of unrecognizedElements) {
      const result = expectInvalid(rule, className, "suggestion");
      expect(result.metadata?.unrecognizedElement).toBeTruthy();
    }
  });

  it("handles project-defined elements configuration", () => {
    const rule = createLumosCustomClassFormatRule();

    const config = {
      projectDefinedElements: ["widget", "gadget", "custom"],
    };

    // Project-defined elements should pass with suggestion
    const result1 = run(rule, "hero_widget", { config });
    expect(result1?.severity).toBe("suggestion");
    expect(result1?.message).toContain("project-defined element");

    // Unknown elements should still get suggestion
    const result2 = run(rule, "hero_unknown", { config });
    expect(result2?.severity).toBe("suggestion");
    expect(result2?.message).toContain("unrecognized element");

    // Known elements should pass cleanly
    const result3 = run(rule, "hero_wrap", { config });
    expect(result3).toBeNull();
  });

  it("provides helpful quick-fixes for common errors", () => {
    const rule = createLumosCustomClassFormatRule();

    // Test dash to underscore conversion
    const dashResult = expectInvalid(rule, "hero-wrap", "error");
    expect(dashResult.fix?.kind).toBe("rename-class");
    if (dashResult.fix?.kind === "rename-class") {
      expect(dashResult.fix.from).toBe("hero-wrap");
      expect(dashResult.fix.to).toBe("hero_wrap");
      expect(dashResult.fix.scope).toBe("element");
    }

    // Test case conversion
    const caseResult = expectInvalid(rule, "Hero-Wrap", "error");
    expect(caseResult.fix?.kind).toBe("rename-class");
    if (caseResult.fix?.kind === "rename-class") {
      expect(caseResult.fix.from).toBe("Hero-Wrap");
      expect(caseResult.fix.to).toBe("hero_wrap");
      expect(caseResult.fix.scope).toBe("element");
    }

    // Test space to underscore
    const spaceResult = expectInvalid(rule, "hero wrap", "error");
    expect(spaceResult.fix?.kind).toBe("rename-class");
    if (spaceResult.fix?.kind === "rename-class") {
      expect(spaceResult.fix.from).toBe("hero wrap");
      expect(spaceResult.fix.to).toBe("hero_wrap");
      expect(spaceResult.fix.scope).toBe("element");
    }
  });

  it("skips component classes (c- prefix)", () => {
    const rule = createLumosCustomClassFormatRule();

    const componentClasses = ["c-card", "c-button", "c-invalid-format!@#", "c-BadCasing"];

    for (const className of componentClasses) {
      // test() should return false for component classes
      expect(rule.test(className)).toBe(false);
      // evaluate() should return null for component classes
      expect(rule.evaluate?.(className, createMinimalRuleContext())).toBeNull();
    }
  });

  it("test() method correctly identifies candidates", () => {
    const rule = createLumosCustomClassFormatRule();

    // Should return true for potential custom classes (will be evaluated)
    expect(rule.test("footer_wrap")).toBe(true);
    expect(rule.test("hero-secondary")).toBe(true); // invalid but candidate
    expect(rule.test("invalid!@#")).toBe(true); // invalid but candidate
    expect(rule.test("single")).toBe(true); // will be evaluated and flagged as invalid

    // Should return false for component classes
    expect(rule.test("c-card")).toBe(false);
    expect(rule.test("c-button-primary")).toBe(false);
  });

  it("validates all aspects of rule metadata", () => {
    const rule = createLumosCustomClassFormatRule();

    // Validate complete rule structure
    expect(rule.id).toBe("lumos:naming:class-format");
    expect(rule.name).toBe("Lumos Custom Class Format");
    expect(rule.type).toBe("naming");
    expect(rule.category).toBe("format");
    expect(rule.severity).toBe("error");
    expect(rule.enabled).toBe(true);
    expect(rule.targetClassTypes).toEqual(["custom"]);
    expect(rule.description).toContain("lowercase and underscore-separated");
    expect(rule.example).toContain("footer_wrap");
    expect(rule.config).toBeDefined();
    expect(rule.config?.projectDefinedElements).toBeDefined();
  });

  it("handles edge cases and boundary conditions", () => {
    const rule = createLumosCustomClassFormatRule();

    // Very long class names
    const longValidClass = "very_long_section_name_with_many_segments_that_should_still_work_fine_wrap";
    expectValid(rule, longValidClass);

    // Numbers in class names
    expectValid(rule, "section2_v3_content_wrap");
    expectValid(rule, "hero_123_text");

    // Minimum valid case
    expectValid(rule, "a_wrap");
    expectValid(rule, "x_y");

    // Maximum nesting
    expectValid(rule, "section_hero_primary_cta_button_wrapper_inner_content");
  });
});
