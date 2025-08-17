// Update to rule-runner.ts - Replace the runRulesOnStyles method and add the new method

import type {
  RuleResult,
  Severity,
  Rule,
  ClassType,
} from "@/features/linter/model/rule.types";
// Legacy ElementContext removed; keep loose typing for compatibility with tests
import type {
  RolesByElement,
  ElementRole,
} from "@/features/linter/model/linter.types";
import {
  StyleInfo,
  StyleWithElement,
} from "@/features/linter/entities/style/model/style.service";
import {
  UtilityClassAnalyzer,
  UtilityClassDuplicateInfo,
} from "./utility-class-analyzer";
import { RuleRegistry } from "./rule-registry";

// Centralized helper to keep combo-like detection consistent across runner logic
// matches: is-foo, is_bar, isActive, isPrimary2
const COMBO_LIKE_RE = /^(?:is[-_][A-Za-z0-9_]+|is[A-Z][A-Za-z0-9_]*)$/;
const isComboLike = (name: string): boolean => COMBO_LIKE_RE.test(name);

export const createRuleRunner = (
  ruleRegistry: RuleRegistry,
  utilityAnalyzer: UtilityClassAnalyzer,
  classKindResolver?: (className: string, isComboFlag?: boolean) => ClassType
) => {
  const getClassType = (
    className: string,
    isComboFlag?: boolean
  ): ClassType => {
    // Treat variant-like names as combos even when misformatted (is-foo, is_bar, isActive)
    const looksLikeCombo = isComboFlag === true || isComboLike(className);

    if (typeof classKindResolver === "function") {
      try {
        // If resolver says combo or we heuristically detect combo, prefer combo
        const resolved = classKindResolver(className, isComboFlag);
        return looksLikeCombo ? "combo" : resolved;
      } catch (err) {
        // fall through to default heuristics
      }
    }
    if (className.startsWith("u-")) return "utility";
    if (looksLikeCombo) return "combo";
    return "custom";
  };

  // Legacy context gating removed

  const executeNamingRule = (
    rule: Extract<Rule, { type: "naming" }>,
    className: string,
    severity: Severity
  ): RuleResult[] => {
    // Primary: test/evaluate support on naming rules
    if ("evaluate" in rule && typeof rule.evaluate === "function") {
      const configObj = ruleRegistry.getRuleConfiguration(
        rule.id
      )?.customSettings;
      const result = rule.evaluate(className, { config: configObj });
      if (result) return [{ ...result, severity: result.severity ?? severity }];
    }

    if (!rule.test(className)) {
      // Debug log removed to reduce noise
      return [
        {
          ruleId: rule.id,
          name: rule.name,
          message: rule.description,
          severity,
          className,
          isCombo: isComboLike(className),
          example: rule.example,
        },
      ];
    }

    // Debug log removed to reduce noise
    return [];
  };

  const handleUtilityDuplicateRules = (
    rule: Rule,
    className: string,
    properties: Record<string, unknown>,
    severity: Severity
  ): RuleResult[] => {
    const duplicateInfo: UtilityClassDuplicateInfo | null =
      utilityAnalyzer.analyzeDuplicates(className, properties);
    if (!duplicateInfo) {
      // Debug log removed to reduce noise
      return [];
    }

    // Check if this specific rule should fire based on duplicate type
    const isExactDuplicateRule =
      rule.id === "lumos-utility-class-exact-duplicate";
    // Only fire when exact full-property duplicates are detected
    if (isExactDuplicateRule && !duplicateInfo.isExactMatch) {
      return [];
    }

    // Build message and metadata for UI rendering
    let message: string;
    const metadata: Record<string, any> = {};

    if (duplicateInfo.isExactMatch) {
      if (duplicateInfo.formattedProperty) {
        const { property, value, classes } = duplicateInfo.formattedProperty;
        message = `This class is an exact duplicate of another single-property class: ${property}:${value} (also in: ${classes.join(
          ", "
        )}). Consolidate these classes.`;
        metadata.formattedProperty = duplicateInfo.formattedProperty;
      } else if (
        duplicateInfo.exactMatches &&
        duplicateInfo.exactMatches.length > 0
      ) {
        message = `This class has an identical set of properties as: ${duplicateInfo.exactMatches.join(
          ", "
        )}. Consolidate these classes.`;
        metadata.exactMatches = duplicateInfo.exactMatches;
        // Include the full unique properties of this class for display
        try {
          const entries = Object.entries(properties || {});
          metadata.exactMatchProperties = entries.map(([prop, val]) => ({
            property: String(prop),
            value: typeof val === "string" ? val : JSON.stringify(val),
          }));
        } catch (err) {
          console.error(
            `Error getting exact match properties for class ${className}:`,
            err
          );
        }
      } else {
        // Fallback to listing duplicate properties if for some reason we lack exactMatches list
        const dupPropMessages = Array.from(
          duplicateInfo.duplicateProperties.entries()
        ).map(([prop, classes]) => `${prop} (also in: ${classes.join(", ")})`);
        message = `This class is an exact duplicate. ${dupPropMessages.join(
          "; "
        )}`;
      }
    } else {
      const dupPropMessages = Array.from(
        duplicateInfo.duplicateProperties.entries()
      ).map(([prop, classes]) => `${prop} (also in: ${classes.join(", ")})`);
      message = `This class has duplicate properties: ${dupPropMessages.join(
        "; "
      )}. Consider consolidating.`;
    }

    // Debug log removed to reduce noise

    return [
      {
        ruleId: rule.id,
        name: rule.name,
        message,
        severity,
        className,
        isCombo: isComboLike(className),
        // Include structured data in metadata for better UI rendering
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    ];
  };

  const executePropertyRule = (
    rule: Extract<Rule, { type: "property" }>,
    className: string,
    properties: Record<string, unknown>,
    severity: Severity,
    allStyles: StyleInfo[]
  ): RuleResult[] => {
    // Handle duplicate rules for any class (utilities, combos, customs)
    if (rule.id.includes("duplicate")) {
      return handleUtilityDuplicateRules(rule, className, properties, severity);
    }

    // For custom property rules, use the rule's analyze function
    const context = {
      allStyles,
      utilityClassPropertiesMap: utilityAnalyzer.getUtilityClassPropertiesMap(),
      propertyToClassesMap: utilityAnalyzer.getPropertyToClassesMap(),
    };

    const violations = rule.analyze(className, properties, context);
    return violations.map((violation) => ({
      ruleId: violation.ruleId,
      name: violation.name,
      message: violation.message,
      severity,
      className: violation.className,
      isCombo: violation.isCombo,
      example: rule.example,
    }));
  };

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

      if (rule.type === "naming") {
        return executeNamingRule(
          rule as Extract<Rule, { type: "naming" }>,
          className,
          effectiveSeverity
        );
      } else if (rule.type === "property") {
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

  // New method that properly handles context
  const runRulesOnStylesWithContext = (
    stylesWithElement: StyleWithElement[],
    _elementContextsMap: Record<string, never[]>,
    allStyles: StyleInfo[],
    rolesByElement?: RolesByElement,
    getParentId?: (elementId: string) => string | null,
    getChildrenIds?: (elementId: string) => string[],
    getAncestorIds?: (elementId: string) => string[],
    parseClass?: (
      name: string
    ) => import("@/features/linter/model/linter.types").ParsedClass
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

    // Precompute comboIndex per element for stable ordering and pass-through
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

    // 1) Element-level phase: call analyzeElement on any rule that provides it
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
            // Ensure severity override is respected
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

    // 2) Class-level phase: the existing per-class execution
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
          const isEnabled = config?.enabled ?? rule.enabled;
          return isEnabled;
        })
        .sort((a, b) => a.id.localeCompare(b.id));

      for (const rule of applicableRules) {
        const ruleResults = executeRule(
          rule,
          name,
          properties as Record<string, unknown>,
          allStyles,
          elementId
        );
        ruleResults.forEach((r) => {
          // Set top-level elementId for canonical consumption
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
          // Pass through comboIndex when applicable
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
