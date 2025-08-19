import type {
  RuleResult,
  Rule,
  ClassType,
  Severity,
} from "@/features/linter/model/rule.types";

import type {
  RolesByElement,
  ElementRole,
  ParsedClass,
} from "@/features/linter/model/linter.types";

import type {
  StyleInfo,
  StyleWithElement,
} from "@/entities/style/model/style.types";

import { UtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";

import { RuleRegistry } from "./rule-registry";

import {
  createNamingRuleExecutor,
  createPropertyRuleExecutor,
  type NamingExecutionDeps,
} from "@/features/linter/services/executors";

export const createRuleRunner = (
  ruleRegistry: RuleRegistry,
  utilityAnalyzer: UtilityClassAnalyzer,
  classTypeResolver?: (className: string, isComboFlag?: boolean) => ClassType
) => {
  // Authoritative classifier: resolves to your Rule ClassType
  const getClassType = (
    className: string,
    isComboFlag?: boolean
  ): ClassType => {
    if (typeof classTypeResolver === "function") {
      try {
        const resolved = classTypeResolver(className, isComboFlag);
        if (resolved !== "custom") return resolved;
        if (isComboFlag === true) return "combo";
        return "custom";
      } catch {
        console.error(`Error resolving class type for ${className}`);
      }
    }
    return isComboFlag === true ? "combo" : "custom";
  };

  const executeNamingRule = createNamingRuleExecutor();
  const executePropertyRule = createPropertyRuleExecutor(
    ruleRegistry,
    utilityAnalyzer
  );

  // Class-level dispatcher. Naming rules are delegated to the executor.
  const executeRule = (
    rule: Rule,
    className: string,
    properties: Record<string, unknown>,
    allStyles: StyleInfo[],
    elementIdForLog?: string
  ): RuleResult[] => {
    try {
      const config = ruleRegistry.getRuleConfiguration(rule.id);
      const effectiveSeverity = config?.severity ?? rule.severity;

      if (rule.type === "property") {
        return executePropertyRule(
          rule as Extract<Rule, { type: "property" }>,
          className,
          properties,
          effectiveSeverity,
          allStyles
        );
      }
      return [];
    } catch (err) {
      console.error(`Rule ${rule.id} failed`, {
        className,
        elementId: elementIdForLog,
        err,
      });
      return [];
    }
  };

  const runRulesOnStylesWithContext = (
    stylesWithElement: StyleWithElement[],
    _elementContextsMap: Record<string, never[]>,
    allStyles: StyleInfo[],
    rolesByElement?: RolesByElement,
    getParentId?: (elementId: string) => string | null,
    getChildrenIds?: (elementId: string) => string[],
    getAncestorIds?: (elementId: string) => string[],
    parseClass?: (name: string) => ParsedClass,
    graph?: { getTag?: (id: string) => Promise<string | null> },
    getTagName?: (id: string) => string | null,
    skipPageRules: boolean = false
  ): RuleResult[] => {
    const results: RuleResult[] = [];

    // Group by element for element-level analysis
    const byElement = new Map<string, StyleWithElement[]>();
    const byElementClassNames = new Map<string, string[]>();
    for (const s of stylesWithElement) {
      const list = byElement.get(s.elementId) ?? [];
      list.push(s);
      byElement.set(s.elementId, list);

      const names = byElementClassNames.get(s.elementId) ?? [];
      names.push(s.name);
      byElementClassNames.set(s.elementId, names);
    }

    if (rolesByElement) {
      for (const elId of Object.keys(rolesByElement)) {
        if (!byElement.has(elId)) {
          byElement.set(elId, [] as any);
          if (!byElementClassNames.has(elId)) byElementClassNames.set(elId, []);
        }
      }
    }

    // Precompute comboIndex per element
    const comboIndexByElementAndClass = new Map<string, Map<string, number>>();
    for (const [elId, list] of byElement.entries()) {
      const sorted = [...list].sort((a, b) => a.order - b.order);
      let idx = 0;
      for (const item of sorted) {
        if (item.isCombo) {
          const map =
            comboIndexByElementAndClass.get(elId) ?? new Map<string, number>();
          if (!comboIndexByElementAndClass.has(elId))
            comboIndexByElementAndClass.set(elId, map);
          map.set(item.name, idx);
          idx += 1;
        }
      }
    }

    if (ruleRegistry.getPageRules && !skipPageRules) {
      const pageRules = ruleRegistry.getPageRules().filter((r) => {
        const cfg = ruleRegistry.getRuleConfiguration(r.id);
        return (cfg?.enabled ?? true) === true;
      });

      for (const pr of pageRules) {
        const pageResults = pr.analyzePage({
          rolesByElement: rolesByElement ?? {},
          graph: {
            getParentId: getParentId ?? (() => null),
            getChildrenIds: getChildrenIds ?? (() => []),
            getAncestorIds: getAncestorIds ?? (() => []),
            getDescendantIds: () => [], // Simple fallback - no descendants available in this context
            getTag: graph?.getTag ?? (async () => await Promise.resolve(null)), // Use provided getTag or fallback
          },
          styles: stylesWithElement,
          getRoleForElement: (id: string) => rolesByElement?.[id] || "unknown",
          getRuleConfig: (ruleId: string) => ({
            ruleId,
            enabled: true,
            severity: "error",
            customSettings: {} as any,
          }),
          getTagName: getTagName ?? (() => null),
        });
        // normalize severity from config
        const cfg = ruleRegistry.getRuleConfiguration(pr.id);
        for (const r of pageResults) {
          r.severity = r.severity ?? cfg?.severity ?? pr.severity;
        }
        results.push(...pageResults);
      }
    }

    // 1) Element-level phase
    const allRules = ruleRegistry.getAllRules();
    for (const [elId, list] of byElement.entries()) {
      for (const rule of allRules) {
        if (typeof rule.analyzeElement === "function") {
          const cfg = ruleRegistry.getRuleConfiguration(rule.id);
          const isEnabled = cfg?.enabled ?? rule.enabled;
          if (!isEnabled) continue;

          const elementResults = rule.analyzeElement({
            elementId: elId,
            classes: list.map((i) => ({
              className: i.name,
              order: i.order,
              elementId: i.elementId,
              isCombo: i.isCombo,
              comboIndex: i.isCombo
                ? comboIndexByElementAndClass.get(elId)?.get(i.name) ??
                  undefined
                : undefined,
              detectionSource: i.detectionSource,
            })),
            allStyles,
            getClassType,
            getRuleConfig: (id: string) =>
              ruleRegistry.getRuleConfiguration(id),
            rolesByElement,
            getRoleForElement: (id: string): ElementRole =>
              rolesByElement?.[id] ?? "unknown",
            getParentId,
            getChildrenIds,
            getAncestorIds,
            getClassNamesForElement: (id: string) =>
              byElementClassNames.get(id) ?? [],
            parseClass,
          });

          for (const r of elementResults) {
            r.elementId = elId;
            r.severity = r.severity ?? cfg?.severity ?? rule.severity;
            const role = rolesByElement ? rolesByElement[elId] : undefined;
            const parentId =
              typeof getParentId === "function" ? getParentId(elId) : undefined;
            r.metadata = { ...(r.metadata ?? {}), role, parentId };
          }
          results.push(...elementResults);
        }
      }
    }

    // 2) Class-level phase
    for (const {
      name,
      properties,
      elementId,
      isCombo,
      detectionSource,
    } of stylesWithElement) {
      const classType = getClassType(name, isCombo);
      const applicableRules = ruleRegistry
        .getRulesByClassType(classType)
        .filter((rule) => {
          const config = ruleRegistry.getRuleConfiguration(rule.id);
          return (config?.enabled ?? rule.enabled) === true;
        })
        .sort((a, b) => a.id.localeCompare(b.id));

      for (const rule of applicableRules) {
        const cfg = ruleRegistry.getRuleConfiguration(rule.id);
        const effectiveSeverity = cfg?.severity ?? rule.severity;

        if (rule.type === "naming") {
          // Injected deps for naming executor
          const deps: NamingExecutionDeps = {
            getRoleForElement: (id: string) =>
              rolesByElement?.[id] ?? "unknown",

            getClassType,

            suggestName: undefined,
            // severity resolver optional; executor uses severityDefault regardless
            resolveSeverity: (ruleId: string) =>
              ruleRegistry.getRuleConfiguration(ruleId)?.severity as
                | Severity
                | undefined,
          };

          const comboIndex =
            isCombo && elementId
              ? comboIndexByElementAndClass.get(elementId)?.get(name)
              : undefined;

          const namingResults = executeNamingRule(
            rule as Extract<Rule, { type: "naming" }>,
            {
              elementId,
              className: name,
              isCombo,
              comboIndex,
              severityDefault: effectiveSeverity,
              // align with your RuleConfiguration.customSettings
              configForRule: cfg?.customSettings,
            },
            deps
          );

          namingResults.forEach((r) => {
            r.elementId = elementId;
            const role = rolesByElement ? rolesByElement[elementId] : undefined;
            const parentId =
              typeof getParentId === "function"
                ? getParentId(elementId)
                : undefined;
            const merged = { ...(r.metadata ?? {}), role, parentId } as Record<
              string,
              unknown
            >;
            if (detectionSource && !merged["detectionSource"])
              merged["detectionSource"] = detectionSource;
            r.metadata = merged;

            if (isCombo && r.isCombo && r.comboIndex == null) {
              r.comboIndex = comboIndex;
            }
          });

          results.push(...namingResults);
          continue;
        }

        // Property and other rule types
        const ruleResults = executeRule(
          rule,
          name,
          properties as Record<string, unknown>,
          allStyles,
          elementId
        );

        ruleResults.forEach((r) => {
          r.elementId = elementId;
          const role = rolesByElement ? rolesByElement[elementId] : undefined;
          const parentId =
            typeof getParentId === "function"
              ? getParentId(elementId)
              : undefined;
          const merged = { ...(r.metadata ?? {}), role, parentId } as Record<
            string,
            unknown
          >;
          if (detectionSource && !merged["detectionSource"])
            merged["detectionSource"] = detectionSource;
          r.metadata = merged;

          if (isCombo && r.isCombo && r.comboIndex == null) {
            r.comboIndex = comboIndexByElementAndClass
              .get(elementId)
              ?.get(name);
          }
        });

        results.push(...ruleResults);
      }
    }

    return results;
  };

  return {
    runRulesOnStylesWithContext,
  } as const;
};

export type RuleRunner = ReturnType<typeof createRuleRunner>;
