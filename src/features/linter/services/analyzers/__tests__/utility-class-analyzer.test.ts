import { describe, expect, it } from "vitest";
import type { StyleInfo } from "@/entities/style/model/style.types";
import { createUtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";

describe("createUtilityClassAnalyzer", () => {
  it("indexes only names matching isUtilityName when provided", () => {
    const analyzer = createUtilityClassAnalyzer({
      isUtilityName: (n) => n.startsWith("u-"),
    });
    const styles: StyleInfo[] = [
      {
        id: "1",
        name: "u-a",
        properties: { "margin-top": "1rem" },
        order: 0,
        isCombo: false,
      },
      {
        id: "2",
        name: "custom_block",
        properties: { "margin-top": "1rem" },
        order: 1,
        isCombo: false,
      },
    ];
    analyzer.buildPropertyMaps(styles);
    expect(analyzer.getUtilityClassPropertiesMap().has("u-a")).toBe(true);
    expect(analyzer.getUtilityClassPropertiesMap().has("custom_block")).toBe(false);
  });

  it("analyzeDuplicates finds overlapping single-property utilities", () => {
    const analyzer = createUtilityClassAnalyzer();
    const styles: StyleInfo[] = [
      {
        id: "1",
        name: "dup-one",
        properties: { "padding-left": "8px" },
        order: 0,
        isCombo: false,
      },
      {
        id: "2",
        name: "dup-two",
        properties: { "padding-left": "8px" },
        order: 1,
        isCombo: false,
      },
    ];
    analyzer.buildPropertyMaps(styles);
    const info = analyzer.analyzeDuplicates("dup-two", { "padding-left": "8px" });
    expect(info).not.toBeNull();
    expect(info?.duplicateProperties.size).toBeGreaterThan(0);
  });

  it("reset clears cached maps", () => {
    const analyzer = createUtilityClassAnalyzer();
    analyzer.buildPropertyMaps([{ id: "1", name: "u-x", properties: { x: "1" }, order: 0, isCombo: false }]);
    analyzer.reset();
    expect(analyzer.getUtilityClassPropertiesMap().size).toBe(0);
  });
});
