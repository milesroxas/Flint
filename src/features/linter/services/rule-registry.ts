import {
  Rule,
  RuleConfiguration
} from "@/features/linter/types/rule-types";
import type { ClassType } from "@/features/linter/types/rule-types";

export class RuleRegistry {
  private rules = new Map<string, Rule>();
  private configurations = new Map<string, RuleConfiguration>();

  /**
   * Register a single rule and seed its default configuration,
   * including any schema-defined customSettings.
   */
  registerRule(rule: Rule): void {
    this.rules.set(rule.id, rule);

    if (!this.configurations.has(rule.id)) {
      const defaults: Record<string, unknown> = {};
      if (rule.config) {
        for (const key of Object.keys(rule.config)) {
          defaults[key] = rule.config[key].default;
        }
      }

      this.configurations.set(rule.id, {
        ruleId: rule.id,
        enabled: rule.enabled,
        severity: rule.severity,
        customSettings: defaults
      });
    }
  }

  /** Register multiple rules */
  registerRules(rules: Rule[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }

  /** Retrieve a rule by ID */
  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  /** Get all registered rules */
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  /** Filter rules by class type */
  getRulesByClassType(classType: ClassType): Rule[] {
    return this.getAllRules().filter(r => r.targetClassTypes.includes(classType));
  }

  /** Filter rules by category */
  getRulesByCategory(category: string): Rule[] {
    return this.getAllRules().filter(r => r.category === category);
  }

  /** Only rules currently enabled */
  getEnabledRules(): Rule[] {
    return this.getAllRules().filter(rule => {
      const cfg = this.configurations.get(rule.id);
      return cfg?.enabled ?? rule.enabled;
    });
  }

  /** Update a rule's configuration, merging nested customSettings */
  updateRuleConfiguration(
    ruleId: string,
    update: Partial<Omit<RuleConfiguration, 'ruleId'>>
  ): void {
    const existing = this.configurations.get(ruleId);
    if (!existing) return;

    const mergedSettings = {
      ...existing.customSettings,
      ...update.customSettings
    };

    this.configurations.set(ruleId, {
      ...existing,
      ...update,
      customSettings: mergedSettings
    });
  }

  /** Get the stored configuration for a rule */
  getRuleConfiguration(ruleId: string): RuleConfiguration | undefined {
    return this.configurations.get(ruleId);
  }

  /** Get all rule configurations */
  getAllConfigurations(): RuleConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /** Export configurations to JSON */
  exportConfiguration(): string {
    return JSON.stringify(this.getAllConfigurations(), null, 2);
  }

  /** Import configurations from JSON and merge into existing */
  importConfiguration(json: string): void {
    try {
      const configs: RuleConfiguration[] = JSON.parse(json);
      configs.forEach(cfg => {
        const existing = this.configurations.get(cfg.ruleId);
        if (!existing) return;
        this.configurations.set(cfg.ruleId, {
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
  }
}
