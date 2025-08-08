// features/linter/lib/registry.ts
import { createRuleRegistry } from "@/features/linter/services/rule-registry";
import { lumosPreset } from "@/presets/lumos.preset";
import { clientFirstPreset } from "@/presets/client-first.preset";
import { applyOpinionMode, OpinionMode } from "@/features/linter/model/opinion.modes";
import { RuleConfigurationService } from "@/features/linter/services/rule-configuration-service";
import type { Rule } from "@/features/linter/model/rule.types";

// Global registry instance
export const ruleRegistry = createRuleRegistry();

// Pass the registry into the config service
export const ruleConfigService = new RuleConfigurationService(ruleRegistry);

// Initialize with default rules and user configurations
export function initializeRuleRegistry(mode: OpinionMode = "balanced", preset: "lumos" | "client-first" = "lumos"): void {
  console.log("Initializing rule registry…");

  // 1) register preset rules (seeds defaults too)
  ruleRegistry.clear();
  const selected = preset === "client-first" ? clientFirstPreset : lumosPreset;
  ruleRegistry.registerRules(selected.rules);

  // 3) apply opinion mode adjustments
  applyOpinionMode(ruleRegistry, mode);

  // 4) load any persisted user settings and apply
  const userConfigs = ruleConfigService.loadConfiguration();
  userConfigs.forEach((cfg) =>
    ruleRegistry.updateRuleConfiguration(cfg.ruleId, {
      enabled: cfg.enabled,
      severity: cfg.severity,
      customSettings: cfg.customSettings,
    })
  );

  console.log(`Registry initialized with preset '${selected.id}' containing ${selected.rules.length} rules`);
}

// Helper for dynamic rules
export function addCustomRule(rule: Rule): void {
  ruleRegistry.registerRule(rule);
  console.log(`Added custom rule: ${rule.id}`);
}
