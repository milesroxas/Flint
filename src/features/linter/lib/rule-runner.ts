import { RuleResult, Severity, Rule, ClassType } from "@/features/linter/types/rule-types"
import { StyleInfo } from "./style-service"
import { UtilityClassAnalyzer, UtilityClassDuplicateInfo } from "./utility-class-analyzer"
import { RuleRegistry } from "./rule-registry"

export class RuleRunner {
  constructor(
    private ruleRegistry: RuleRegistry,
    private utilityAnalyzer: UtilityClassAnalyzer
  ) {}

  runRulesOnStyles(styles: StyleInfo[]): RuleResult[] {
    const results: RuleResult[] = []
    
    console.log('Running lint rules on applied styles...')
    for (const { id, name, properties } of styles) {
      console.log(`Processing style - ID: ${id}, Name: ${name}`)

      const classType = this.getClassType(name)
      const applicableRules = this.ruleRegistry.getRulesByClassType(classType)
        .filter(rule => {
          const config = this.ruleRegistry.getRuleConfiguration(rule.id)
          return config?.enabled ?? rule.enabled
        })

      for (const rule of applicableRules) {
        const ruleResults = this.executeRule(rule, name, properties)
        results.push(...ruleResults)
      }
    }
    
    return results
  }

  private executeRule(rule: Rule, className: string, properties: any): RuleResult[] {
    try {
      const config = this.ruleRegistry.getRuleConfiguration(rule.id)
      const effectiveSeverity = config?.severity ?? rule.severity

      if (rule.type === "naming") {
        return this.executeNamingRule(rule, className, effectiveSeverity)
      } else if (rule.type === "property") {
        return this.executePropertyRule(rule, className, properties, effectiveSeverity)
      }
      
      return []
    } catch (err) {
      console.error(`Error executing rule ${rule.id} on class ${className}:`, err)
      return []
    }
  }

  private executeNamingRule(rule: Rule & { type: "naming" }, className: string, severity: Severity): RuleResult[] {
    // If the rule has an evaluate function, use it
    if (typeof rule.evaluate === "function") {
      // Get the actual config values for this rule
      const configObj = this.ruleRegistry.getRuleConfiguration(rule.id)?.customSettings;
      const result = rule.evaluate(className, { config: configObj });
      if (result) {
        // Use the severity from the result, unless config severity is explicitly set and different
        return [{ ...result, severity: result.severity ?? severity }];
      }
    }
    // Fallback to test logic
    if (!rule.test(className)) {
      console.log(`  Failed ${rule.category} rule: ${className}`)
      return [{
        ruleId: rule.id,
        name: rule.name,
        message: rule.description,
        severity,
        className,
        isCombo: className.startsWith("is-"),
        example: rule.example
      }]
    }
    
    console.log(`  Passed ${rule.category} rule: ${className}`)
    return []
  }

  private executePropertyRule(rule: Rule & { type: "property" }, className: string, properties: any, severity: Severity): RuleResult[] {
    // Handle special utility class duplicate rules
    if (rule.id.includes("duplicate") && className.startsWith("u-")) {
      return this.handleUtilityDuplicateRules(rule, className, properties, severity)
    }

    // For custom property rules, use the rule's analyze function
    const context = {
      allStyles: [], // This would need to be passed from the engine
      utilityClassPropertiesMap: this.utilityAnalyzer.getUtilityClassPropertiesMap(),
      propertyToClassesMap: this.utilityAnalyzer.getPropertyToClassesMap()
    }
    
    const violations = rule.analyze(className, properties, context)
    return violations.map(violation => ({
      ruleId: violation.ruleId,
      name: violation.name,
      message: violation.message,
      severity,
      className: violation.className,
      isCombo: violation.isCombo,
      example: rule.example
    }))
  }

  private handleUtilityDuplicateRules(rule: Rule, className: string, properties: any, severity: Severity): RuleResult[] {
    const duplicateInfo: UtilityClassDuplicateInfo | null = this.utilityAnalyzer.analyzeDuplicates(className, properties)
    if (!duplicateInfo) {
      console.log(`  Passed utility class rules: ${className}`)
      return []
    }

    // Check if this specific rule should fire based on duplicate type
    const isExactDuplicateRule = rule.id === "lumos-utility-class-exact-duplicate"
    const isDuplicatePropertiesRule = rule.id === "lumos-utility-class-duplicate-properties"

    if ((isExactDuplicateRule && !duplicateInfo.isExactMatch) ||
        (isDuplicatePropertiesRule && duplicateInfo.isExactMatch)) {
      return []
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

    console.log(`  ${duplicateInfo.isExactMatch ? 'Failed' : 'Suggestion for'} utility class: ${className}`)
    
    return [{
      ruleId: rule.id,
      name: rule.name,
      message,
      severity,
      className,
      isCombo: false,
      // Include formatted property data in metadata for better UI rendering
      metadata: duplicateInfo.formattedProperty ? { 
        formattedProperty: duplicateInfo.formattedProperty 
      } : undefined
    }]
  }

  private getClassType(className: string): ClassType {
    if (className.startsWith("is-")) return "combo"
    if (className.startsWith("u-")) return "utility"
    return "custom"
  }
}