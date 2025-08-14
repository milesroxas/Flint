// Update to rule-runner.ts - Replace the runRulesOnStyles method and add the new method

import type { RuleResult, Severity, Rule, ClassType } from "@/features/linter/model/rule.types";
import type { ElementContext } from "@/entities/element/model/element-context.types";
import { StyleInfo, StyleWithElement } from "@/entities/style/model/style.service";
import { UtilityClassAnalyzer, UtilityClassDuplicateInfo } from "./utility-class-analyzer";
import { RuleRegistry } from "./rule-registry";

// Centralized helper to keep combo-like detection consistent across runner logic
const COMBO_LIKE_RE = /^(?:is-[A-Za-z0-9]|is_[A-Za-z0-9]|is[A-Z]).*/;
const isComboLike = (name: string): boolean => COMBO_LIKE_RE.test(name);

export const createRuleRunner = (
  ruleRegistry: RuleRegistry,
  utilityAnalyzer: UtilityClassAnalyzer,
  classKindResolver?: (className: string, isComboFlag?: boolean) => ClassType
) => {
  const getClassType = (className: string, isComboFlag?: boolean): ClassType => {
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
      const configObj = ruleRegistry.getRuleConfiguration(rule.id)?.customSettings;
      const result = rule.evaluate(className, { config: configObj });
      if (result) {
        return [{ 
          ...result, 
          severity: result.severity ?? severity,
          context: elementContexts.length > 0 ? elementContexts[0] : undefined // Include primary context
        }];
      }
    }
    
    // Fallback to test logic
    if (!rule.test(className)) {
      // Debug log removed to reduce noise
      return [{
        ruleId: rule.id,
        name: rule.name,
        message: rule.description,
        severity,
        className,
        isCombo: isComboLike(className),
        example: rule.example,
        context: elementContexts.length > 0 ? elementContexts[0] : undefined
      }];
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
    const duplicateInfo: UtilityClassDuplicateInfo | null = utilityAnalyzer.analyzeDuplicates(className, properties);
    if (!duplicateInfo) {
      // Debug log removed to reduce noise
      return [];
    }

    // Check if this specific rule should fire based on duplicate type
    const isExactDuplicateRule = rule.id === "lumos-utility-class-exact-duplicate";
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
        message = `This utility class is an exact duplicate of another single-property class: ${property}:${value} (also in: ${classes.join(', ')}). Consolidate these classes.`;
        metadata.formattedProperty = duplicateInfo.formattedProperty;
      } else if (duplicateInfo.exactMatches && duplicateInfo.exactMatches.length > 0) {
        message = `This utility class has an identical set of properties as: ${duplicateInfo.exactMatches.join(', ')}. Consolidate these classes.`;
        metadata.exactMatches = duplicateInfo.exactMatches;
      } else {
        // Fallback to listing duplicate properties if for some reason we lack exactMatches list
        const dupPropMessages = Array.from(duplicateInfo.duplicateProperties.entries())
          .map(([prop, classes]) => `${prop} (also in: ${classes.join(', ')})`);
        message = `This utility class is an exact duplicate. ${dupPropMessages.join('; ')}`;
      }
    } else {
      const dupPropMessages = Array.from(duplicateInfo.duplicateProperties.entries())
        .map(([prop, classes]) => `${prop} (also in: ${classes.join(', ')})`);
      message = `This utility class has duplicate properties: ${dupPropMessages.join('; ')}. Consider consolidating.`;
    }

    // Debug log removed to reduce noise
    
    return [{
      ruleId: rule.id,
      name: rule.name,
      message,
      severity,
      className,
      isCombo: false,
      context: elementContexts[0],
      // Include structured data in metadata for better UI rendering
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    }];
  };

  const executePropertyRule = (
    rule: Rule & { type: "property" }, 
    className: string, 
    properties: any, 
    severity: Severity,
    elementContexts: ElementContext[],
    allStyles: StyleInfo[]
  ): RuleResult[] => {
    // Handle special utility class duplicate rules
    if (rule.id.includes("duplicate") && className.startsWith("u-")) {
      return handleUtilityDuplicateRules(rule, className, properties, severity, elementContexts);
    }

    // For custom property rules, use the rule's analyze function
    const context = {
      allStyles,
      utilityClassPropertiesMap: utilityAnalyzer.getUtilityClassPropertiesMap(),
      propertyToClassesMap: utilityAnalyzer.getPropertyToClassesMap()
    };
    
    const violations = rule.analyze(className, properties, context);
    return violations.map(violation => ({
      ruleId: violation.ruleId,
      name: violation.name,
      message: violation.message,
      severity,
      className: violation.className,
      isCombo: violation.isCombo,
      example: rule.example,
      context: elementContexts.length > 0 ? elementContexts[0] : undefined
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
        return executeNamingRule(rule, className, effectiveSeverity, elementContexts);
      } else if (rule.type === "property") {
        return executePropertyRule(rule, className, properties, effectiveSeverity, elementContexts, allStyles);
      }
      
      return [];
    } catch (err) {
      console.error(`Error executing rule ${rule.id} on class ${className}:`, err);
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

    // Element-level ordering checks (configurable via registry)
    const byElement = new Map<string, StyleWithElement[]>();
    const baseCustomOrderByElement = new Map<string, number | null>();
    for (const s of stylesWithElement) {
      const list = byElement.get(s.elementId) ?? [];
      list.push(s);
      byElement.set(s.elementId, list);
    }
    for (const [elId, list] of byElement.entries()) {
      // Find earliest custom class order
      let earliestCustomOrder: number | null = null;
    for (const s of list) {
      const kind = getClassType(s.name, (s as any).isCombo);
        if (kind === "custom") {
          earliestCustomOrder = earliestCustomOrder === null ? s.order : Math.min(earliestCustomOrder, s.order);
        }
      }
      baseCustomOrderByElement.set(elId, earliestCustomOrder);
      const contexts = elementContextsMap[elId] || [];
      if (earliestCustomOrder !== null) {
        // utilities before custom?
        const offendingUtil = list
          .filter(s => getClassType(s.name, (s as any).isCombo) === "utility" && s.order < (earliestCustomOrder as number))
          .sort((a, b) => a.order - b.order)[0];
        const utilCfg = ruleRegistry.getRuleConfiguration("lumos-utilities-after-custom-ordering");
        if (offendingUtil && (utilCfg?.enabled ?? true)) {
          results.push({
            ruleId: "lumos-utilities-after-custom-ordering",
            name: "Utilities should follow base custom class",
            message: "Warn when utilities precede the base custom class.",
            severity: utilCfg?.severity ?? "warning",
            className: offendingUtil.name,
            isCombo: false,
            example: "base_custom is-* u-*",
            context: contexts[0],
            metadata: { elementId: elId },
          });
        }

        // combos before custom?
        const offendingCombo = list
          .filter(s => getClassType(s.name, (s as any).isCombo) === "combo" && s.order < (earliestCustomOrder as number))
          .sort((a, b) => a.order - b.order)[0];
        const comboOrderCfg = ruleRegistry.getRuleConfiguration("lumos-combos-after-custom-ordering");
        if (offendingCombo && (comboOrderCfg?.enabled ?? true)) {
          results.push({
            ruleId: "lumos-combos-after-custom-ordering",
            name: "Combos should follow base custom class",
            message: "Warn when combo classes precede the base custom class.",
            severity: comboOrderCfg?.severity ?? "warning",
            className: offendingCombo.name,
            isCombo: true,
            example: "base_custom is-*",
            context: contexts[0],
            metadata: { elementId: elId, detectionSource: (offendingCombo as any).detectionSource },
          });
        }
      }

      // combo limit
      const combos = list
        .filter(s => getClassType(s.name, (s as any).isCombo) === "combo")
        .sort((a, b) => a.order - b.order)
        .map(s => s.name);
      const comboLimitCfg = ruleRegistry.getRuleConfiguration("lumos-combo-class-limit");
      const maxCombos = Number(comboLimitCfg?.customSettings?.["maxCombos"] ?? 2);
      if ((comboLimitCfg?.enabled ?? true) && combos.length > maxCombos) {
        // Determine the base custom class this element uses (earliest custom by order)
        const baseCustomName = [...list]
          .filter(s => getClassType(s.name, (s as any).isCombo) === "custom")
          .sort((a, b) => a.order - b.order)[0]?.name;
        results.push({
          ruleId: "lumos-combo-class-limit",
          name: "Too many combo classes",
          message: `This element has ${combos.length} combo classes; limit is ${maxCombos}. Consider merging or simplifying.`,
          severity: comboLimitCfg?.severity ?? "warning",
          className: combos[0] || "",
          isCombo: true,
          example: "base_custom is-large is-active",
          context: contexts[0],
          metadata: { elementId: elId, combos, maxCombos, baseCustomClass: baseCustomName },
        });
      }

      // Variant requires base custom or component
      const variantRequiresBaseCfg = ruleRegistry.getRuleConfiguration("lumos-variant-requires-base");
      if (variantRequiresBaseCfg?.enabled ?? true) {
        const ordered = [...list].sort((a, b) => a.order - b.order);
        let baseSeenBeforeVariant = false; // base = any non-utility (custom or c-)
        let violatingVariantName: string | null = null;
        for (const s of ordered) {
          const n = s.name;
          if (isComboLike(n)) {
            if (!baseSeenBeforeVariant) {
              violatingVariantName = n;
            }
            break; // only need to evaluate the first variant
          }
          if (!n.startsWith("u-")) {
            baseSeenBeforeVariant = true;
          }
        }
        if (violatingVariantName) {
          results.push({
            ruleId: "lumos-variant-requires-base",
            name: "Variant should modify a base class",
            message: "Variant classes (is-*) should be used on top of a base custom/component class (not only utilities).",
            severity: variantRequiresBaseCfg?.severity ?? "warning",
            className: violatingVariantName,
            isCombo: true,
            example: "c-card is-active",
            context: contexts[0],
            metadata: { elementId: elId, combos },
          });
        }
      }
    }

    // Debug log removed to reduce noise
    
    for (const { name, properties, elementId, isCombo, order, detectionSource } of stylesWithElement as any) {
      // Debug log removed to reduce noise

      // Get the contexts for this element
      const elementContexts = elementContextsMap[elementId] || [];
      
      const classType = getClassType(name, isCombo);
      let applicableRules = ruleRegistry.getRulesByClassType(classType)
        .filter(rule => {
          const config = ruleRegistry.getRuleConfiguration(rule.id);
          const isEnabled = config?.enabled ?? rule.enabled;
          const isApplicableForContext = isRuleApplicableForContext(rule, elementContexts);
          
          return isEnabled && isApplicableForContext;
        });

      // For non-base custom classes on an element, skip custom naming rules (e.g., lumos-custom-class-format)
      if (classType === "custom") {
        const baseOrder = baseCustomOrderByElement.get(String(elementId));
        const isBaseCustom = typeof baseOrder === "number" ? order === baseOrder : true;
        if (!isBaseCustom) {
          // Scope this skip to Lumos rules only; client-first keeps its own behavior
          // Always allow the core custom class format rule to run on ALL custom classes
          applicableRules = applicableRules.filter(rule => !(
            rule.type === "naming" &&
            rule.targetClassTypes?.includes("custom") &&
            rule.id.startsWith("lumos-") &&
            rule.id !== "lumos-custom-class-format"
          ));
        }
      }

      // Debug log removed to reduce noise

      for (const rule of applicableRules) {
        const ruleResults = executeRule(rule, name, properties, elementContexts, allStyles);
        // attach elementId and detection source (for debug) when available; merge if existing
        ruleResults.forEach(r => {
          const merged = { ...(r.metadata ?? {}), elementId } as any;
          if (detectionSource && !merged.detectionSource) {
            merged.detectionSource = detectionSource;
          }
          r.metadata = merged;
        });
        results.push(...ruleResults);
      }
    }

    return results;
  };

  return {
    runRulesOnStylesWithContext
  } as const;
};

export type RuleRunner = ReturnType<typeof createRuleRunner>;