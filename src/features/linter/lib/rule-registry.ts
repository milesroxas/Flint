import { Rule, RuleConfiguration, ClassType } from "@/features/linter/types"

export class RuleRegistry {
  private rules = new Map<string, Rule>()
  private configurations = new Map<string, RuleConfiguration>()

  registerRule(rule: Rule): void {
    this.rules.set(rule.id, rule)
    
    // Set default configuration if not exists
    if (!this.configurations.has(rule.id)) {
      this.configurations.set(rule.id, {
        ruleId: rule.id,
        enabled: rule.enabled,
        severity: rule.severity
      })
    }
  }

  registerRules(rules: Rule[]): void {
    rules.forEach(rule => this.registerRule(rule))
  }

  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId)
  }

  getAllRules(): Rule[] {
    return Array.from(this.rules.values())
  }

  getRulesByClassType(classType: ClassType): Rule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.targetClassTypes.includes(classType))
  }

  getRulesByCategory(category: string): Rule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.category === category)
  }

  getEnabledRules(): Rule[] {
    return Array.from(this.rules.values())
      .filter(rule => {
        const config = this.configurations.get(rule.id)
        return config?.enabled ?? rule.enabled
      })
  }

  updateRuleConfiguration(ruleId: string, config: Partial<RuleConfiguration>): void {
    const existing = this.configurations.get(ruleId) || {
      ruleId,
      enabled: true,
      severity: "error" as const
    }
    
    this.configurations.set(ruleId, { ...existing, ...config })
  }

  getRuleConfiguration(ruleId: string): RuleConfiguration | undefined {
    return this.configurations.get(ruleId)
  }

  getAllConfigurations(): RuleConfiguration[] {
    return Array.from(this.configurations.values())
  }

  exportConfiguration(): string {
    return JSON.stringify(Array.from(this.configurations.values()), null, 2)
  }

  importConfiguration(configJson: string): void {
    try {
      const configs: RuleConfiguration[] = JSON.parse(configJson)
      configs.forEach(config => {
        this.configurations.set(config.ruleId, config)
      })
    } catch (err) {
      console.error('Failed to import rule configuration:', err)
    }
  }
}