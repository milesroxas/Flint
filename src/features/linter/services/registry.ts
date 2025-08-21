// features/linter/lib/registry.ts
import { createRuleRegistry } from "@/features/linter/services/rule-registry";
import { resolvePresetOrFallback } from "@/features/linter/presets";
import {
  applyOpinionMode,
  OpinionMode,
} from "@/features/linter/model/opinion.modes";
import { createRuleConfigurationService } from "@/features/linter/services/rule-configuration-service";
import type { Rule } from "@/features/linter/model/rule.types";
import { createChildGroupKeyMatchRule } from "@/features/linter/rules/canonical/child-group-key-match";
import { createMainSingletonPageRule } from "@/features/linter/rules/canonical/main-singleton.page";
import { createMainChildrenPageRule } from "@/features/linter/rules/canonical/main-children.page";

// Global registry instance
export const ruleRegistry = createRuleRegistry();

// Pass the registry into the config service
export const ruleConfigService = createRuleConfigurationService(ruleRegistry);

// Initialize with default rules and user configurations
export function initializeRuleRegistry(
  mode: OpinionMode = "balanced",
  presetId?: string
): void {
  console.log("Initializing rule registry…");

  // 1) register preset rules (seeds defaults too)
  ruleRegistry.clear();
  const selected = resolvePresetOrFallback(presetId);
  ruleRegistry.registerRules([...selected.rules]);

  // 2) register canonical page rules globally (preset-agnostic)
  ruleRegistry.registerPageRules([
    createMainSingletonPageRule(),
    createMainChildrenPageRule(),
  ]);
  const childGroupRule = createChildGroupKeyMatchRule();
  console.log(`[DEBUG] Registering child group rule:`, {
    id: childGroupRule.id,
    enabled: childGroupRule.enabled,
    severity: childGroupRule.severity,
    hasAnalyzeElement: typeof childGroupRule.analyzeElement === "function"
  });
  ruleRegistry.registerRules([childGroupRule]);

  // 3) apply opinion mode adjustments
  applyOpinionMode(ruleRegistry, mode);

  // 4) load any persisted user settings and apply
  const userConfigs = ruleConfigService.load();
  userConfigs.forEach((cfg) =>
    ruleRegistry.updateRuleConfiguration(cfg.ruleId, {
      enabled: cfg.enabled,
      severity: cfg.severity,
      customSettings: cfg.customSettings,
    })
  );

  console.log(
    `Registry initialized with preset '${selected.id}' containing ${
      ruleRegistry.getAllRules().length
    } rules`
  );
}

// Helper for dynamic rules
export function addCustomRule(rule: Rule): void {
  ruleRegistry.registerRule(rule);
  console.log(`Added custom rule: ${rule.id}`);
}
