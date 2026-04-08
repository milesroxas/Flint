import { describe, expect, it } from "vitest";
import { createMockElementGraph } from "@/__tests__/helpers/factories";
import {
  buildPlacedComponentSubtreeElementIds,
  isElementUnderPlacedComponentInstance,
} from "@/features/linter/lib/is-element-under-placed-component-instance";

describe("isElementUnderPlacedComponentInstance", () => {
  it("returns false when there are no ancestors (root element)", () => {
    expect(
      isElementUnderPlacedComponentInstance("root", {
        getParentId: () => null,
      })
    ).toBe(false);
  });

  it("returns false when ancestors are plain blocks with no component signals", () => {
    expect(
      isElementUnderPlacedComponentInstance("deep", {
        getParentId: (id) => {
          if (id === "deep") return "mid";
          if (id === "mid") return "main";
          if (id === "main") return null;
          return null;
        },
        getElementType: () => "Block",
      })
    ).toBe(false);
  });

  it("returns true when an ancestor id is in componentIdByElementId", () => {
    const compRoot = "el-comp";
    expect(
      isElementUnderPlacedComponentInstance("el-child", {
        getParentId: (id) => (id === "el-child" ? "el-pg" : id === "el-pg" ? compRoot : null),
        getElementType: () => null,
        componentIdByElementId: new Map([[compRoot, "def-1"]]),
      })
    ).toBe(true);
  });

  it("returns true when getElementType reports ComponentInstance on an ancestor", () => {
    const compRoot = "el-comp";
    expect(
      isElementUnderPlacedComponentInstance("el-child", {
        getParentId: (id) => (id === "el-child" ? compRoot : null),
        getElementType: (id) => (id === compRoot ? "ComponentInstance" : null),
      })
    ).toBe(true);
  });

  it("prefers componentIdByElementId over getElementType when both are present", () => {
    const compRoot = "el-comp";
    expect(
      isElementUnderPlacedComponentInstance("el-child", {
        getParentId: (id) => (id === "el-child" ? compRoot : null),
        getElementType: () => "Block",
        componentIdByElementId: new Map([[compRoot, "def-1"]]),
      })
    ).toBe(true);
  });

  it("uses getAncestorIds when provided (matches parent-walk semantics)", () => {
    const deps = {
      getAncestorIds: () => ["el-pg", "el-comp", "el-main"],
      getParentId: () => null as string | null,
      componentIdByElementId: new Map([["el-comp", "def-1"]]),
    };
    expect(isElementUnderPlacedComponentInstance("el-child", deps)).toBe(true);

    const depsNoComp = {
      getAncestorIds: () => ["el-pg", "el-main"],
      getElementType: () => "Block" as string | null,
    };
    expect(isElementUnderPlacedComponentInstance("el-child", depsNoComp)).toBe(false);
  });

  it("does not treat the element itself as an ancestor (only parents)", () => {
    expect(
      isElementUnderPlacedComponentInstance("el-comp", {
        getParentId: (id) => (id === "el-comp" ? null : null),
        componentIdByElementId: new Map([["el-comp", "def-1"]]),
      })
    ).toBe(false);
  });

  it("returns false when getParentId and getAncestorIds are missing", () => {
    expect(
      isElementUnderPlacedComponentInstance("x", {
        getElementType: () => "ComponentInstance",
        componentIdByElementId: new Map([["x", "def"]]),
      })
    ).toBe(false);
  });

  it("returns true when placedComponentSubtreeElementIds contains the element (graph subtree; no ancestor walk needed)", () => {
    expect(
      isElementUnderPlacedComponentInstance("el-deep", {
        getParentId: () => null,
        getElementType: () => null,
        componentIdByElementId: new Map(),
        placedComponentSubtreeElementIds: new Set(["el-comp", "el-deep"]),
      })
    ).toBe(true);
  });

  it("returns true when isEditingComponentDefinition (Designer getCurrentComponent) is active", () => {
    expect(
      isElementUnderPlacedComponentInstance("any-id", {
        isEditingComponentDefinition: true,
        getParentId: () => null,
        componentIdByElementId: new Map(),
      })
    ).toBe(true);
  });
});

describe("buildPlacedComponentSubtreeElementIds", () => {
  it("includes the root and every descendant for each placed instance id", () => {
    const parentMap: Record<string, string | null> = {
      root: null,
      comp: "root",
      mid: "comp",
      leaf: "mid",
    };
    const graph = createMockElementGraph(parentMap, {
      root: ["comp"],
      comp: ["mid"],
      mid: ["leaf"],
    });
    const set = buildPlacedComponentSubtreeElementIds(graph, new Map([["comp", "def-1"]]));
    expect(set.has("comp")).toBe(true);
    expect(set.has("mid")).toBe(true);
    expect(set.has("leaf")).toBe(true);
    expect(set.has("root")).toBe(false);
  });
});
