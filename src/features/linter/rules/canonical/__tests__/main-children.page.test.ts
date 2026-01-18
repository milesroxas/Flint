// src/features/linter/rules/canonical/__tests__/main-children.page.test.ts
import { describe, expect, it } from "vitest";
import type { ElementGraph } from "@/entities/element/services/element-graph.service";
import type { ElementRole, RolesByElement } from "@/features/linter/model/linter.types";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { createMainChildrenPageRule } from "@/features/linter/rules/canonical/main-children.page";

// Minimal, typed helper to invoke analyzePage with just what the rule needs
function runRule(rolesByElement?: RolesByElement, graphStructure?: Record<string, string[]>): RuleResult[] {
  const rule = createMainChildrenPageRule();

  // Create a mock graph based on the structure provided
  const graph: ElementGraph = {
    getParentId: (id: string) => {
      // Find parent by looking through structure
      for (const [parentId, children] of Object.entries(graphStructure || {})) {
        if (children.includes(id)) {
          return parentId;
        }
      }
      return null;
    },
    getChildrenIds: (id: string) => graphStructure?.[id] || [],
    getAncestorIds: (id: string) => {
      const ancestors: string[] = [];
      let currentId: string | null = id;
      while (currentId) {
        currentId = graph.getParentId(currentId);
        if (currentId) {
          ancestors.push(currentId);
        }
      }
      return ancestors;
    },
    getDescendantIds: (id: string) => {
      const descendants: string[] = [];
      const queue = [...(graphStructure?.[id] || [])];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const currentId = queue.shift();
        if (currentId && !visited.has(currentId)) {
          visited.add(currentId);
          descendants.push(currentId);
          queue.push(...(graphStructure?.[currentId] || []));
        }
      }
      return descendants;
    },
    getTag: async () => await Promise.resolve(null),
  };

  return rule.analyzePage({
    rolesByElement: rolesByElement || {},
    graph,
    styles: [], // Not used by this rule
    getRoleForElement: (id: string): ElementRole => rolesByElement?.[id] || "unknown",
    getRuleConfig: () => ({
      ruleId: "test",
      enabled: true,
      severity: "error",
      customSettings: {} as any,
    }),
    getTagName: () => null, // Not used by this rule
    getElementType: () => null, // Not used by this rule
  });
}

describe("canonical:main-children.page", () => {
  it("returns no violations when main contains a section", () => {
    const roles: RolesByElement = {
      main1: "main",
      section1: "section",
      div1: "unknown",
    };
    const structure = {
      main1: ["section1", "div1"],
    };
    const out = runRule(roles, structure);
    expect(out).toEqual([]);
  });

  it("returns no violations when main contains a component root", () => {
    const roles: RolesByElement = {
      main1: "main",
      comp1: "componentRoot",
      div1: "unknown",
    };
    const structure = {
      main1: ["comp1", "div1"],
    };
    const out = runRule(roles, structure);
    expect(out).toEqual([]);
  });

  it("returns no violations when main contains both sections and component roots", () => {
    const roles: RolesByElement = {
      main1: "main",
      section1: "section",
      comp1: "componentRoot",
      div1: "unknown",
    };
    const structure = {
      main1: ["section1", "comp1", "div1"],
    };
    const out = runRule(roles, structure);
    expect(out).toEqual([]);
  });

  it("returns no violations when semantic content is nested deep", () => {
    const roles: RolesByElement = {
      main1: "main",
      wrapper1: "unknown",
      wrapper2: "unknown",
      section1: "section",
    };
    const structure = {
      main1: ["wrapper1"],
      wrapper1: ["wrapper2"],
      wrapper2: ["section1"],
    };
    const out = runRule(roles, structure);
    expect(out).toEqual([]);
  });

  it("returns no violations when no main element exists", () => {
    const roles: RolesByElement = {
      section1: "section",
      comp1: "componentRoot",
    };
    const structure = {
      section1: [],
      comp1: [],
    };
    const out = runRule(roles, structure);
    expect(out).toEqual([]);
  });

  it("reports violation when main has no semantic content", () => {
    const roles: RolesByElement = {
      main1: "main",
      div1: "unknown",
      div2: "unknown",
    };
    const structure = {
      main1: ["div1", "div2"],
    };
    const out = runRule(roles, structure);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-children");
    expect(v.name).toBe("Main should contain sections or component roots");
    expect(v.severity).toBe("error");
    expect(v.elementId).toBe("main1");
    expect(v.message).toMatch(/Main element must contain at least one section or component root/);
    expect(v.className).toBe("");
    expect(v.isCombo).toBe(false);
  });

  it("reports violation when main is empty", () => {
    const roles: RolesByElement = {
      main1: "main",
    };
    const structure = {
      main1: [],
    };
    const out = runRule(roles, structure);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-children");
    expect(v.elementId).toBe("main1");
    expect(v.message).toMatch(/No semantic roles found/);
  });

  it("includes helpful information about found roles in error message", () => {
    const roles: RolesByElement = {
      main1: "main",
      container1: "container",
      layout1: "layout",
      div1: "unknown",
    };
    const structure = {
      main1: ["container1", "layout1", "div1"],
    };
    const out = runRule(roles, structure);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.message).toMatch(/Found roles: container, layout/);
  });

  it("handles complex nested structures without semantic content", () => {
    const roles: RolesByElement = {
      main1: "main",
      wrapper1: "unknown",
      wrapper2: "container",
      wrapper3: "layout",
      div1: "unknown",
      div2: "unknown",
    };
    const structure = {
      main1: ["wrapper1"],
      wrapper1: ["wrapper2", "wrapper3"],
      wrapper2: ["div1"],
      wrapper3: ["div2"],
    };
    const out = runRule(roles, structure);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.elementId).toBe("main1");
    expect(v.message).toMatch(/Found roles: container, layout/);
  });

  it("stops searching once semantic content is found", () => {
    const roles: RolesByElement = {
      main1: "main",
      section1: "section",
      unreachable1: "componentRoot", // This should not affect the result
    };
    const structure = {
      main1: ["section1"],
      section1: ["unreachable1"],
    };
    const out = runRule(roles, structure);
    expect(out).toEqual([]);
  });

  it("handles circular references gracefully", () => {
    const roles: RolesByElement = {
      main1: "main",
      wrapper1: "unknown",
      wrapper2: "unknown",
    };

    // Create a mock graph with circular reference handling
    const rule = createMainChildrenPageRule();
    const graph: ElementGraph = {
      getParentId: () => null,
      getChildrenIds: (id: string) => {
        if (id === "main1") return ["wrapper1"];
        if (id === "wrapper1") return ["wrapper2"];
        if (id === "wrapper2") return ["wrapper1"]; // Circular!
        return [];
      },
      getAncestorIds: () => [],
      getDescendantIds: () => [],
      getTag: async () => await Promise.resolve(null),
    };

    const out = rule.analyzePage({
      rolesByElement: roles,
      graph,
      styles: [],
      getRoleForElement: (id: string): ElementRole => roles[id] || "unknown",
      getRuleConfig: () => ({
        ruleId: "test",
        enabled: true,
        severity: "error",
        customSettings: {} as any,
      }),
      getTagName: () => null,
      getElementType: () => null,
    });

    expect(out).toHaveLength(1);
    expect(out[0].elementId).toBe("main1");
  });

  it("is pure for the same input", () => {
    const roles: RolesByElement = {
      main1: "main",
      div1: "unknown",
    };
    const structure = {
      main1: ["div1"],
    };
    const out1 = runRule(roles, structure);
    const out2 = runRule(roles, structure);
    expect(out1).toEqual(out2);
  });

  it("filters out unknown roles from error message", () => {
    const roles: RolesByElement = {
      main1: "main",
      div1: "unknown",
      div2: "unknown",
      container1: "container",
    };
    const structure = {
      main1: ["div1", "div2", "container1"],
    };
    const out = runRule(roles, structure);
    expect(out).toHaveLength(1);
    const v = out[0];
    // Should only mention "container", not "unknown"
    expect(v.message).toMatch(/Found roles: container/);
    expect(v.message).not.toMatch(/unknown/);
  });

  it("handles multiple main elements by only checking the first one found", () => {
    const roles: RolesByElement = {
      main1: "main",
      main2: "main", // Second main
      section1: "section",
      div1: "unknown",
    };
    const structure = {
      main1: ["div1"], // No semantic content
      main2: ["section1"], // Has semantic content
    };
    const out = runRule(roles, structure);

    // Should only check the first main found (main1 in this case due to Object.entries order)
    expect(out).toHaveLength(1);
    expect(out[0].elementId).toBe("main1");
  });
});
