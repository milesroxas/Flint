import { describe, expect, it } from "vitest";
import { createPageAnalysisArgs } from "@/__tests__/helpers/factories";
import { createCFGlobalStylesRequiredRule } from "@/features/linter/rules/client-first/structure/global-styles-required.page";

describe("createCFGlobalStylesRequiredRule", () => {
  const rule = createCFGlobalStylesRequiredRule();

  it("passes when a global-styles class is present", () => {
    const args = createPageAnalysisArgs({
      styles: [
        {
          id: "s1",
          name: "global-styles",
          properties: {},
          order: 0,
          isCombo: false,
          elementId: "a",
        },
      ],
    });
    expect(rule.analyzePage(args)).toEqual([]);
  });

  it("passes when a Global Styles component instance is on the page", () => {
    const args = createPageAnalysisArgs({
      styles: [],
      siteComponentNameById: new Map([["cmp-1", "Global Styles"]]),
      componentIdByElementId: new Map([["root-instance", "cmp-1"]]),
    });
    expect(rule.analyzePage(args)).toEqual([]);
  });

  it("passes when multiple instances share the same definition id", () => {
    const args = createPageAnalysisArgs({
      styles: [],
      siteComponentNameById: new Map([["cmp-1", "Global Styles"]]),
      componentIdByElementId: new Map([
        ["inst-a", "cmp-1"],
        ["inst-b", "cmp-1"],
      ]),
    });
    expect(rule.analyzePage(args)).toEqual([]);
  });

  it("passes when the site catalog uses title case and spacing in the name", () => {
    const args = createPageAnalysisArgs({
      styles: [],
      siteComponentNameById: new Map([["id-9", "  Global  Styles  "]]),
      componentIdByElementId: new Map([["el-1", "id-9"]]),
    });
    expect(rule.analyzePage(args)).toEqual([]);
  });

  it("reports when neither class nor matching component instance exists", () => {
    const args = createPageAnalysisArgs({ styles: [] });
    expect(rule.analyzePage(args).length).toBe(1);
  });
});
