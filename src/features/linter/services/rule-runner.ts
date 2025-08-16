// Update to rule-runner.ts - Replace the runRulesOnStyles method and add the new method

import type {
  RuleResult,
  Severity,
  Rule,
  ClassType,
} from "@/features/linter/model/rule.types";
import type { ElementContext } from "@/entities/element/model/element-context.types";
import {
  StyleInfo,
  StyleWithElement,
} from "@/entities/style/model/style.service";
import {
  UtilityClassAnalyzer,
  UtilityClassDuplicateInfo,
} from "./utility-class-analyzer";
import { RuleRegistry } from "./rule-registry";

// Centralized helper to keep combo-like detection consistent across runner logic
const COMBO_LIKE_RE = /^(?:is-[A-Za-z0-9]|is_[A-Za-z0-9]|is[A-Z]).*/;
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

  const isRuleApplicableForContext = (
    rule: Rule,
    elementContexts: ElementContext[]
  ): boolean => {
    // If rule doesn't specify a context, it applies to all contexts
    if (!rule.context) return true;

    // If rule specifies a context, element must have that context
    return elementContexts.includes(rule.context);
  };

  const executeNamingRule = (
    rule: Rule & { type: "naming" },
    className: string,
    severity: Severity,
    elementContexts: ElementContext[]
  ): RuleResult[] => {
    // If the rule has an evaluate function, use it
    if (typeof rule.evaluate === "function") {
      const configObj = ruleRegistry.getRuleConfiguration(
        rule.id
      )?.customSettings;
      const result = rule.evaluate(className, { config: configObj });
      if (result) {
        return [
          {
            ...result,
            severity: result.severity ?? severity,
            context:
              elementContexts.length > 0 ? elementContexts[0] : undefined, // Include primary context
          },
        ];
      }
    }

    // Fallback to test logic
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
          context: elementContexts.length > 0 ? elementContexts[0] : undefined,
        },
      ];
    }

    // Debug log removed to reduce noise
    return [];
  };

  const handleUtilityDuplicateRules = (
    rule: Rule,
    className: string,
    properties: any,
    severity: Severity,
    elementContexts: ElementContext[]
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
        context: elementContexts[0],
        // Include structured data in metadata for better UI rendering
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    ];
  };

  const executePropertyRule = (
    rule: Rule & { type: "property" },
    className: string,
    properties: any,
    severity: Severity,
    elementContexts: ElementContext[],
    allStyles: StyleInfo[]
  ): RuleResult[] => {
    // Handle duplicate rules for any class (utilities, combos, customs)
    if (rule.id.includes("duplicate")) {
      return handleUtilityDuplicateRules(
        rule,
        className,
        properties,
        severity,
        elementContexts
      );
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
      context: elementContexts.length > 0 ? elementContexts[0] : undefined,
    }));
  };

  const executeRule = (
    rule: Rule,
    className: string,
    properties: any,
    elementContexts: ElementContext[],
    allStyles: StyleInfo[]
  ): RuleResult[] => {
    try {
      const config = ruleRegistry.getRuleConfiguration(rule.id);
      const effectiveSeverity = config?.severity ?? rule.severity;

      if (rule.type === "naming") {
        return executeNamingRule(
          rule,
          className,
          effectiveSeverity,
          elementContexts
        );
      } else if (rule.type === "property") {
        return executePropertyRule(
          rule,
          className,
          properties,
          effectiveSeverity,
          elementContexts,
          allStyles
        );
      }

      return [];
    } catch (err) {
      console.error(
        `Error executing rule ${rule.id} on class ${className}:`,
        err
      );
      return [];
    }
  };

  // New method that properly handles context
  const runRulesOnStylesWithContext = (
    stylesWithElement: StyleWithElement[],
    elementContextsMap: Record<string, ElementContext[]>,
    allStyles: StyleInfo[]
  ): RuleResult[] => {
    const results: RuleResult[] = [];

    // Group by element for element-level analysis
    const byElement = new Map<string, StyleWithElement[]>();
    for (const s of stylesWithElement) {
      const list = byElement.get(s.elementId) ?? [];
      list.push(s);
      byElement.set(s.elementId, list);
    }

    // 1) Element-level phase: call analyzeElement on any rule that provides it
    const allRules = ruleRegistry.getAllRules();
    for (const [elId, list] of byElement.entries()) {
      const contexts = elementContextsMap[elId] || [];
      for (const rule of allRules) {
        if (typeof rule.analyzeElement === "function") {
          const cfg = ruleRegistry.getRuleConfiguration(rule.id);
          const isEnabled = cfg?.enabled ?? rule.enabled;
          if (!isEnabled) continue;
          const elementResults = rule.analyzeElement({
            classes: list.map((i: any) => ({
              name: i.name,
              order: i.order,
              elementId: i.elementId,
              isCombo: i.isCombo,
              detectionSource: i.detectionSource,
            })),
            contexts,
            allStyles,
            getClassType,
            getRuleConfig: (id: string) =>
              ruleRegistry.getRuleConfiguration(id),
          });
          elementResults.forEach((r) => {
            r.context = r.context ?? contexts[0];
            r.metadata = { ...(r.metadata ?? {}), elementId: elId };
          });
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
    } of stylesWithElement as any) {
      const elementContexts = elementContextsMap[elementId] || [];
      const classType = getClassType(name, isCombo);
      const applicableRules = ruleRegistry
        .getRulesByClassType(classType)
        .filter((rule) => {
          const config = ruleRegistry.getRuleConfiguration(rule.id);
          const isEnabled = config?.enabled ?? rule.enabled;
          const isApplicableForContext = isRuleApplicableForContext(
            rule,
            elementContexts
          );
          return isEnabled && isApplicableForContext;
        });

      for (const rule of applicableRules) {
        const ruleResults = executeRule(
          rule,
          name,
          properties,
          elementContexts,
          allStyles
        );
        ruleResults.forEach((r) => {
          const merged = { ...(r.metadata ?? {}), elementId } as any;
          if (detectionSource && !merged.detectionSource)
            merged.detectionSource = detectionSource;
          r.metadata = merged;
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
