// features/linter/lib/registry.ts
import { RuleRegistry } from "@/features/linter/lib/rule-registry";
import { defaultRules } from "@/features/linter/rules/default-rules";
import { RuleConfigurationService } from "@/features/linter/lib/rule-configuration-service";
import type { Rule } from "@/features/linter/types/rule-types";

// Global registry instance
export const ruleRegistry = new RuleRegistry();

// Pass the registry into the config service
export const ruleConfigService = new RuleConfigurationService(ruleRegistry);

// Initialize with default rules and user configurations
export function initializeRuleRegistry(): void {
  console.log("Initializing rule registry…");

  // 1) register built-in rules (seeds defaults too)
  ruleRegistry.registerRules(defaultRules);

  // 2) load any persisted user settings and apply
  const userConfigs = ruleConfigService.loadConfiguration();
  userConfigs.forEach((cfg) =>
    ruleRegistry.updateRuleConfiguration(cfg.ruleId, {
      enabled: cfg.enabled,
      severity: cfg.severity,
      customSettings: cfg.customSettings,
    })
  );

  console.log(`Registry initialized with ${defaultRules.length} rules`);
}

// Helper for dynamic rules
export function addCustomRule(rule: Rule): void {
  ruleRegistry.registerRule(rule);
  console.log(`Added custom rule: ${rule.id}`);
}
