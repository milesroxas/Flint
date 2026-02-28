import { describe, expect, it } from "vitest";
import type { ElementRole } from "@/features/linter/model/linter.types";
import type { ClassType, ElementAnalysisArgs, ElementClassItem } from "@/features/linter/model/rule.types";
import { createCFNavOutsideMainRule } from "@/features/linter/rules/client-first/structure/nav-outside-main";

function createMockArgs(options: {
  elementId?: string;
  classes?: Array<{ className: string; order: number }>;
  tagName?: string | null;
  ancestorIds?: string[];
  ancestorRoles?: Record<string, ElementRole>;
  ancestorClasses?: Record<string, string[]>;
}): ElementAnalysisArgs {
  const {
    elementId = "test-element",
    classes = [],
    tagName = null,
    ancestorIds = [],
    ancestorRoles = {},
    ancestorClasses = {},
  } = options;

  const elementClasses: ElementClassItem[] = classes.map((c) => ({
    className: c.className,
    order: c.order,
    elementId,
  }));

  return {
    elementId,
    classes: elementClasses,
    allStyles: [],
    getClassType: (className: string): ClassType => {
      if (className.startsWith("is-")) return "combo";
      if (className.includes("_")) return "custom";
      return "utility";
    },
    getRuleConfig: () => undefined,
    getTagName: (id: string) => (id === elementId ? tagName : null),
    getAncestorIds: (id: string) => (id === elementId ? ancestorIds : []),
    getRoleForElement: (id: string) => (ancestorRoles[id] ?? "unknown") as ElementRole,
    getClassNamesForElement: (id: string) => ancestorClasses[id] ?? [],
  };
}

describe("cf:structure:nav-outside-main", () => {
  const rule = createCFNavOutsideMainRule();

  it("exposes correct rule metadata", () => {
    expect(rule.id).toBe("cf:structure:nav-outside-main");
    expect(rule.type).toBe("structure");
    expect(rule.category).toBe("structure");
    expect(rule.severity).toBe("warning");
    expect(rule.enabled).toBe(true);
  });

  it("flags nav tag inside main-wrapper (by role)", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        tagName: "nav",
        classes: [{ className: "navbar_component", order: 0 }],
        ancestorIds: ["parent-1", "main-el"],
        ancestorRoles: { "main-el": "main" },
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].ruleId).toBe("cf:structure:nav-outside-main");
    expect(results[0].severity).toBe("warning");
  });

  it("flags nav tag inside main-wrapper (by class name)", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        tagName: "nav",
        classes: [{ className: "navbar_component", order: 0 }],
        ancestorIds: ["parent-1"],
        ancestorClasses: { "parent-1": ["main-wrapper"] },
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0].ruleId).toBe("cf:structure:nav-outside-main");
  });

  it("flags nav class inside main-wrapper", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        tagName: "div",
        classes: [{ className: "navbar_component", order: 0 }],
        ancestorIds: ["main-el"],
        ancestorRoles: { "main-el": "main" },
      })
    );
    expect(results).toHaveLength(1);
  });

  it("passes for nav outside main-wrapper", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        tagName: "nav",
        classes: [{ className: "navbar_component", order: 0 }],
        ancestorIds: ["page-wrapper-el"],
        ancestorRoles: {},
        ancestorClasses: { "page-wrapper-el": ["page-wrapper"] },
      })
    );
    expect(results).toEqual([]);
  });

  it("passes for non-nav elements inside main", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        tagName: "div",
        classes: [{ className: "hero_wrapper", order: 0 }],
        ancestorIds: ["main-el"],
        ancestorRoles: { "main-el": "main" },
      })
    );
    expect(results).toEqual([]);
  });

  it("passes for elements without ancestors", () => {
    const results = rule.analyzeElement(
      createMockArgs({
        tagName: "nav",
        classes: [{ className: "navbar_component", order: 0 }],
        ancestorIds: [],
      })
    );
    expect(results).toEqual([]);
  });

  it("handles missing getTagName gracefully", () => {
    const args = createMockArgs({
      classes: [{ className: "hero_wrapper", order: 0 }],
    });
    // Remove getTagName
    const argsNoTag = { ...args, getTagName: undefined };
    const results = rule.analyzeElement(argsNoTag);
    expect(results).toEqual([]);
  });
});
