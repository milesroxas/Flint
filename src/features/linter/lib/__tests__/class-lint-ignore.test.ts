import { describe, expect, it } from "vitest";
import {
  buildClassLintFilter,
  buildMergedIgnoredClassSet,
  normalizeIgnoredClassList,
  parseIgnoredClassesInput,
} from "@/features/linter/lib/class-lint-ignore";
import { isThirdPartyClass } from "@/features/linter/lib/third-party-libraries";

describe("normalizeIgnoredClassList", () => {
  it("trims, dedupes, and preserves first occurrence order", () => {
    expect(normalizeIgnoredClassList([" a ", "b", " a ", ""])).toEqual(["a", "b"]);
  });
});

describe("parseIgnoredClassesInput", () => {
  it("splits on commas and whitespace", () => {
    expect(parseIgnoredClassesInput("foo, bar\nbaz")).toEqual(["foo", "bar", "baz"]);
  });
});

describe("buildMergedIgnoredClassSet", () => {
  it("merges global, preset built-in, and user preset lists", () => {
    const set = buildMergedIgnoredClassSet({
      globalIgnored: ["g"],
      presetBuiltinIgnored: ["b"],
      presetUserIgnored: ["u", "g"],
    });
    expect([...set].sort()).toEqual(["b", "g", "u"]);
  });
});

describe("buildClassLintFilter", () => {
  it("returns undefined when nothing is ignored", () => {
    expect(
      buildClassLintFilter({
        ignoreThirdPartyClasses: false,
        mergedIgnoredSet: new Set(),
      })
    ).toBeUndefined();
  });

  it("filters custom ignored classes", () => {
    const filter = buildClassLintFilter({
      ignoreThirdPartyClasses: false,
      mergedIgnoredSet: new Set(["skip-me"]),
    });
    expect(filter?.("skip-me")).toBe(false);
    expect(filter?.("keep-me")).toBe(true);
  });

  it("combines third-party and custom when both enabled", () => {
    const swiper = "swiper";
    expect(isThirdPartyClass(swiper)).toBe(true);
    const filter = buildClassLintFilter({
      ignoreThirdPartyClasses: true,
      mergedIgnoredSet: new Set(["custom"]),
    });
    expect(filter?.(swiper)).toBe(false);
    expect(filter?.("custom")).toBe(false);
    expect(filter?.("mine")).toBe(true);
  });
});
