import { describe, expect, it } from "vitest";
import type { StyleInfo } from "@/entities/style/model/style.types";
import type { ClassType, ElementAnalysisArgs, ElementClassItem } from "@/features/linter/model/rule.types";
import { createCFPaddingGlobalChildContainerRule } from "@/features/linter/rules/client-first/structure/padding-global-child-container";

function createMockArgs(options: {
  elementId?: string;
  classes?: ElementClassItem[];
  parentId?: string | null;
  parentClasses?: string[];
  allStyles?: StyleInfo[];
  getParentId?: (id: string) => string | null;
  getAncestorIds?: (id: string) => string[];
  getElementType?: (id: string) => string | null;
  componentIdByElementId?: Map<string, string>;
  siteComponentNameById?: Map<string, string>;
  getTagName?: (id: string) => string | null;
}): ElementAnalysisArgs {
  const {
    elementId = "el-child",
    classes = [],
    parentId = "el-pg",
    parentClasses = ["padding-global"],
    allStyles = [],
    getParentId: getParentIdOverride,
    getAncestorIds,
    getElementType,
    componentIdByElementId,
    siteComponentNameById,
    getTagName,
  } = options;

  const classNamesById: Record<string, string[]> = {
    ...(parentId ? { [parentId]: parentClasses } : {}),
    [elementId]: classes.map((c) => c.className),
  };

  return {
    elementId,
    classes,
    allStyles,
    getClassType: (className: string, isCombo?: boolean): ClassType => {
      if (isCombo === true) return "combo";
      if (className.startsWith("u-")) return "utility";
      if (className.startsWith("is-")) return "combo";
      if (className.includes("_")) return "custom";
      return "utility";
    },
    getRuleConfig: () => undefined,
    getParentId: getParentIdOverride ?? ((id: string) => (id === elementId ? parentId : null)),
    getAncestorIds,
    getElementType,
    componentIdByElementId,
    siteComponentNameById,
    getTagName,
    getClassNamesForElement: (id: string) => classNamesById[id] ?? [],
  };
}

describe("cf:structure:padding-global-child-container", () => {
  const rule = createCFPaddingGlobalChildContainerRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:structure:padding-global-child-container");
    expect(rule.type).toBe("structure");
    expect(rule.category).toBe("structure");
    expect(rule.severity).toBe("warning");
    expect(rule.enabled).toBe(true);
  });

  it("returns no violations when parent is not padding-global", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        parentClasses: ["padding-section-medium"],
        classes: [{ className: "hero_inner", order: 0, elementId: "el-child" }],
        allStyles: [
          {
            id: "st",
            name: "hero_inner",
            properties: { "max-width": "40rem" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toEqual([]);
  });

  it("returns no violations when child uses container-large", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "container-large", order: 0, elementId: "el-child" }],
        allStyles: [
          { id: "st", name: "container-large", properties: { "max-width": "80rem" }, order: 0, isCombo: false },
        ],
      })
    );
    expect(results).toEqual([]);
  });

  it("returns no violations for utility max-width-* without custom container-like CSS", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "max-width-large", order: 0, elementId: "el-child" }],
        allStyles: [
          { id: "st", name: "max-width-large", properties: { "max-width": "48rem" }, order: 0, isCombo: false },
        ],
      })
    );
    expect(results).toEqual([]);
  });

  it("returns no violations when custom class has no container-like properties", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "hero_content-wrapper", order: 0, elementId: "el-child" }],
        allStyles: [
          {
            id: "st",
            name: "hero_content-wrapper",
            properties: { display: "flex", gap: "1rem" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toEqual([]);
  });

  it("flags custom class with max-width under padding-global", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "hero_custom-inner", order: 0, elementId: "el-child" }],
        allStyles: [
          {
            id: "st",
            name: "hero_custom-inner",
            properties: { "max-width": "48rem" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].ruleId).toBe("cf:structure:padding-global-child-container");
    expect(results[0].elementId).toBe("el-child");
    expect(results[0].className).toBe("hero_custom-inner");
    expect(results[0].severity).toBe("warning");
  });

  it("uses suggestion severity when a ComponentInstance ancestor exists", () => {
    const elComp = "el-comp-root";
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "hero_custom-inner", order: 0, elementId: "el-child" }],
        getParentId: (id) => {
          if (id === "el-child") return "el-pg";
          if (id === "el-pg") return elComp;
          return null;
        },
        getElementType: (id) => (id === elComp ? "ComponentInstance" : null),
        allStyles: [
          {
            id: "st",
            name: "hero_custom-inner",
            properties: { "max-width": "48rem" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe("suggestion");
  });

  it("uses suggestion when the element has a nav_container class", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [
          { className: "nav_container", order: 0, elementId: "el-child" },
          { className: "hero_custom-inner", order: 1, elementId: "el-child" },
        ],
        allStyles: [
          {
            id: "st",
            name: "hero_custom-inner",
            properties: { "max-width": "48rem" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe("suggestion");
  });

  it("uses suggestion when a <nav> ancestor wraps padding-global", () => {
    const elNav = "el-nav";
    const results = rule.analyzeElement(
      createMockArgs({
        getParentId: (id) => {
          if (id === "el-child") return "el-pg";
          if (id === "el-pg") return elNav;
          return null;
        },
        getAncestorIds: () => ["el-pg", elNav],
        getTagName: (id) => (id === elNav ? "nav" : null),
        classes: [{ className: "hero_custom-inner", order: 0, elementId: "el-child" }],
        allStyles: [
          {
            id: "st",
            name: "hero_custom-inner",
            properties: { "max-width": "48rem" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe("suggestion");
  });

  it("uses suggestion when a placed site component definition is named nav", () => {
    const elComp = "el-comp-root";
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "hero_custom-inner", order: 0, elementId: "el-child" }],
        getParentId: (id) => {
          if (id === "el-child") return "el-pg";
          if (id === "el-pg") return elComp;
          return null;
        },
        getAncestorIds: () => ["el-pg", elComp],
        componentIdByElementId: new Map([[elComp, "def-nav"]]),
        siteComponentNameById: new Map([["def-nav", "nav"]]),
        allStyles: [
          {
            id: "st",
            name: "hero_custom-inner",
            properties: { "max-width": "48rem" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe("suggestion");
  });

  it("uses suggestion when componentIdByElementId contains a placed instance ancestor (no element type needed)", () => {
    const elComp = "el-comp-root";
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "hero_custom-inner", order: 0, elementId: "el-child" }],
        getParentId: (id) => {
          if (id === "el-child") return "el-pg";
          if (id === "el-pg") return elComp;
          return null;
        },
        getElementType: () => null,
        componentIdByElementId: new Map([[elComp, "comp-def-1"]]),
        allStyles: [
          {
            id: "st",
            name: "hero_custom-inner",
            properties: { "max-width": "48rem" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe("suggestion");
  });

  it("flags custom class with horizontal margin auto", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "about_inner", order: 0, elementId: "el-child" }],
        allStyles: [
          {
            id: "st",
            name: "about_inner",
            properties: { "margin-left": "auto", "margin-right": "auto" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].className).toBe("about_inner");
  });

  it("flags margin shorthand with auto", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "team_inner", order: 0, elementId: "el-child" }],
        allStyles: [
          {
            id: "st",
            name: "team_inner",
            properties: { margin: "0 auto" },
            order: 0,
            isCombo: false,
          },
        ],
      })
    );
    expect(results).toHaveLength(1);
  });

  it("returns empty when allStyles is missing definitions for custom class", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        classes: [{ className: "orphan_custom", order: 0, elementId: "el-child" }],
        allStyles: [],
      })
    );
    expect(results).toEqual([]);
  });

  it("returns empty when getParentId is missing", () => {
    const args = createMockArgs({
      classes: [{ className: "hero_custom-inner", order: 0, elementId: "el-child" }],
      allStyles: [
        { id: "st", name: "hero_custom-inner", properties: { "max-width": "48rem" }, order: 0, isCombo: false },
      ],
    });
    const results = rule.analyzeElement({ ...args, getParentId: undefined });
    expect(results).toEqual([]);
  });
});
