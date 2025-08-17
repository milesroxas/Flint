import type {
  Rule,
  RuleConfiguration,
  RuleConfigSchema,
  ClassType,
  RuleCategory,
} from "@/features/linter/model/rule.types";

export const createRuleRegistry = () => {
  const rules = new Map<string, Rule>();
  const configurations = new Map<string, RuleConfiguration>();

  // ---------- type guards ----------
  const hasConfig = (
    rule: Rule
  ): rule is Rule & { config?: RuleConfigSchema } => "config" in rule;

  // ---------- register ----------
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

  // ---------- clear ----------
  const clear = (): void => {
    rules.clear();
    configurations.clear();
  };

  // ---------- getters ----------
  const getRule = (ruleId: string): Rule | undefined => rules.get(ruleId);

  const getAllRules = (): Rule[] => Array.from(rules.values());

  // Stable order (useful for snapshots, deterministic output)
  const getAllRulesSorted = (): Rule[] =>
    Array.from(rules.values()).sort((a, b) => a.id.localeCompare(b.id));

  // Only class-scope (naming/property) rules that apply to a class type
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

  // Element-scope rules (structure) — used by element-phase in the runner
  const getElementScopeRules = (): Rule[] =>
    getAllRules().filter((r) => typeof r.analyzeElement === "function");

  // Class-scope rules (naming/property) — used by class-phase in the runner
  const getClassScopeRules = (): Rule[] =>
    getAllRules().filter((r) => r.type === "naming" || r.type === "property");

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
        if (!current) continue; // ignore configs for unregistered rules
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
    registerRule,
    registerRules,
    clear,
    getRule,
    getAllRules,
    getAllRulesSorted,
    getRulesByClassType,
    getRulesByCategory,
    getEnabledRules,
    getElementScopeRules,
    getClassScopeRules,
    updateRuleConfiguration,
    getRuleConfiguration,
    getAllConfigurations,
    exportConfiguration,
    importConfiguration,
  } as const;
};

export type RuleRegistry = ReturnType<typeof createRuleRegistry>;
