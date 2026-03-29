import { describe, expect, it } from "vitest";
import type { ClassType, ElementAnalysisArgs, ElementClassItem } from "@/features/linter/model/rule.types";
import { createSectionParentIsMainRule } from "@/features/linter/rules/canonical/section-parent-is-main";

function mockArgs(options: {
  elementId: string;
  role: "section" | "main" | "unknown";
  parentId: string | null;
  parentRole?: "section" | "main" | "unknown";
  classes?: ElementClassItem[];
}): ElementAnalysisArgs {
  const { elementId, role, parentId, parentRole = "unknown", classes } = options;
  const elementClasses: ElementClassItem[] =
    classes ?? ([{ className: "about_section", order: 0, elementId }] as ElementClassItem[]);

  return {
    elementId,
    classes: elementClasses,
    allStyles: [],
    getClassType: (name: string, isCombo?: boolean): ClassType => {
      if (isCombo) return "combo";
      if (name.includes("_")) return "custom";
      return "utility";
    },
    getRuleConfig: () => undefined,
    getRoleForElement: (id: string) => {
      if (id === elementId) return role;
      if (parentId && id === parentId) return parentRole;
      return "unknown";
    },
    getParentId: (id: string) => (id === elementId ? parentId : null),
  };
}

describe("canonical:section-parent-is-main", () => {
  const rule = createSectionParentIsMainRule();

  it("exposes expected metadata", () => {
    expect(rule.id).toBe("canonical:section-parent-is-main");
    expect(rule.type).toBe("structure");
    expect(rule.severity).toBe("error");
  });

  it("returns no violations when section is direct child of main", () => {
    const out = rule.analyzeElement(
      mockArgs({
        elementId: "sec-1",
        role: "section",
        parentId: "main-1",
        parentRole: "main",
      })
    );
    expect(out).toEqual([]);
  });

  it("flags section when parent is not main", () => {
    const out = rule.analyzeElement(
      mockArgs({
        elementId: "sec-1",
        role: "section",
        parentId: "wrapper-1",
        parentRole: "unknown",
      })
    );
    expect(out).toHaveLength(1);
    expect(out[0].ruleId).toBe("canonical:section-parent-is-main");
    expect(out[0].elementId).toBe("sec-1");
    expect(out[0].message).toContain("direct child of the main role");
  });

  it("skips non-section elements", () => {
    const out = rule.analyzeElement(
      mockArgs({
        elementId: "div-1",
        role: "unknown",
        parentId: "main-1",
        parentRole: "main",
      })
    );
    expect(out).toEqual([]);
  });

  it("returns empty when getParentId is missing", () => {
    const args = mockArgs({
      elementId: "sec-1",
      role: "section",
      parentId: "main-1",
      parentRole: "main",
    });
    const { getParentId: _, ...rest } = args;
    const out = rule.analyzeElement({ ...rest, getParentId: undefined });
    expect(out).toEqual([]);
  });
});
