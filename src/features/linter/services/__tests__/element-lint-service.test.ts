import { describe, expect, it, vi } from "vitest";
import { clientFirstClassType, createMockElementGraph, createStyleWithElement } from "@/__tests__/helpers/factories";
import type { StyleWithElement } from "@/entities/style/model/style.types";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";
import { buildPlacedComponentSubtreeElementIds } from "@/features/linter/lib/is-element-under-placed-component-instance";
import type { RuleResult } from "@/features/linter/model/rule.types";
import { resolvePresetOrFallback } from "@/features/linter/presets";
import { createCFPaddingGlobalChildContainerRule } from "@/features/linter/rules/client-first/structure/padding-global-child-container";
import { createUtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";
import { createElementLintService } from "@/features/linter/services/element-lint-service";
import type { LintContext } from "@/features/linter/services/lint-context.service";
import { createRuleRegistry } from "@/features/linter/services/rule-registry";
import { createRuleRunner } from "@/features/linter/services/rule-runner";

function buildChildrenMap(parentMap: Record<string, string | null>): Record<string, string[]> {
  const children: Record<string, string[]> = {};
  for (const [child, parent] of Object.entries(parentMap)) {
    if (parent) {
      children[parent] = children[parent] ?? [];
      children[parent].push(child);
    }
  }
  return children;
}

function createLintContextFixture(options: {
  selectedElementId: string;
  /** When set, simulates structural scope: multiple elements with styles */
  structuralStyles?: StyleWithElement[];
  parentMap: Record<string, string | null>;
  componentIdByElementId: Map<string, string>;
}): LintContext {
  const { parentMap, componentIdByElementId, structuralStyles, selectedElementId } = options;
  const childrenMap = buildChildrenMap(parentMap);
  const graph = createMockElementGraph(parentMap, childrenMap);

  const elementStyleMap = new Map<string, StyleWithElement[]>();
  if (structuralStyles?.length) {
    for (const s of structuralStyles) {
      const list = elementStyleMap.get(s.elementId) ?? [];
      list.push(s);
      elementStyleMap.set(s.elementId, list);
    }
  } else {
    elementStyleMap.set(selectedElementId, [
      createStyleWithElement({ name: "container-large", elementId: selectedElementId }),
    ]);
  }

  const allStyles = Array.from(elementStyleMap.values())
    .flat()
    .map((s) => ({
      id: s.id,
      name: s.name,
      properties: s.properties ?? {},
      order: s.order,
      isCombo: s.isCombo ?? false,
    }));

  const tagByElementId = new Map<string, string | null>();
  const elementTypeByElementId = new Map<string, string | null>();
  for (const id of Object.keys(parentMap)) {
    if (id === "el-comp") {
      elementTypeByElementId.set(id, "ComponentInstance");
    } else {
      elementTypeByElementId.set(id, "Block");
    }
    tagByElementId.set(id, "div");
  }

  const activePreset = resolvePresetOrFallback("client-first");
  const placedComponentSubtreeElementIds = buildPlacedComponentSubtreeElementIds(graph, componentIdByElementId);

  return {
    allStyles,
    rolesByElement: {},
    graph,
    elementStyleMap,
    elementsWithClassNames: [],
    signature: "test-sig",
    activePreset,
    parseClass: (name: string) => clientFirstGrammar.parse(name),
    grammarElementSeparator: clientFirstGrammar.elementSeparator,
    variableNameById: new Map(),
    tagByElementId,
    elementTypeByElementId,
    componentIdByElementId,
    placedComponentSubtreeElementIds,
  };
}

function createMockElement(selectedId: string): { getStyles: () => Promise<unknown[]>; id: { element: string } } {
  return {
    id: { element: selectedId },
    getStyles: vi.fn().mockResolvedValue([]),
  };
}

describe("createElementLintService / lintElement", () => {
  it("passes context.componentIdByElementId to the rule runner when pageContext is undefined (scan-selected path)", async () => {
    const componentMap = new Map([["el-comp", "def-nav"]]);
    const ctx = createLintContextFixture({
      selectedElementId: "el-drift",
      parentMap: { "el-drift": "el-pg", "el-pg": "el-comp", "el-comp": null },
      componentIdByElementId: componentMap,
    });

    const runRulesOnStylesWithContext = vi.fn().mockReturnValue([] as RuleResult[]);
    const contextService = {
      createContext: vi.fn(),
      createElementContext: vi.fn(),
      createElementContextWithStructural: vi.fn().mockResolvedValue(ctx),
      clearCache: vi.fn(),
    };

    const svc = createElementLintService({
      contextService,
      ruleRunner: { runRulesOnStylesWithContext } as never,
    });

    await svc.lintElement(createMockElement("el-drift") as never, undefined, false);

    expect(runRulesOnStylesWithContext).toHaveBeenCalledTimes(1);
    const args = runRulesOnStylesWithContext.mock.calls[0];
    expect(args[15]).toBe(componentMap);
    expect(args[16]).toBe(ctx.placedComponentSubtreeElementIds);
    expect(args[17]).toBe(false);
  });

  it("passes the same component map when structural context is ON (no pageContext)", async () => {
    const componentMap = new Map([["el-comp", "def-nav"]]);
    const structuralStyles = [
      createStyleWithElement({
        name: "padding-global",
        elementId: "el-pg",
        properties: { "padding-left": "5%", "padding-right": "5%" },
      }),
      createStyleWithElement({
        name: "inner_custom",
        elementId: "el-drift",
        properties: { "max-width": "48rem" },
      }),
    ];
    const ctx = createLintContextFixture({
      selectedElementId: "el-drift",
      structuralStyles,
      parentMap: { "el-drift": "el-pg", "el-pg": "el-comp", "el-comp": null },
      componentIdByElementId: componentMap,
    });

    const runRulesOnStylesWithContext = vi.fn().mockReturnValue([] as RuleResult[]);
    const contextService = {
      createContext: vi.fn(),
      createElementContext: vi.fn(),
      createElementContextWithStructural: vi.fn().mockResolvedValue(ctx),
      clearCache: vi.fn(),
    };

    const svc = createElementLintService({
      contextService,
      ruleRunner: { runRulesOnStylesWithContext } as never,
    });

    await svc.lintElement(createMockElement("el-drift") as never, undefined, true);

    expect(runRulesOnStylesWithContext).toHaveBeenCalledTimes(1);
    const args = runRulesOnStylesWithContext.mock.calls[0];
    expect(args[15]).toBe(componentMap);
    expect(args[16]).toBe(ctx.placedComponentSubtreeElementIds);
    expect(args[17]).toBe(false);

    const stylesArg = args[0] as StyleWithElement[];
    expect(stylesArg.length).toBe(structuralStyles.length);
    const elementIds = new Set(stylesArg.map((s) => s.elementId));
    expect(elementIds.has("el-pg")).toBe(true);
    expect(elementIds.has("el-drift")).toBe(true);
  });

  it("with structural OFF, forwards only the selected element styles to the rule runner", async () => {
    const componentMap = new Map([["el-comp", "def-nav"]]);
    const structuralStyles = [
      createStyleWithElement({ name: "padding-global", elementId: "el-pg" }),
      createStyleWithElement({ name: "inner_custom", elementId: "el-drift" }),
    ];
    const ctx = createLintContextFixture({
      selectedElementId: "el-drift",
      structuralStyles,
      parentMap: { "el-drift": "el-pg", "el-pg": "el-comp", "el-comp": null },
      componentIdByElementId: componentMap,
    });

    const runRulesOnStylesWithContext = vi.fn().mockReturnValue([] as RuleResult[]);
    const contextService = {
      createContext: vi.fn(),
      createElementContext: vi.fn(),
      createElementContextWithStructural: vi.fn().mockResolvedValue(ctx),
      clearCache: vi.fn(),
    };

    const svc = createElementLintService({
      contextService,
      ruleRunner: { runRulesOnStylesWithContext } as never,
    });

    await svc.lintElement(createMockElement("el-drift") as never, undefined, false);

    const stylesArg = runRulesOnStylesWithContext.mock.calls[0][0] as StyleWithElement[];
    expect(stylesArg.every((s) => s.elementId === "el-drift")).toBe(true);
    expect(stylesArg.length).toBe(1);
  });

  it("with structural ON, returns violations for all scoped elements; OFF filters to the selected element only", async () => {
    const componentMap = new Map<string, string>();
    const ctx = createLintContextFixture({
      selectedElementId: "el-a",
      structuralStyles: [
        createStyleWithElement({ name: "u-a", elementId: "el-a" }),
        createStyleWithElement({ name: "u-b", elementId: "el-b" }),
      ],
      parentMap: { "el-a": null, "el-b": null },
      componentIdByElementId: componentMap,
    });

    const mixedResults: RuleResult[] = [
      {
        ruleId: "x",
        name: "x",
        message: "on a",
        severity: "warning",
        className: "u-a",
        elementId: "el-a",
        isCombo: false,
      },
      {
        ruleId: "y",
        name: "y",
        message: "on b",
        severity: "warning",
        className: "u-b",
        elementId: "el-b",
        isCombo: false,
      },
    ];

    const runRulesOnStylesWithContext = vi.fn().mockReturnValue(mixedResults);
    const contextService = {
      createContext: vi.fn(),
      createElementContext: vi.fn(),
      createElementContextWithStructural: vi.fn().mockResolvedValue(ctx),
      clearCache: vi.fn(),
    };

    const svc = createElementLintService({
      contextService,
      ruleRunner: { runRulesOnStylesWithContext } as never,
    });

    const structuralOn = await svc.lintElement(createMockElement("el-a") as never, undefined, true);
    expect(structuralOn.results).toHaveLength(2);

    const structuralOff = await svc.lintElement(createMockElement("el-a") as never, undefined, false);
    expect(structuralOff.results).toHaveLength(1);
    expect(structuralOff.results[0].elementId).toBe("el-a");
  });
});

/**
 * Mirrors element-lint + structural ON: full style list, graph, tags/types, and componentIdByElementId
 * passed to the rule runner (same argument order as lintElement with no pageContext).
 */
describe("lintElement structural path + padding-global-child rule (integration)", () => {
  it("reports suggestion severity for drift under a placed component when the runner receives componentIdByElementId", () => {
    const componentMap = new Map([["el-comp", "def-nav"]]);
    const structuralStyles = [
      createStyleWithElement({
        name: "padding-global",
        elementId: "el-pg",
        properties: { "padding-left": "5%", "padding-right": "5%" },
      }),
      createStyleWithElement({
        name: "inner_custom",
        elementId: "el-drift",
        properties: { "max-width": "48rem" },
      }),
    ];
    const ctx = createLintContextFixture({
      selectedElementId: "el-drift",
      structuralStyles,
      parentMap: { "el-drift": "el-pg", "el-pg": "el-comp", "el-comp": null },
      componentIdByElementId: componentMap,
    });

    const registry = createRuleRegistry();
    registry.registerRule(createCFPaddingGlobalChildContainerRule());
    const utilityAnalyzer = createUtilityClassAnalyzer({
      isUtilityName: (name) => clientFirstClassType(name) === "utility",
    });
    utilityAnalyzer.buildPropertyMaps(ctx.allStyles);
    const runner = createRuleRunner(registry, utilityAnalyzer, clientFirstClassType);

    const results = runner.runRulesOnStylesWithContext(
      structuralStyles,
      {},
      ctx.allStyles,
      ctx.rolesByElement,
      ctx.graph.getParentId,
      ctx.graph.getChildrenIds,
      ctx.graph.getAncestorIds,
      ctx.parseClass,
      { getTag: ctx.graph.getTag },
      (id) => ctx.tagByElementId.get(id) ?? null,
      (id) => ctx.elementTypeByElementId.get(id) ?? null,
      true,
      ctx.grammarElementSeparator,
      undefined,
      undefined,
      ctx.componentIdByElementId,
      ctx.placedComponentSubtreeElementIds,
      false,
      undefined
    );

    const drift = results.filter((r) => r.ruleId === "cf:structure:padding-global-child-container");
    expect(drift).toHaveLength(1);
    expect(drift[0].severity).toBe("suggestion");
    expect(drift[0].elementId).toBe("el-drift");
  });

  it("reports suggestion when only placedComponentSubtreeElementIds marks the element (structure mode / id alignment)", () => {
    const structuralStyles = [
      createStyleWithElement({
        name: "padding-global",
        elementId: "el-pg",
        properties: { "padding-left": "5%", "padding-right": "5%" },
      }),
      createStyleWithElement({
        name: "inner_custom",
        elementId: "el-drift",
        properties: { "max-width": "48rem" },
      }),
    ];
    const ctx = createLintContextFixture({
      selectedElementId: "el-drift",
      structuralStyles,
      parentMap: { "el-drift": "el-pg", "el-pg": "el-comp", "el-comp": null },
      componentIdByElementId: new Map(),
    });
    ctx.elementTypeByElementId.set("el-comp", "Block");

    const registry = createRuleRegistry();
    registry.registerRule(createCFPaddingGlobalChildContainerRule());
    const utilityAnalyzer = createUtilityClassAnalyzer({
      isUtilityName: (name) => clientFirstClassType(name) === "utility",
    });
    utilityAnalyzer.buildPropertyMaps(ctx.allStyles);
    const runner = createRuleRunner(registry, utilityAnalyzer, clientFirstClassType);

    const placedOnly = new Set(["el-comp", "el-pg", "el-drift"]);
    const results = runner.runRulesOnStylesWithContext(
      structuralStyles,
      {},
      ctx.allStyles,
      ctx.rolesByElement,
      ctx.graph.getParentId,
      ctx.graph.getChildrenIds,
      ctx.graph.getAncestorIds,
      ctx.parseClass,
      { getTag: ctx.graph.getTag },
      (id) => ctx.tagByElementId.get(id) ?? null,
      (id) => ctx.elementTypeByElementId.get(id) ?? null,
      true,
      ctx.grammarElementSeparator,
      undefined,
      undefined,
      new Map(),
      placedOnly,
      false,
      undefined
    );

    const drift = results.filter((r) => r.ruleId === "cf:structure:padding-global-child-container");
    expect(drift).toHaveLength(1);
    expect(drift[0].severity).toBe("suggestion");
  });

  it("requires componentIdByElementId when getElementType does not expose ComponentInstance (real Designer gap)", () => {
    const structuralStyles = [
      createStyleWithElement({
        name: "padding-global",
        elementId: "el-pg",
        properties: { "padding-left": "5%", "padding-right": "5%" },
      }),
      createStyleWithElement({
        name: "inner_custom",
        elementId: "el-drift",
        properties: { "max-width": "48rem" },
      }),
    ];
    const ctx = createLintContextFixture({
      selectedElementId: "el-drift",
      structuralStyles,
      parentMap: { "el-drift": "el-pg", "el-pg": "el-comp", "el-comp": null },
      componentIdByElementId: new Map([["el-comp", "def-nav"]]),
    });
    // Simulate missing/lost ComponentInstance on the root (map is then the only reliable signal).
    ctx.elementTypeByElementId.set("el-comp", "Block");

    const registry = createRuleRegistry();
    registry.registerRule(createCFPaddingGlobalChildContainerRule());
    const utilityAnalyzer = createUtilityClassAnalyzer({
      isUtilityName: (name) => clientFirstClassType(name) === "utility",
    });
    utilityAnalyzer.buildPropertyMaps(ctx.allStyles);
    const runner = createRuleRunner(registry, utilityAnalyzer, clientFirstClassType);

    const withoutMap = runner.runRulesOnStylesWithContext(
      structuralStyles,
      {},
      ctx.allStyles,
      ctx.rolesByElement,
      ctx.graph.getParentId,
      ctx.graph.getChildrenIds,
      ctx.graph.getAncestorIds,
      ctx.parseClass,
      { getTag: ctx.graph.getTag },
      (id) => ctx.tagByElementId.get(id) ?? null,
      (id) => ctx.elementTypeByElementId.get(id) ?? null,
      true,
      ctx.grammarElementSeparator,
      undefined,
      undefined,
      undefined,
      undefined,
      false,
      undefined
    );
    expect(withoutMap.filter((r) => r.ruleId === "cf:structure:padding-global-child-container")[0]?.severity).toBe(
      "warning"
    );

    const withMap = runner.runRulesOnStylesWithContext(
      structuralStyles,
      {},
      ctx.allStyles,
      ctx.rolesByElement,
      ctx.graph.getParentId,
      ctx.graph.getChildrenIds,
      ctx.graph.getAncestorIds,
      ctx.parseClass,
      { getTag: ctx.graph.getTag },
      (id) => ctx.tagByElementId.get(id) ?? null,
      (id) => ctx.elementTypeByElementId.get(id) ?? null,
      true,
      ctx.grammarElementSeparator,
      undefined,
      undefined,
      ctx.componentIdByElementId,
      ctx.placedComponentSubtreeElementIds,
      false,
      undefined
    );
    expect(withMap.filter((r) => r.ruleId === "cf:structure:padding-global-child-container")[0]?.severity).toBe(
      "suggestion"
    );
  });
});
