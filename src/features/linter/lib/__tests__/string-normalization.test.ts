import { describe, expect, it } from "vitest";
import {
  normalizeToHyphenFormat,
  normalizeToUnderscoreFormat,
  normalizeUtilityClass,
  normalizeVariantClass,
} from "@/features/linter/lib/string-normalization";

describe("string-normalization", () => {
  it("normalizeToHyphenFormat trims, lowercases, and strips invalid chars", () => {
    expect(normalizeToHyphenFormat("  Hero-Wrap!  ")).toBe("hero-wrap");
    // Underscores are removed before underscore-to-hyphen collapse, so runs collapse to letters only
    expect(normalizeToHyphenFormat("a__b__c")).toBe("abc");
  });

  it("normalizeToUnderscoreFormat maps spaces and hyphens to underscores", () => {
    expect(normalizeToUnderscoreFormat("hero wrap")).toBe("hero_wrap");
    expect(normalizeToUnderscoreFormat("hero-secondary")).toBe("hero_secondary");
  });

  it("normalizeUtilityClass returns valid u- names or null", () => {
    expect(normalizeUtilityClass("u-Margin_Top")).toBe("u-margintop");
    expect(normalizeUtilityClass("u-!")).toBeNull();
  });

  it("normalizeVariantClass returns valid is- names or null", () => {
    expect(normalizeVariantClass("is-Active_State")).toBe("is-activestate");
    expect(normalizeVariantClass("is-")).toBeNull();
  });
});
