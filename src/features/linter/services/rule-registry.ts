import type {
  Rule,
  RuleConfiguration,
  RuleConfigSchema,
  ClassType,
  RuleCategory,
} from "@/features/linter/model/rule.types";
import type { PageRule, Severity } from "@/features/linter/model/rule.types";

export const createRuleRegistry = () => {
  const rules = new Map<string, Rule>();
  const pageRules = new Map<string, PageRule>();
  const configurations = new Map<string, RuleConfiguration>();

  // ---------- type guards ----------
  const hasConfig = (
    rule: Rule
  ): rule is Rule & { config?: RuleConfigSchema } => "config" in rule;

  // ---------- register (element/class-scope) ----------
  const registerRule = (rule: Rule): void => {
    rules.set(rule.id, rule);

    if (!configurations.has(rule.id)) {
      const defaults: Record<string, unknown> = {};
      if (hasConfig(rule) && rule.config) {
        for (const [key, field] of Object.entries(rule.config)) {
          defaults[key] = field.default;
        }
      }

      configurations.set(rule.id, {
        ruleId: rule.id,
        enabled: rule.enabled,
        severity: rule.severity,
        customSettings: defaults,
      });
    }
  };

  const registerRules = (rulesToRegister: Rule[]): void => {
    for (const r of rulesToRegister) registerRule(r);
  };

  // ---------- register (page-scope) ----------
  const registerPageRule = (rule: PageRule): void => {
    pageRules.set(rule.id, rule);

    // share the same configuration store and shape
    if (!configurations.has(rule.id)) {
      configurations.set(rule.id, {
        ruleId: rule.id,
        enabled: rule.enabled,
        severity: rule.severity as Severity,
        customSettings: {}, // page rules typically have no schema yet
      });
    }
  };

  const registerPageRules = (list: PageRule[]): void => {
    for (const r of list) registerPageRule(r);
  };

  // ---------- clear ----------
  const clear = (): void => {
    rules.clear();
    pageRules.clear(); // NEW
    configurations.clear();
  };

  // ---------- getters (element/class-scope) ----------
  const getRule = (ruleId: string): Rule | undefined => rules.get(ruleId);

  const getAllRules = (): Rule[] => Array.from(rules.values());

  const getAllRulesSorted = (): Rule[] =>
    Array.from(rules.values()).sort((a, b) => a.id.localeCompare(b.id));

  const getRulesByClassType = (classType: ClassType): Rule[] =>
    getAllRules().filter(
      (r) =>
        (r.type === "naming" || r.type === "property") &&
        Array.isArray(r.targetClassTypes) &&
        r.targetClassTypes.includes(classType)
    );

  const getRulesByCategory = (category: RuleCategory): Rule[] =>
    getAllRules().filter((r) => r.category === category);

  const getEnabledRules = (): Rule[] =>
    getAllRules().filter((r) => configurations.get(r.id)?.enabled ?? r.enabled);

  const getElementScopeRules = (): Rule[] =>
    getAllRules().filter((r) => typeof r.analyzeElement === "function");

  const getClassScopeRules = (): Rule[] =>
    getAllRules().filter((r) => r.type === "naming" || r.type === "property");

  // ---------- getters (page-scope) ----------
  const getPageRules = (): PageRule[] => Array.from(pageRules.values()); // NEW

  const getEnabledPageRules = (): PageRule[] => // NEW
    getPageRules().filter(
      (r) => configurations.get(r.id)?.enabled ?? r.enabled
    );

  const getPageRulesSorted = (): PageRule[] => // NEW
    Array.from(pageRules.values()).sort((a, b) => a.id.localeCompare(b.id));

  // ---------- configuration ----------
  const updateRuleConfiguration = (
    ruleId: string,
    update: Partial<Omit<RuleConfiguration, "ruleId">>
  ): void => {
    const existing = configurations.get(ruleId);
    if (!existing) return;

    const mergedSettings = {
      ...existing.customSettings,
      ...(update.customSettings ?? {}),
    };

    configurations.set(ruleId, {
      ...existing,
      ...update,
      customSettings: mergedSettings,
    });
  };

  const getRuleConfiguration = (
    ruleId: string
  ): RuleConfiguration | undefined => configurations.get(ruleId);

  const getAllConfigurations = (): RuleConfiguration[] =>
    Array.from(configurations.values());

  const exportConfiguration = (): string =>
    JSON.stringify(getAllConfigurations(), null, 2);

  const importConfiguration = (json: string): void => {
    try {
      const incoming: RuleConfiguration[] = JSON.parse(json);
      for (const cfg of incoming) {
        const current = configurations.get(cfg.ruleId);
        if (!current) continue;
        configurations.set(cfg.ruleId, {
          ...current,
          enabled: cfg.enabled ?? current.enabled,
          severity: cfg.severity ?? current.severity,
          customSettings: {
            ...current.customSettings,
            ...(cfg.customSettings ?? {}),
          },
        });
      }
    } catch (err) {
      console.error("Failed to import rule configuration:", err);
    }
  };

  return {
    // register
    registerRule,
    registerRules,
    registerPageRule, // NEW
    registerPageRules, // NEW

    // lifecycle
    clear,

    // getters (element/class)
    getRule,
    getAllRules,
    getAllRulesSorted,
    getRulesByClassType,
    getRulesByCategory,
    getEnabledRules,
    getElementScopeRules,
    getClassScopeRules,

    // getters (page)
    getPageRules, // NEW
    getEnabledPageRules, // NEW
    getPageRulesSorted, // NEW

    // configuration
    updateRuleConfiguration,
    getRuleConfiguration,
    getAllConfigurations,
    exportConfiguration,
    importConfiguration,
  } as const;
};

export type RuleRegistry = ReturnType<typeof createRuleRegistry>;
