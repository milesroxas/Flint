// Update to rule-runner.ts - Replace the runRulesOnStyles method and add the new method

import type { RuleResult, Severity, Rule, ClassType } from "@/features/linter/model/rule.types";
import type { ElementContext } from "@/entities/element/model/element-context.types";
import { StyleInfo, StyleWithElement } from "@/entities/style/model/style.service";
import { UtilityClassAnalyzer, UtilityClassDuplicateInfo } from "./utility-class-analyzer";
import { RuleRegistry } from "./rule-registry";

export const createRuleRunner = (
  ruleRegistry: RuleRegistry,
  utilityAnalyzer: UtilityClassAnalyzer
) => {
  const getClassType = (className: string): ClassType => {
    if (className.startsWith("is-")) return "combo";
    if (className.startsWith("u-")) return "utility";
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
      console.log(`  Failed ${rule.category} rule: ${className}`);
      return [{
        ruleId: rule.id,
        name: rule.name,
        message: rule.description,
        severity,
        className,
        isCombo: className.startsWith("is-"),
        example: rule.example,
        context: elementContexts.length > 0 ? elementContexts[0] : undefined
      }];
    }
    
    console.log(`  Passed ${rule.category} rule: ${className}`);
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
      console.log(`  Passed utility class rules: ${className}`);
      return [];
    }

    // Check if this specific rule should fire based on duplicate type
    const isExactDuplicateRule = rule.id === "lumos-utility-class-exact-duplicate";
    const isDuplicatePropertiesRule = rule.id === "lumos-utility-class-duplicate-properties";

    if ((isExactDuplicateRule && !duplicateInfo.isExactMatch) ||
        (isDuplicatePropertiesRule && duplicateInfo.isExactMatch)) {
      return [];
    }

    // Use the formatted property for exact matches if available
    let message: string;
    
    if (duplicateInfo.isExactMatch && duplicateInfo.formattedProperty) {
      const { property, value, classes } = duplicateInfo.formattedProperty;
      message = `This utility class is an exact duplicate of another single-property class: ${property}:${value} (also in: ${classes.join(', ')}). Consolidate these classes.`;
    } else {
      const dupPropMessages = Array.from(duplicateInfo.duplicateProperties.entries())
        .map(([prop, classes]) => `${prop} (also in: ${classes.join(', ')})`)
      
      message = duplicateInfo.isExactMatch
        ? `This utility class is an exact duplicate of another single-property class: ${dupPropMessages.join('; ')}. Consolidate these classes.`
        : `This utility class has duplicate properties: ${dupPropMessages.join('; ')}. Consider consolidating.`
    }

    console.log(`  ${duplicateInfo.isExactMatch ? 'Failed' : 'Suggestion for'} utility class: ${className}`);
    
    return [{
      ruleId: rule.id,
      name: rule.name,
      message,
      severity,
      className,
      isCombo: false,
      context: elementContexts[0],
      // Include formatted property data in metadata for better UI rendering
      metadata: duplicateInfo.formattedProperty ? { 
        formattedProperty: duplicateInfo.formattedProperty 
      } : undefined
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

    // Element-level ordering check: warn if any utility precedes the first custom class
    const byElement = new Map<string, StyleWithElement[]>();
    for (const s of stylesWithElement) {
      const list = byElement.get(s.elementId) ?? [];
      list.push(s);
      byElement.set(s.elementId, list);
    }
    for (const [elId, list] of byElement.entries()) {
      // Find earliest custom class order
      let earliestCustomOrder: number | null = null;
      for (const s of list) {
        const kind = getClassType(s.name);
        if (kind === "custom") {
          earliestCustomOrder = earliestCustomOrder === null ? s.order : Math.min(earliestCustomOrder, s.order);
        }
      }
      if (earliestCustomOrder !== null) {
        // Any utility with order smaller than earliest custom?
        const offending = list
          .filter(s => getClassType(s.name) === "utility" && s.order < (earliestCustomOrder as number))
          .sort((a, b) => a.order - b.order)[0];
        if (offending) {
          const ctxs = elementContextsMap[elId] || [];
          results.push({
            ruleId: "lumos-utilities-after-custom-ordering",
            name: "Utilities should follow base custom class",
            message: "Warn when utilities precede the base custom class.",
            severity: "warning",
            className: offending.name,
            isCombo: false,
            example: "base_custom is-* u-*",
            context: ctxs.length > 0 ? ctxs[0] : undefined,
          });
        }
      }
    }

    console.log('Running lint rules on applied styles with context…');
    
    for (const { id, name, properties, elementId } of stylesWithElement) {
      console.log(`Processing style - ID: ${id}, Name: ${name}, Element: ${elementId}`);

      // Get the contexts for this element
      const elementContexts = elementContextsMap[elementId] || [];
      
      const classType = getClassType(name);
      const applicableRules = ruleRegistry.getRulesByClassType(classType)
        .filter(rule => {
          const config = ruleRegistry.getRuleConfiguration(rule.id);
          const isEnabled = config?.enabled ?? rule.enabled;
          const isApplicableForContext = isRuleApplicableForContext(rule, elementContexts);
          
          return isEnabled && isApplicableForContext;
        });

      console.log(`Found ${applicableRules.length} applicable rules for ${name} with contexts: [${elementContexts.join(', ')}]`);

      for (const rule of applicableRules) {
        const ruleResults = executeRule(rule, name, properties, elementContexts, allStyles);
        results.push(...ruleResults);
      }
    }

    return results;
  };

  // Keep the old method for backward compatibility but mark as deprecated
  const runRulesOnStyles = (
    styles: StyleInfo[],
    contextsMap: Record<string, ElementContext[]>
  ): RuleResult[] => {
    console.warn('[RuleRunner] runRulesOnStyles is deprecated. Use runRulesOnStylesWithContext instead.');
    
    // Convert to new format - this is a fallback
    const stylesWithElement: StyleWithElement[] = styles.map(style => ({
      ...style,
      elementId: '' // No element ID available in old format
    }));
    
    return runRulesOnStylesWithContext(stylesWithElement, contextsMap, []);
  };

  return {
    runRulesOnStyles, // Keep for backward compatibility
    runRulesOnStylesWithContext // New preferred method
  } as const;
};

export type RuleRunner = ReturnType<typeof createRuleRunner>;