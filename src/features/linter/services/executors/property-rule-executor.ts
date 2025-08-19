// src/features/linter/services/executors/property-rule-executor.ts
import type {
  Rule,
  RuleResult,
  Severity,
} from "@/features/linter/model/rule.types";
import type { StyleInfo } from "@/entities/style/model/style.types";
import type { RuleRegistry } from "@/features/linter/services/rule-registry";
import type { UtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";

/** Public signature returned by the factory. */
export type ExecutePropertyRule = (
  rule: Extract<Rule, { type: "property" }>,
  className: string,
  properties: Record<string, unknown>,
  severity: Severity,
  allStyles: StyleInfo[]
) => RuleResult[];

/**
 * Factory: property-rule executor (PRD-aligned)
 * - No preset- or rule-id branching
 * - Builds canonical context maps and delegates all logic to the rule
 */
export const createPropertyRuleExecutor = (
  ruleRegistry: RuleRegistry,
  utilityAnalyzer: UtilityClassAnalyzer
): ExecutePropertyRule => {
  return function executePropertyRule(
    rule,
    className,
    properties,
    severity,
    allStyles
  ): RuleResult[] {
    // Build/ensure property maps once for this run
    if (typeof (utilityAnalyzer as any).ensureBuilt === "function") {
      (utilityAnalyzer as any).ensureBuilt(allStyles);
    } else {
      utilityAnalyzer.buildPropertyMaps(allStyles);
    }

    const context = {
      allStyles,
      utilityClassPropertiesMap: utilityAnalyzer.getUtilityClassPropertiesMap(),
      propertyToClassesMap: utilityAnalyzer.getPropertyToClassesMap(),
      // Rule-specific options (from configuration service)
      config: ruleRegistry.getRuleConfiguration(rule.id)?.customSettings,
    };

    const violations = rule.analyze(className, properties, context);

    return violations.map((v) => ({
      ruleId: v.ruleId,
      name: v.name,
      message: v.message,
      severity,
      className: v.className,
      isCombo: v.isCombo,
      example: rule.example,
      metadata: v.metadata,
      fix: v.fix,
    }));
  };
};
