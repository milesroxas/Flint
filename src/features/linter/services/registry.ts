// features/linter/lib/registry.ts
import { createRuleRegistry } from "@/features/linter/services/rule-registry";
import { lumosPreset } from "@/presets/lumos.preset";
import { RuleConfigurationService } from "@/features/linter/services/rule-configuration-service";
import type { Rule } from "@/features/linter/model/rule.types";

// Global registry instance
export const ruleRegistry = createRuleRegistry();

// Pass the registry into the config service
export const ruleConfigService = new RuleConfigurationService(ruleRegistry);

// Initialize with default rules and user configurations
export function initializeRuleRegistry(): void {
  console.log("Initializing rule registry…");

  // 1) register preset rules (seeds defaults too)
  ruleRegistry.registerRules(lumosPreset.rules);

  // 3) load any persisted user settings and apply
  const userConfigs = ruleConfigService.loadConfiguration();
  userConfigs.forEach((cfg) =>
    ruleRegistry.updateRuleConfiguration(cfg.ruleId, {
      enabled: cfg.enabled,
      severity: cfg.severity,
      customSettings: cfg.customSettings,
    })
  );

  console.log(`Registry initialized with preset '${lumosPreset.id}' containing ${lumosPreset.rules.length} rules`);
}

// Helper for dynamic rules
export function addCustomRule(rule: Rule): void {
  ruleRegistry.registerRule(rule);
  console.log(`Added custom rule: ${rule.id}`);
}
