import { RuleRegistry } from "@/features/linter/lib/rule-registry"
import { defaultRules } from "../rules/default-rules"
import { RuleConfigurationService } from "@/features/linter/lib/rule-configuration-service"
import { Rule } from "../types"

// Global registry instance
export const ruleRegistry = new RuleRegistry()
export const ruleConfigService = new RuleConfigurationService()

// Initialize with default rules and user configurations
export function initializeRuleRegistry(): void {
  console.log('Initializing rule registry...')
  
  // Register default rules
  ruleRegistry.registerRules(defaultRules)
  
  // Load user configurations
  const userConfigs = ruleConfigService.loadConfiguration()
  userConfigs.forEach(config => {
    ruleRegistry.updateRuleConfiguration(config.ruleId, config)
  })
  
  console.log(`Registry initialized with ${defaultRules.length} rules`)
}

// Helper function to add custom rules at runtime
export function addCustomRule(rule: Rule): void {
  ruleRegistry.registerRule(rule)
  console.log(`Added custom rule: ${rule.id}`)
}