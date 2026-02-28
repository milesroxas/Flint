import { describe, expect, it } from "vitest";
import type { RuleContext } from "@/features/linter/model/rule.types";
import { createCFComboIsPrefixRule } from "@/features/linter/rules/client-first/naming/combo-is-prefix";
import { createCFNoAbbreviationsRule } from "@/features/linter/rules/client-first/naming/no-abbreviations";
import { createCFSectionFormatRule } from "@/features/linter/rules/client-first/naming/section-format";
import { createCFUtilityNoUnderscoreRule } from "@/features/linter/rules/client-first/naming/utility-no-underscore";

const emptyContext: RuleContext = {
  allStyles: [],
  utilityClassPropertiesMap: new Map(),
  propertyToClassesMap: new Map(),
};

// ── cf:naming:utility-no-underscore ─────────────────────────────────

describe("cf:naming:utility-no-underscore", () => {
  const rule = createCFUtilityNoUnderscoreRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:naming:utility-no-underscore");
    expect(rule.type).toBe("naming");
    expect(rule.severity).toBe("error");
    expect(rule.targetClassTypes).toEqual(["utility"]);
  });

  it("passes for dash-only utility classes", () => {
    expect(rule.test("text-size-large")).toBe(true);
    expect(rule.test("padding-global")).toBe(true);
    expect(rule.test("container-small")).toBe(true);
    expect(rule.test("button")).toBe(true);
  });

  it("fails for utility classes with underscores", () => {
    expect(rule.test("u-text_size")).toBe(false);
    expect(rule.test("u-margin_top")).toBe(false);
  });

  it("provides fix suggestion replacing underscore with dash", () => {
    const result = rule.evaluate?.("u-text_size", emptyContext);
    expect(result).not.toBeNull();
    expect(result?.fix).toEqual({
      kind: "rename-class",
      from: "u-text_size",
      to: "u-text-size",
      scope: "global",
    });
  });

  it("returns null for valid utility classes", () => {
    const result = rule.evaluate?.("text-size-large", emptyContext);
    expect(result).toBeNull();
  });
});

// ── cf:naming:combo-is-prefix ───────────────────────────────────────

describe("cf:naming:combo-is-prefix", () => {
  const rule = createCFComboIsPrefixRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:naming:combo-is-prefix");
    expect(rule.type).toBe("naming");
    expect(rule.severity).toBe("error");
    expect(rule.targetClassTypes).toEqual(["combo"]);
  });

  it("passes for valid combo class names", () => {
    expect(rule.test("is-active")).toBe(true);
    expect(rule.test("is-brand")).toBe(true);
    expect(rule.test("is-home")).toBe(true);
    expect(rule.test("is-dark-mode")).toBe(true);
    expect(rule.test("is-secondary")).toBe(true);
  });

  it("fails for incomplete is- prefix", () => {
    expect(rule.test("is-")).toBe(false);
  });

  it("fails for uppercase in combo name", () => {
    expect(rule.test("is-Brand")).toBe(false);
    expect(rule.test("is-Active")).toBe(false);
  });

  it("fails for underscore in combo name", () => {
    expect(rule.test("is_active")).toBe(false);
  });

  it("provides fix for uppercase combo", () => {
    const result = rule.evaluate?.("is-Brand", emptyContext);
    expect(result).not.toBeNull();
    expect(result?.fix).toEqual({
      kind: "rename-class",
      from: "is-Brand",
      to: "is-brand",
      scope: "global",
    });
  });

  it("provides fix for underscore combo", () => {
    const result = rule.evaluate?.("is_active", emptyContext);
    expect(result).not.toBeNull();
    expect(result?.fix).toEqual({
      kind: "rename-class",
      from: "is_active",
      to: "is-active",
      scope: "global",
    });
  });

  it("returns null for valid combo class", () => {
    const result = rule.evaluate?.("is-active", emptyContext);
    expect(result).toBeNull();
  });
});

// ── cf:naming:section-format ────────────────────────────────────────

describe("cf:naming:section-format", () => {
  const rule = createCFSectionFormatRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:naming:section-format");
    expect(rule.type).toBe("naming");
    expect(rule.severity).toBe("warning");
    expect(rule.targetClassTypes).toEqual(["utility"]);
  });

  it("passes for non-section utility classes", () => {
    expect(rule.test("text-size-large")).toBe(true);
    expect(rule.test("padding-global")).toBe(true);
    expect(rule.test("container-large")).toBe(true);
  });

  it("flags section-* dash pattern", () => {
    expect(rule.test("section-about")).toBe(false);
    expect(rule.test("section-hero")).toBe(false);
    expect(rule.test("section-testimonials")).toBe(false);
  });

  it("suggests underscore format for section classes", () => {
    const result = rule.evaluate?.("section-about", emptyContext);
    expect(result).not.toBeNull();
    expect(result?.message).toContain("section_about");
    expect(result?.fix).toEqual({
      kind: "rename-class",
      from: "section-about",
      to: "section_about",
      scope: "global",
    });
  });

  it("returns null for non-section classes", () => {
    const result = rule.evaluate?.("text-size-large", emptyContext);
    expect(result).toBeNull();
  });
});

// ── cf:naming:no-abbreviations ──────────────────────────────────────

describe("cf:naming:no-abbreviations", () => {
  const rule = createCFNoAbbreviationsRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:naming:no-abbreviations");
    expect(rule.type).toBe("naming");
    expect(rule.severity).toBe("suggestion");
    expect(rule.targetClassTypes).toEqual(["custom", "utility"]);
  });

  it("passes for full names", () => {
    expect(rule.test("button")).toBe(true);
    expect(rule.test("text-size-large")).toBe(true);
    expect(rule.test("hero_wrapper")).toBe(true);
    expect(rule.test("testimonials_content")).toBe(true);
  });

  it("flags common abbreviations", () => {
    expect(rule.test("btn")).toBe(false);
    expect(rule.test("hero_btn")).toBe(false);
    expect(rule.test("col-2")).toBe(false);
    expect(rule.test("hdr-content")).toBe(false);
  });

  it("does not flag allowed short tokens", () => {
    expect(rule.test("nav-links")).toBe(true);
    expect(rule.test("faq_item")).toBe(true);
  });

  it("provides abbreviation suggestions", () => {
    const result = rule.evaluate?.("hero_btn", emptyContext);
    expect(result).not.toBeNull();
    expect(result?.message).toContain('"btn"');
    expect(result?.message).toContain('"button"');
    expect(result?.severity).toBe("suggestion");
  });

  it("returns null for non-abbreviated names", () => {
    const result = rule.evaluate?.("hero_wrapper", emptyContext);
    expect(result).toBeNull();
  });
});
