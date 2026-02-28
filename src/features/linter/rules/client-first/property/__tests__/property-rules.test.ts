import { describe, expect, it } from "vitest";
import type { RuleContext } from "@/features/linter/model/rule.types";
import { createCFPaddingGlobalHorizontalOnlyRule } from "@/features/linter/rules/client-first/property/padding-global-horizontal-only";
import { createCFPreferRemRule } from "@/features/linter/rules/client-first/property/prefer-rem";

const emptyContext: RuleContext & { config?: Record<string, unknown> } = {
  allStyles: [],
  utilityClassPropertiesMap: new Map(),
  propertyToClassesMap: new Map(),
};

// ── cf:property:padding-global-horizontal-only ──────────────────────

describe("cf:property:padding-global-horizontal-only", () => {
  const rule = createCFPaddingGlobalHorizontalOnlyRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:property:padding-global-horizontal-only");
    expect(rule.type).toBe("property");
    expect(rule.severity).toBe("warning");
    expect(rule.targetClassTypes).toEqual(["utility"]);
  });

  it("passes when padding-global has only horizontal padding", () => {
    const results = rule.analyze(
      "padding-global",
      { "padding-left": "1.25rem", "padding-right": "1.25rem" },
      emptyContext
    );
    expect(results).toEqual([]);
  });

  it("flags non-horizontal properties on padding-global", () => {
    const results = rule.analyze(
      "padding-global",
      {
        "padding-left": "1.25rem",
        "padding-right": "1.25rem",
        "padding-top": "2rem",
      },
      emptyContext
    );
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain("padding-top");
    expect(results[0].message).toContain("padding-global");
  });

  it("flags multiple unexpected properties", () => {
    const results = rule.analyze(
      "padding-global",
      {
        "padding-left": "1.25rem",
        "padding-right": "1.25rem",
        "padding-top": "2rem",
        "padding-bottom": "2rem",
        "background-color": "red",
      },
      emptyContext
    );
    expect(results).toHaveLength(3);
  });

  it("ignores non-padding-global classes", () => {
    const results = rule.analyze(
      "padding-section-medium",
      { "padding-top": "5rem", "padding-bottom": "5rem" },
      emptyContext
    );
    expect(results).toEqual([]);
  });

  it("skips internal metadata properties", () => {
    const results = rule.analyze("padding-global", { "padding-left": "1.25rem", order: 5 }, emptyContext);
    expect(results).toEqual([]);
  });
});

// ── cf:property:prefer-rem ──────────────────────────────────────────

describe("cf:property:prefer-rem", () => {
  const rule = createCFPreferRemRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:property:prefer-rem");
    expect(rule.type).toBe("property");
    expect(rule.severity).toBe("suggestion");
    expect(rule.targetClassTypes).toEqual(["custom", "utility", "combo"]);
  });

  it("passes when sizing properties use rem", () => {
    const results = rule.analyze("text-size-large", { "font-size": "1.5rem", "line-height": "1.4" }, emptyContext);
    expect(results).toEqual([]);
  });

  it("flags px usage in font-size", () => {
    const results = rule.analyze("hero_title", { "font-size": "24px" }, emptyContext);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain("font-size");
    expect(results[0].message).toContain("24px");
    expect(results[0].message).toContain("1.5rem");
    expect(results[0].severity).toBe("suggestion");
  });

  it("flags px usage in padding", () => {
    const results = rule.analyze("hero_wrapper", { "padding-top": "32px", "padding-bottom": "32px" }, emptyContext);
    expect(results).toHaveLength(2);
  });

  it("flags px usage in width/height", () => {
    const results = rule.analyze("container-custom", { "max-width": "1200px" }, emptyContext);
    expect(results).toHaveLength(1);
    expect(results[0].metadata?.suggestedValue).toBe("75rem");
  });

  it("skips 1px values (borders, etc.)", () => {
    const results = rule.analyze("card_wrapper", { "border-width": "1px" }, emptyContext);
    expect(results).toEqual([]);
  });

  it("ignores non-sizing properties", () => {
    const results = rule.analyze(
      "hero_wrapper",
      { display: "flex", position: "relative", opacity: "0.5" },
      emptyContext
    );
    expect(results).toEqual([]);
  });

  it("ignores non-string property values", () => {
    const results = rule.analyze("hero_wrapper", { "font-size": 16 as unknown }, emptyContext);
    expect(results).toEqual([]);
  });
});
