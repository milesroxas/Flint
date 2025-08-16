# Implementation Package: Rule Restructure per PRD and current implementation status.

---

## 1) Objectives

- Move structural validation to canonical, preset-agnostic rules that use roles and the element graph.
- Keep preset grammar in small detectors only.
- Unify page and element scans behind the same detection and graph helpers.
- Keep everything strictly typed and built via factory functions.

---

## 2) Deliverables

- Updated types with canonical roles and rule inputs.
- Element graph utility with `getParentId`, `getChildrenIds`, `getAncestorIds`.
- Runner updates that pass `elementId` and graph helpers into rules.
- Page rule runner for page-scope assertions like main singleton.
- Canonical structural rules (5 files) ready to register in presets.
- Preset wiring for Lumos that combines canonical structural rules and Lumos naming rules.
- Minimal tests for detectors and structural rules.

---

## 3) Directory layout

```txt
src/
  features/
    linter/
      model/
        linter.types.ts
        rule.types.ts
      services/
        role-detection.service.ts
        rule-runner.ts
        page-rule-runner.ts
        element-graph.service.ts
      rules/
        canonical/
          main-singleton.page.ts
          main-children.page.ts
          section-parent-is-main.ts
          component-root-structure.ts
          child-group-key-match.ts
        lumos/
          naming-class-format.ts
          naming-root-has-wrap-suffix.ts
          naming-childgroup-has-wrap-suffix.ts
          naming-combo-limit.ts
  presets/
    lumos.preset.ts
    client-first.preset.ts
docs/
  guides/
    implementation-guide-canonical-roles.md
```

---

## 4) Type updates

Add `elementId` to the rule input so rules do not rely on `classes[0]` for identity. Ensure canonical roles are first class.

```ts
// src/features/linter/model/linter.types.ts
export type ElementRole =
  | "main"
  | "section"
  | "componentRoot"
  | "childGroup"
  | "container"
  | "layout"
  | "content"
  | "unknown";

export type RolesByElement = Record<string, ElementRole>;

export interface ParsedClass {
  raw: string;
  kind: "utility" | "combo" | "custom" | "unknown";
  componentKey?: string | null;
  // other tokens as needed
}

export interface GrammarAdapter {
  parse: (name: string) => ParsedClass;
}
```

```ts
// src/features/linter/model/rule.types.ts
import type { ElementRole, RolesByElement, ParsedClass } from "./linter.types";

export interface ElementClassItem {
  className: string;
  isCombo: boolean;
  comboIndex?: number;
}

export interface RuleConfiguration {
  enabled?: boolean;
  severity?: "error" | "warning" | "info";
  [k: string]: unknown;
}

export interface RuleResult {
  ruleId: string;
  name: string;
  message: string;
  severity: "error" | "warning" | "info";
  className: string;
  isCombo: boolean;
  elementId?: string;
  metadata?: Record<string, unknown>;
}

export interface ElementAnalysisArgs {
  elementId: string;
  classes: ElementClassItem[];
  contexts: string[];
  allStyles: unknown[];
  rolesByElement?: RolesByElement;
  getRoleForElement?: (id: string) => ElementRole;
  getParentId?: (id: string) => string | null;
  getChildrenIds?: (id: string) => string[];
  getAncestorIds?: (id: string) => string[];
  getClassNamesForElement?: (id: string) => string[];
  parseClass?: (name: string) => ParsedClass;
  getRuleConfig: (ruleId: string) => RuleConfiguration | undefined;
  getClassType: (
    className: string,
    isCombo?: boolean
  ) => "utility" | "combo" | "custom" | "unknown";
}

export interface Rule {
  id: string;
  name: string;
  category: "structure" | "naming" | "performance" | "a11y" | "quality";
  severity: "error" | "warning" | "info";
  enabled: boolean;
  analyzeElement: (args: ElementAnalysisArgs) => RuleResult[];
}
```

---

## 5) Element graph service

Create this once per page scan, reuse across rules.

```ts
// src/features/linter/services/element-graph.service.ts
import type { WebflowElement } from "@/features/linter/model/linter.types";

export type ElementGraph = {
  getParentId: (id: string) => string | null;
  getChildrenIds: (id: string) => string[];
  getAncestorIds: (id: string) => string[];
};

export function createElementGraphService(
  elements: WebflowElement[],
  parentPairs: Array<[string, string | null]>
): ElementGraph {
  const parentById = new Map<string, string | null>();
  const childrenById = new Map<string, string[]>();

  for (const el of elements) {
    const id = el.id.element;
    parentById.set(id, null);
    childrenById.set(id, []);
  }

  for (const [id, parentId] of parentPairs) {
    parentById.set(id, parentId);
    if (parentId) {
      const bucket = childrenById.get(parentId) ?? [];
      bucket.push(id);
      childrenById.set(parentId, bucket);
    }
  }

  const getParentId = (id: string) => parentById.get(id) ?? null;
  const getChildrenIds = (id: string) => childrenById.get(id) ?? [];
  const getAncestorIds = (id: string): string[] => {
    const out: string[] = [];
    let cur = getParentId(id);
    while (cur) {
      out.push(cur);
      cur = getParentId(cur);
    }
    return out;
  };

  return { getParentId, getChildrenIds, getAncestorIds };
}
```

> If you already produce a parent map in the page lint service, feed it here as `parentPairs` to avoid extra walking.

---

## 6) Rule runner update

Ensure the element runner passes `elementId`, graph helpers, and role helpers to `analyzeElement`.

```ts
// src/features/linter/services/rule-runner.ts
import type { Rule } from "@/features/linter/model/rule.types";
import type {
  RolesByElement,
  ElementRole,
} from "@/features/linter/model/linter.types";

export function createRuleRunner() {
  function runRulesOnStylesWithContext(
    perElement: Array<{
      elementId: string;
      classes: { className: string; isCombo: boolean; comboIndex?: number }[];
      contexts: string[];
    }>,
    allStyles: unknown[],
    deps: {
      rolesByElement?: RolesByElement;
      getRoleForElement?: (id: string) => ElementRole;
      getParentId?: (id: string) => string | null;
      getChildrenIds?: (id: string) => string[];
      getAncestorIds?: (id: string) => string[];
      getClassNamesForElement?: (id: string) => string[];
      parseClass?: (n: string) => any;
      getRuleConfig: (ruleId: string) => any;
      getClassType: (
        name: string,
        isCombo?: boolean
      ) => "utility" | "combo" | "custom" | "unknown";
    },
    enabledRules: Rule[]
  ) {
    const results = [];
    for (const item of perElement) {
      for (const rule of enabledRules) {
        results.push(
          ...rule.analyzeElement({
            elementId: item.elementId,
            classes: item.classes,
            contexts: item.contexts,
            allStyles,
            rolesByElement: deps.rolesByElement,
            getRoleForElement: deps.getRoleForElement,
            getParentId: deps.getParentId,
            getChildrenIds: deps.getChildrenIds,
            getAncestorIds: deps.getAncestorIds,
            getClassNamesForElement: deps.getClassNamesForElement,
            parseClass: deps.parseClass,
            getRuleConfig: deps.getRuleConfig,
            getClassType: deps.getClassType,
          })
        );
      }
    }
    return results;
  }
  return { runRulesOnStylesWithContext } as const;
}
```

---

## 7) Page rule runner

This is used for singleton and other page-scope assertions.

```ts
// src/features/linter/services/page-rule-runner.ts
import type { RolesByElement } from "@/features/linter/model/linter.types";
import type { RuleResult } from "@/features/linter/model/rule.types";

export type PageRule = {
  id: string;
  name: string;
  severity: "error" | "warning" | "info";
  run: (args: {
    rolesByElement: RolesByElement;
    getParentId: (id: string) => string | null;
    getChildrenIds: (id: string) => string[];
  }) => RuleResult[];
};

export function createPageRuleRunner() {
  const run = (rules: PageRule[], args: Parameters<PageRule["run"]>[0]) =>
    rules.flatMap((r) => r.run(args));
  return { run } as const;
}
```

---

## 8) Canonical structural rules

### 8.1 Main singleton (page-scope)

```ts
// src/features/linter/rules/canonical/main-singleton.page.ts
import type { PageRule } from "@/features/linter/services/page-rule-runner";

export const createMainSingletonPageRule = (): PageRule => ({
  id: "canonical:main-singleton",
  name: "Exactly one main role per page",
  severity: "error",
  run: ({ rolesByElement }) => {
    const mains = Object.entries(rolesByElement).filter(
      ([, role]) => role === "main"
    );
    if (mains.length === 1) return [];
    if (mains.length === 0) {
      return [
        {
          ruleId: "canonical:main-singleton",
          name: "Exactly one main role per page",
          message: "No main role detected on this page.",
          severity: "error",
          className: "",
          isCombo: false,
        },
      ];
    }
    const [, ...extras] = mains;
    return extras.map(([elementId]) => ({
      ruleId: "canonical:main-singleton",
      name: "Exactly one main role per page",
      message: "Multiple main roles detected. Keep exactly one.",
      severity: "error",
      elementId,
      className: "",
      isCombo: false,
    }));
  },
});
```

### 8.2 Main has content (page-scope)

```ts
// src/features/linter/rules/canonical/main-children.page.ts
import type { PageRule } from "@/features/linter/services/page-rule-runner";

export const createMainHasContentPageRule = (): PageRule => ({
  id: "canonical:main-has-content",
  name: "Main should contain sections or component roots",
  severity: "warning",
  run: ({ rolesByElement, getChildrenIds }) => {
    const mains = Object.entries(rolesByElement).filter(
      ([, r]) => r === "main"
    );
    if (mains.length !== 1) return [];
    const [mainId] = mains[0];

    const children = getChildrenIds(mainId);
    const ok = children.some((id) => {
      const r = rolesByElement[id];
      return r === "section" || r === "componentRoot";
    });

    return ok
      ? []
      : [
          {
            ruleId: "canonical:main-has-content",
            name: "Main should contain sections or component roots",
            message: "Add at least one section or component root inside main.",
            severity: "warning",
            elementId: mainId,
            className: "",
            isCombo: false,
          },
        ];
  },
});
```

### 8.3 Section parent is main (element-scope)

```ts
// src/features/linter/rules/canonical/section-parent-is-main.ts
import type { Rule } from "@/features/linter/model/rule.types";
import type { ElementRole } from "@/features/linter/model/linter.types";

export const createSectionParentIsMainRule = (): Rule => ({
  id: "canonical:section-parent-is-main",
  name: "Section must be a direct child of main",
  category: "structure",
  severity: "error",
  enabled: true,
  analyzeElement: ({ elementId, classes, getRoleForElement, getParentId }) => {
    const role: ElementRole = getRoleForElement?.(elementId) ?? "unknown";
    if (role !== "section") return [];
    const parentId = getParentId?.(elementId) ?? null;
    const parentRole: ElementRole = parentId
      ? getRoleForElement?.(parentId) ?? "unknown"
      : "unknown";
    if (parentRole === "main") return [];
    return [
      {
        ruleId: "canonical:section-parent-is-main",
        name: "Section must be a direct child of main",
        message: "This section is not a direct child of the main role.",
        severity: "error",
        className: classes[0]?.className ?? "",
        isCombo: classes[0]?.isCombo === true,
        elementId,
      },
    ];
  },
});
```

### 8.4 Component root structure (element-scope)

```ts
// src/features/linter/rules/canonical/component-root-structure.ts
import type { Rule } from "@/features/linter/model/rule.types";
import type { ElementRole } from "@/features/linter/model/linter.types";

export const createComponentRootStructureRule = (): Rule => ({
  id: "canonical:component-root-structure",
  name: "Component root must live under a section and contain structure",
  category: "structure",
  severity: "warning",
  enabled: true,
  analyzeElement: ({
    elementId,
    classes,
    getRoleForElement,
    getParentId,
    getChildrenIds,
  }) => {
    const role: ElementRole = getRoleForElement?.(elementId) ?? "unknown";
    if (role !== "componentRoot") return [];

    let p = getParentId?.(elementId) ?? null;
    let isUnderSection = false;
    while (p) {
      if ((getRoleForElement?.(p) ?? "unknown") === "section") {
        isUnderSection = true;
        break;
      }
      p = getParentId?.(p) ?? null;
    }

    const violations = [];

    if (!isUnderSection) {
      violations.push({
        ruleId: "canonical:component-root-structure",
        name: "Component root must live under a section and contain structure",
        message: "Component root is not within a section.",
        severity: "error",
        className: classes[0]?.className ?? "",
        isCombo: classes[0]?.isCombo === true,
        elementId,
      });
    }

    const kids = getChildrenIds?.(elementId) ?? [];
    const hasStructure = kids.some((id) => {
      const r = getRoleForElement?.(id) ?? "unknown";
      return r === "layout" || r === "content" || r === "childGroup";
    });

    if (!hasStructure) {
      violations.push({
        ruleId: "canonical:component-root-structure",
        name: "Component root must live under a section and contain structure",
        message:
          "Add a layout, content, or childGroup inside this component root.",
        severity: "warning",
        className: classes[0]?.className ?? "",
        isCombo: classes[0]?.isCombo === true,
        elementId,
      });
    }

    return violations;
  },
});
```

### 8.5 Child group key matches nearest component root (element-scope)

```ts
// src/features/linter/rules/canonical/child-group-key-match.ts
import type { Rule } from "@/features/linter/model/rule.types";
import type { ElementRole } from "@/features/linter/model/linter.types";
import type { GrammarAdapter } from "@/features/linter/model/linter.types";

export const createChildGroupKeyMatchRule = (deps: {
  parseClass: GrammarAdapter["parse"];
  getRootBaseClassNameFor: (rootId: string) => string | null; // inject from style service
}): Rule => ({
  id: "canonical:childgroup-key-match",
  name: "Child group key must match nearest component root",
  category: "structure",
  severity: "error",
  enabled: true,
  analyzeElement: ({
    elementId,
    classes,
    getRoleForElement,
    getAncestorIds,
  }) => {
    const role: ElementRole = getRoleForElement?.(elementId) ?? "unknown";
    if (role !== "childGroup") return [];

    const ancestors = getAncestorIds?.(elementId) ?? [];
    const rootId = ancestors.find(
      (id) => (getRoleForElement?.(id) ?? "unknown") === "componentRoot"
    );
    if (!rootId) {
      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match nearest component root",
          message: "Child group has no component root ancestor.",
          severity: "error",
          className: classes[0]?.className ?? "",
          isCombo: classes[0]?.isCombo === true,
          elementId,
        },
      ];
    }

    const childKey =
      deps.parseClass(classes[0]?.className ?? "").componentKey ?? null;
    const rootBaseName = deps.getRootBaseClassNameFor(rootId) ?? "";
    const rootKey = deps.parseClass(rootBaseName).componentKey ?? null;

    if (!childKey || !rootKey || childKey !== rootKey) {
      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match nearest component root",
          message:
            "Child group's component key does not match the nearest component root.",
          severity: "error",
          className: classes[0]?.className ?? "",
          isCombo: classes[0]?.isCombo === true,
          elementId,
        },
      ];
    }
    return [];
  },
});
```

---

## 9) Lumos preset wiring

Combine canonical structural rules with Lumos naming rules. Client-First will mirror this but with its own naming rules.

```ts
// src/presets/lumos.preset.ts
import { createMainSingletonPageRule } from "@/features/linter/rules/canonical/main-singleton.page";
import { createMainHasContentPageRule } from "@/features/linter/rules/canonical/main-children.page";
import { createSectionParentIsMainRule } from "@/features/linter/rules/canonical/section-parent-is-main";
import { createComponentRootStructureRule } from "@/features/linter/rules/canonical/component-root-structure";
import { createChildGroupKeyMatchRule } from "@/features/linter/rules/canonical/child-group-key-match";

import {
  createLumosClassFormatRule,
  createLumosRootHasWrapSuffixRule,
  createLumosChildGroupHasWrapSuffixRule,
  createLumosComboLimitRule,
} from "@/features/linter/rules/lumos"; // barrel export optional

export function createLumosPresetRules(deps: {
  graph: {
    getParentId: (id: string) => string | null;
    getChildrenIds: (id: string) => string[];
    getAncestorIds: (id: string) => string[];
  };
  parseClass: (name: string) => { componentKey?: string | null };
  getRootBaseClassNameFor: (rootId: string) => string | null;
}) {
  const pageRules = [
    createMainSingletonPageRule(),
    createMainHasContentPageRule(),
  ];

  const elementRules = [
    createSectionParentIsMainRule(),
    createComponentRootStructureRule(),
    createChildGroupKeyMatchRule({
      parseClass: deps.parseClass,
      getRootBaseClassNameFor: deps.getRootBaseClassNameFor,
    }),
    createLumosClassFormatRule(),
    createLumosRootHasWrapSuffixRule(),
    createLumosChildGroupHasWrapSuffixRule(),
    createLumosComboLimitRule(2),
  ];

  return { pageRules, elementRules };
}
```

---

## 10) Integration points

### Page lint service

- After building `rolesByElement` and the parent map, create `elementGraph`.
- Build `perElement` entries for the element runner.
- Run page rules then element rules.
- Merge results.

```ts
// inside page-lint-service.ts
const rolesByElement = await roleDetector.detectRolesForPage(pairs);
const parentPairs =
  /* build pairs [childId, parentId] from your existing map */ [];
const graph = createElementGraphService(validElements, parentPairs);

const { pageRules, elementRules } = createLumosPresetRules({
  graph,
  parseClass: activePreset.grammar.parse,
  getRootBaseClassNameFor: (rootId) =>
    styleService.getBaseClassNameForElement(rootId),
});

// page-scope rules
const pageRunner = createPageRuleRunner();
const pageResults = pageRunner.run(pageRules, {
  rolesByElement,
  getParentId: graph.getParentId,
  getChildrenIds: graph.getChildrenIds,
});

// element-scope rules
const perElementPayload = stylesWithElementByElementId.map((x) => ({
  elementId: x.elementId,
  classes: x.classes,
  contexts: elementContextsMap[x.elementId] ?? [],
}));

const elementResults = ruleRunner.runRulesOnStylesWithContext(
  perElementPayload,
  allStyles,
  {
    rolesByElement,
    getRoleForElement: (id) => rolesByElement[id] ?? "unknown",
    getParentId: graph.getParentId,
    getChildrenIds: graph.getChildrenIds,
    getAncestorIds: graph.getAncestorIds,
    getClassNamesForElement: (id) => styleService.getAppliedClassNamesSync(id), // or async adapter
    parseClass: activePreset.grammar.parse,
    getRuleConfig: ruleRegistry.getRuleConfiguration,
    getClassType: classTypeService.getClassType,
  },
  elementRules
);

return [...pageResults, ...elementResults];
```

---

## 11) Minimal tests

### Detector tests

```ts
import { describe, it, expect } from "vitest";
import { createRoleDetectionService } from "@/features/linter/services/role-detection.service";

describe("role detection", () => {
  it("detects single main and a section", async () => {
    const svc = createRoleDetectionService();
    const roles = await svc.detectRolesForPage([
      { element: { id: { element: "A" } } as any, classNames: ["page_main"] },
      { element: { id: { element: "B" } } as any, classNames: ["u-section"] },
    ]);
    expect(roles["A"]).toBe("main");
    expect(roles["B"]).toBe("section");
  });

  it("enforces main singleton", async () => {
    const svc = createRoleDetectionService();
    const roles = await svc.detectRolesForPage([
      { element: { id: { element: "A" } } as any, classNames: ["page_main"] },
      {
        element: { id: { element: "B" } } as any,
        classNames: ["main-wrapper"],
      },
    ]);
    expect(Object.values(roles).filter((r) => r === "main").length).toBe(1);
  });
});
```

### Section parent rule

```ts
import { describe, it, expect } from "vitest";
import { createSectionParentIsMainRule } from "@/features/linter/rules/canonical/section-parent-is-main";

const rule = createSectionParentIsMainRule();

describe("section parent is main", () => {
  it("passes when parent is main", () => {
    const res = rule.analyzeElement({
      elementId: "S",
      classes: [{ className: "u-section", isCombo: false }],
      contexts: [],
      allStyles: [],
      getRoleForElement: (id) => ({ M: "main", S: "section" }[id] as any),
      getParentId: () => "M",
      getRuleConfig: () => undefined,
      getClassType: () => "custom",
    });
    expect(res).toHaveLength(0);
  });
});
```

### Page rules

```ts
import { describe, it, expect } from "vitest";
import { createPageRuleRunner } from "@/features/linter/services/page-rule-runner";
import { createMainSingletonPageRule } from "@/features/linter/rules/canonical/main-singleton.page";

describe("main singleton page rule", () => {
  it("fails when no main", () => {
    const runner = createPageRuleRunner();
    const res = runner.run([createMainSingletonPageRule()], {
      rolesByElement: { A: "section" } as any,
      getParentId: () => null,
      getChildrenIds: () => [],
    });
    expect(res[0].severity).toBe("error");
  });
});
```

---

## 12) Performance notes

- Role detection and graph creation are O(n).
- Page rules in this set are O(n).
- Element rules guard on role early which keeps work low per element.
- Cache `rolesByElement` and the graph by stable page signature. You already implemented the signature.

---

## 13) Acceptance checklist

- [ ] `ElementRole` includes canonical roles and is used by rules.
- [ ] `ElementAnalysisArgs.elementId` is present and used.
- [ ] Element graph functions are available to rules.
- [ ] Page rule runner executes singleton and presence checks.
- [ ] Five canonical structural rules are registered in Lumos and Client-First presets.
- [ ] Lumos naming rules remain preset-specific and free of structural checks.
- [ ] Detector and rule tests pass with precision targets.
- [ ] Scans meet the stated performance budgets.

---

## 14) Handoff notes

- The code above assumes you can provide `getRootBaseClassNameFor(rootId)` from your style service. If not present, add a helper that returns the first non-combo class name for that element.
- Keep factories and types consistent across presets.
- When Client-First naming rules are ready, wire them exactly as Lumos naming rules. Canonical rules are shared.
