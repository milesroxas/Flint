import {
  Rule,
  RuleConfiguration
} from "@/features/linter/types/rule-types";
import type { ClassType } from "@/features/linter/types/rule-types";

export const createRuleRegistry = () => {
  const rules = new Map<string, Rule>();
  const configurations = new Map<string, RuleConfiguration>();

  /**
   * Register a single rule and seed its default configuration,
   * including any schema-defined customSettings.
   */
  const registerRule = (rule: Rule): void => {
    rules.set(rule.id, rule);

    if (!configurations.has(rule.id)) {
      const defaults: Record<string, unknown> = {};
      if (rule.config) {
        for (const key of Object.keys(rule.config)) {
          defaults[key] = rule.config[key].default;
        }
      }

      configurations.set(rule.id, {
        ruleId: rule.id,
        enabled: rule.enabled,
        severity: rule.severity,
        customSettings: defaults
      });
    }
  };

  /** Register multiple rules */
  const registerRules = (rulesToRegister: Rule[]): void => {
    rulesToRegister.forEach(rule => registerRule(rule));
  };

  /** Retrieve a rule by ID */
  const getRule = (ruleId: string): Rule | undefined => {
    return rules.get(ruleId);
  };

  /** Get all registered rules */
  const getAllRules = (): Rule[] => {
    return Array.from(rules.values());
  };

  /** Filter rules by class type */
  const getRulesByClassType = (classType: ClassType): Rule[] => {
    return getAllRules().filter(r => r.targetClassTypes.includes(classType));
  };

  /** Filter rules by category */
  const getRulesByCategory = (category: string): Rule[] => {
    return getAllRules().filter(r => r.category === category);
  };

  /** Only rules currently enabled */
  const getEnabledRules = (): Rule[] => {
    return getAllRules().filter(rule => {
      const cfg = configurations.get(rule.id);
      return cfg?.enabled ?? rule.enabled;
    });
  };

  /** Update a rule's configuration, merging nested customSettings */
  const updateRuleConfiguration = (
    ruleId: string,
    update: Partial<Omit<RuleConfiguration, 'ruleId'>>
  ): void => {
    const existing = configurations.get(ruleId);
    if (!existing) return;

    const mergedSettings = {
      ...existing.customSettings,
      ...update.customSettings
    };

    configurations.set(ruleId, {
      ...existing,
      ...update,
      customSettings: mergedSettings
    });
  };

  /** Get the stored configuration for a rule */
  const getRuleConfiguration = (ruleId: string): RuleConfiguration | undefined => {
    return configurations.get(ruleId);
  };

  /** Get all rule configurations */
  const getAllConfigurations = (): RuleConfiguration[] => {
    return Array.from(configurations.values());
  };

  /** Export configurations to JSON */
  const exportConfiguration = (): string => {
    return JSON.stringify(getAllConfigurations(), null, 2);
  };

  /** Import configurations from JSON and merge into existing */
  const importConfiguration = (json: string): void => {
    try {
      const configs: RuleConfiguration[] = JSON.parse(json);
      configs.forEach(cfg => {
        const existing = configurations.get(cfg.ruleId);
        if (!existing) return;
        configurations.set(cfg.ruleId, {
          ...existing,
          ...cfg,
          customSettings: {
            ...existing.customSettings,
            ...cfg.customSettings
          }
        });
      });
    } catch (err) {
      console.error('Failed to import rule configuration:', err);
    }
  };

  return {
    registerRule,
    registerRules,
    getRule,
    getAllRules,
    getRulesByClassType,
    getRulesByCategory,
    getEnabledRules,
    updateRuleConfiguration,
    getRuleConfiguration,
    getAllConfigurations,
    exportConfiguration,
    importConfiguration
  } as const;
};

export type RuleRegistry = ReturnType<typeof createRuleRegistry>;