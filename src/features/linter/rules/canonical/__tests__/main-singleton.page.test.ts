// src/features/linter/rules/canonical/__tests__/main-singleton.page.test.ts
import { describe, it, expect } from "vitest";
import { createMainSingletonPageRule } from "@/features/linter/rules/canonical/main-singleton.page";
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { RolesByElement } from "@/features/linter/model/linter.types";

// Minimal, typed helper to invoke analyzePage with just what the rule needs
function runRule(rolesByElement?: RolesByElement): RuleResult[] {
  const rule = createMainSingletonPageRule();

  return rule.analyzePage({
    rolesByElement: rolesByElement || {},
    graph: {
      getParentId: () => null,
      getChildrenIds: () => [],
      getAncestorIds: () => [],
    },
    styles: [],
    getRoleForElement: (id: string) => rolesByElement?.[id] || "unknown",
    getRuleConfig: () => ({
      ruleId: "test",
      enabled: true,
      severity: "error",
      customSettings: {} as any,
    }),
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
    expect(v.message).toMatch(/No main role detected/i);
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
    // Should flag b and d only
    expect(out).toHaveLength(2);
    const ids = out.map((v) => (v as any).elementId).sort();
    expect(ids).toEqual(["b", "d"]);
    for (const v of out) {
      expect(v.ruleId).toBe("canonical:main-singleton");
      expect(v.name).toBe("Exactly one main role per page");
      expect(v.severity).toBe("error");
      expect(v.message).toMatch(/Multiple main roles detected/i);
      expect((v as any).className).toBe("");
      expect((v as any).isCombo).toBe(false);
    }
  });

  it("reports violation when no main exists (empty rolesByElement)", () => {
    const out = runRule({});
    expect(out).toHaveLength(1);
    expect(out[0].message).toMatch(/No main role detected/i);
  });

  it("is pure for the same input", () => {
    const roles: RolesByElement = { a: "main", b: "main" };
    const out1 = runRule(roles);
    const out2 = runRule(roles);
    expect(out1).toEqual(out2);
  });
});
