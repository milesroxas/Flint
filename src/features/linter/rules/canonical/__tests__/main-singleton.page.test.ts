// src/features/linter/rules/canonical/__tests__/main-singleton.page.test.ts
import { describe, expect, it } from "vitest";
import type { RolesByElement } from "@/features/linter/model/linter.types";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { createMainSingletonPageRule } from "@/features/linter/rules/canonical/main-singleton.page";

// Minimal, typed helper to invoke analyzePage with just what the rule needs
function runRule(
  rolesByElement?: RolesByElement,
  _tagsByElement?: Record<string, string>, // Kept for backward compatibility but not used
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
    // Provide stub to satisfy PageAnalysisArgs type
    getTagName: () => null,
    getElementType: () => null, // Not used by this rule
  });
}

describe("canonical:main-singleton.page", () => {
  it("returns no violations when exactly one main exists", () => {
    const roles: RolesByElement = {
      a: "unknown",
      b: "main",
      c: "section",
    };
    const out = runRule(roles);
    expect(out).toEqual([]);
  });

  it("reports one warning when no main exists (may be slot element)", () => {
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
    expect(v.severity).toBe("warning");
    expect(v.message).toMatch(/\[Slot\?\].*No main detected.*Verify slot has class.*tag set to <main>/i);
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
    const out = runRule(roles);
    // Should flag b and d only (for multiple mains)
    expect(out).toHaveLength(2);
    const ids = out.map((v) => (v as any).elementId).sort();
    expect(ids).toEqual(["b", "d"]);
    for (const v of out) {
      expect(v.ruleId).toBe("canonical:main-singleton");
      expect(v.name).toBe("Exactly one main role per page");
      expect(v.severity).toBe("error");
      expect(v.message).toMatch(/Multiple elements have role 'main'.*Keep exactly one main wrapper per page/i);
      expect((v as any).className).toBe("");
      expect((v as any).isCombo).toBe(false);
    }
  });

  it("reports warning when no main exists (empty rolesByElement)", () => {
    const out = runRule({});
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe("warning");
    expect(out[0].message).toMatch(/\[Slot\?\].*No main detected/i);
  });

  it("is pure for the same input", () => {
    const roles: RolesByElement = { a: "main", b: "main" };
    const out1 = runRule(roles);
    const out2 = runRule(roles);
    expect(out1).toEqual(out2);
  });

  // Note: HTML tag validation tests removed since Webflow doesn't expose native HTML tags reliably
  // Main element detection is now handled by preset-specific detectors
});
