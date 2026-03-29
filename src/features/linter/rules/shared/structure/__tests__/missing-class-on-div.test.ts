import { describe, expect, it } from "vitest";
import type { ElementAnalysisArgs, ElementClassItem } from "@/features/linter/model/rule.types";
import { createMissingClassOnDivRule } from "@/features/linter/rules/shared/structure/missing-class-on-div";

function mockArgs(options: {
  elementId: string;
  elementType: string | null;
  classes: ElementClassItem[];
}): ElementAnalysisArgs {
  return {
    elementId: options.elementId,
    classes: options.classes,
    allStyles: [],
    getClassType: () => "utility",
    getRuleConfig: () => undefined,
    getElementType: (id: string) => (id === options.elementId ? options.elementType : null),
  };
}

describe("shared:structure:missing-class-on-div", () => {
  const rule = createMissingClassOnDivRule();

  it("flags Block elements with no classes", () => {
    const out = rule.analyzeElement(
      mockArgs({
        elementId: "div-1",
        elementType: "Block",
        classes: [],
      })
    );
    expect(out).toHaveLength(1);
    expect(out[0].ruleId).toBe("shared:structure:missing-class-on-div");
    expect(out[0].elementId).toBe("div-1");
  });

  it("passes Block elements that have at least one class", () => {
    const out = rule.analyzeElement(
      mockArgs({
        elementId: "div-1",
        elementType: "Block",
        classes: [{ className: "hero_wrapper", order: 0, elementId: "div-1" }],
      })
    );
    expect(out).toEqual([]);
  });

  it("ignores non-Block elements", () => {
    const out = rule.analyzeElement(
      mockArgs({
        elementId: "img-1",
        elementType: "Image",
        classes: [],
      })
    );
    expect(out).toEqual([]);
  });

  it("returns empty when getElementType is unavailable", () => {
    const args = mockArgs({ elementId: "div-1", elementType: "Block", classes: [] });
    const { getElementType: _, ...rest } = args;
    expect(rule.analyzeElement({ ...rest, getElementType: undefined })).toEqual([]);
  });
});
