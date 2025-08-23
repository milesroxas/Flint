// src/features/linter/rules/canonical/__tests__/main-singleton.page.test.ts
import { describe, it, expect } from "vitest";
import { createMainSingletonPageRule } from "@/features/linter/rules/canonical/main-singleton.page";
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { RolesByElement } from "@/features/linter/model/linter.types";

// Minimal, typed helper to invoke analyzePage with just what the rule needs
function runRule(
  rolesByElement?: RolesByElement,
  tagsByElement?: Record<string, string>,
  stylesByElement?: Record<string, string[]>
): RuleResult[] {
  const rule = createMainSingletonPageRule();

  // Build styles array from stylesByElement for testing
  const styles = stylesByElement
    ? Object.entries(stylesByElement).flatMap(([elementId, classNames]) =>
        classNames.map((name) => ({
          name,
          properties: {},
          elementId,
        }))
      )
    : [];

  return rule.analyzePage({
    rolesByElement: rolesByElement || {},
    graph: {
      getParentId: () => null,
      getChildrenIds: () => [],
      getAncestorIds: () => [],
      getDescendantIds: () => [],
      getTag: async () => await Promise.resolve(null),
    },
    styles: styles as any,
    getRoleForElement: (id: string) => rolesByElement?.[id] || "unknown",
    getRuleConfig: () => ({
      ruleId: "test",
      enabled: true,
      severity: "error",
      customSettings: {} as any,
    }),
    getTagName: (id: string) => tagsByElement?.[id] || null,
    getElementType: () => null, // Not used by this rule
  });
}

describe("canonical:main-singleton.page", () => {
  it("returns no violations when exactly one main exists with correct tag", () => {
    const roles: RolesByElement = {
      a: "unknown",
      b: "main",
      c: "section",
    };
    const tags = {
      b: "main", // Correct tag
    };
    const out = runRule(roles, tags);
    expect(out).toEqual([]);
  });

  it("reports one violation when no main exists", () => {
    const roles: RolesByElement = {
      a: "section",
      b: "componentRoot",
      c: "unknown",
    };
    const out = runRule(roles);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-singleton");
    expect(v.name).toBe("Exactly one main role per page");
    expect(v.severity).toBe("error");
    expect(v.message).toMatch(/No element with role 'main' detected/i);
    // absence case carries no elementId, className="", isCombo=false per implementation
    expect((v as any).elementId).toBeUndefined();
    expect((v as any).className).toBe("");
    expect((v as any).isCombo).toBe(false);
  });

  it("reports each extra main beyond the first, attaching elementId", () => {
    // Order matters here; extras are all mains except the first encountered key
    const roles: RolesByElement = {
      a: "main", // first
      b: "main", // extra
      c: "section",
      d: "main", // extra
      e: "unknown",
    };
    const tags = {
      a: "main", // proper tag
      b: "main", // proper tag
      d: "main", // proper tag
    };
    const out = runRule(roles, tags);
    // Should flag b and d only (for multiple mains, not tag issues)
    expect(out).toHaveLength(2);
    const ids = out.map((v) => (v as any).elementId).sort();
    expect(ids).toEqual(["b", "d"]);
    for (const v of out) {
      expect(v.ruleId).toBe("canonical:main-singleton");
      expect(v.name).toBe("Exactly one main role per page");
      expect(v.severity).toBe("error");
      expect(v.message).toMatch(/Multiple elements have role 'main'/i);
      expect((v as any).className).toBe("");
      expect((v as any).isCombo).toBe(false);
    }
  });

  it("reports violation when no main exists (empty rolesByElement)", () => {
    const out = runRule({});
    expect(out).toHaveLength(1);
    expect(out[0].message).toMatch(/No element with role 'main' detected/i);
  });

  it("is pure for the same input", () => {
    const roles: RolesByElement = { a: "main", b: "main" };
    const tags = { a: "main", b: "div" }; // mixed tags for consistent testing
    const out1 = runRule(roles, tags);
    const out2 = runRule(roles, tags);
    expect(out1).toEqual(out2);
  });

  it("reports violation when main role element uses wrong tag", () => {
    const roles: RolesByElement = {
      a: "main",
    };
    const tags = {
      a: "div", // Should be 'main'
    };
    const out = runRule(roles, tags);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-singleton");
    expect(v.elementId).toBe("a");
    expect(v.message).toMatch(/should use <main> tag, but uses <div>/);
  });

  it("returns no violations when main role uses correct main tag", () => {
    const roles: RolesByElement = {
      a: "main",
    };
    const tags = {
      a: "main",
    };
    const out = runRule(roles, tags);
    expect(out).toEqual([]);
  });

  it("reports violation when main role element has null tag (non-DOM)", () => {
    const roles: RolesByElement = {
      a: "main",
    };
    const tags = {
      // a: null - implicitly null when not provided
    };
    const out = runRule(roles, tags);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-singleton");
    expect(v.elementId).toBe("a");
    expect(v.message).toMatch(/must be a DOM element with <main> tag/);
  });

  it("handles multiple violations: multiple mains AND wrong tag", () => {
    const roles: RolesByElement = {
      a: "main", // First main (kept)
      b: "main", // Extra main (flagged)
      c: "main", // Extra main (flagged)
    };
    const tags = {
      a: "div", // Wrong tag for first main
      b: "section", // Wrong tag for extra main
      c: "main", // Correct tag for extra main
    };
    const out = runRule(roles, tags);

    // Should have violations for:
    // - 2 extra mains (b, c)
    // - 3 wrong tags (a: div, b: section, c gets wrong tag violation too)
    expect(out.length).toBeGreaterThanOrEqual(2); // At least extras

    // Check for multiple main violations
    const multipleMainViolations = out.filter((v) =>
      v.message.includes("Multiple elements have role 'main'")
    );
    expect(multipleMainViolations).toHaveLength(2); // b and c flagged as extras

    // Check for wrong tag violations
    const wrongTagViolations = out.filter((v) =>
      v.message.includes("should use <main> tag")
    );
    expect(wrongTagViolations.length).toBeGreaterThanOrEqual(1); // At least one wrong tag
  });

  // New tests for preset-specific fallback logic
  it("accepts Lumos page_main class when tag is null with warning", () => {
    const roles: RolesByElement = {
      a: "main",
    };
    const tags = {
      // a: null - no tag provided
    };
    const styles = {
      a: ["page_main"],
    };
    const out = runRule(roles, tags, styles);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-singleton");
    expect(v.elementId).toBe("a");
    expect(v.severity).toBe("warning");
    expect(v.message).toMatch(
      /should use <main> tag.*preset-specific main class/
    );
  });

  it("accepts Client-First main-wrapper class when tag is wrong with warning", () => {
    const roles: RolesByElement = {
      a: "main",
    };
    const tags = {
      a: "div",
    };
    const styles = {
      a: ["main-wrapper"],
    };
    const out = runRule(roles, tags, styles);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-singleton");
    expect(v.elementId).toBe("a");
    expect(v.severity).toBe("warning");
    expect(v.message).toMatch(
      /should use <main> tag.*Detected preset-specific main class/
    );
  });

  it("accepts Client-First main_ pattern when tag is null with warning", () => {
    const roles: RolesByElement = {
      a: "main",
    };
    const tags = {
      // a: null - no tag provided
    };
    const styles = {
      a: ["main_content"],
    };
    const out = runRule(roles, tags, styles);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-singleton");
    expect(v.elementId).toBe("a");
    expect(v.severity).toBe("warning");
    expect(v.message).toMatch(
      /should use <main> tag.*preset-specific main class/
    );
  });

  it("still reports error when no tag and no preset class", () => {
    const roles: RolesByElement = {
      a: "main",
    };
    const tags = {
      // a: null - no tag provided
    };
    const styles = {
      a: ["some-other-class"],
    };
    const out = runRule(roles, tags, styles);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-singleton");
    expect(v.elementId).toBe("a");
    expect(v.severity).toBe("error");
    expect(v.message).toMatch(
      /must be a DOM element with <main> tag.*no tag was found/
    );
  });

  it("still reports error when wrong tag and no preset class", () => {
    const roles: RolesByElement = {
      a: "main",
    };
    const tags = {
      a: "div",
    };
    const styles = {
      a: ["some-other-class"],
    };
    const out = runRule(roles, tags, styles);
    expect(out).toHaveLength(1);
    const v = out[0];
    expect(v.ruleId).toBe("canonical:main-singleton");
    expect(v.elementId).toBe("a");
    expect(v.severity).toBe("error");
    expect(v.message).toMatch(/should use <main> tag.*but uses <div>/);
  });

  it("returns no violations when correct main tag is used (overrides preset class)", () => {
    const roles: RolesByElement = {
      a: "main",
    };
    const tags = {
      a: "main",
    };
    const styles = {
      a: ["page_main"], // Preset class present but main tag takes precedence
    };
    const out = runRule(roles, tags, styles);
    expect(out).toEqual([]);
  });
});
