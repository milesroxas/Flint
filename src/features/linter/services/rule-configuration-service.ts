import { stableStringify } from "@/shared/lib";

// features/linter/services/rule-configuration-service.ts
import type {
  Rule,
  RuleConfiguration,
  RuleConfigSchema,
} from "@/features/linter/model/rule.types";

/* ---------- Minimal registry interface (structural typing) ---------- */
type RuleRegistryLike = {
  getAllRules(): ReadonlyArray<Rule>;
};

/* ---------- Storage adapters ---------- */
export interface StorageAdapter {
  read(): string | null;
  write(value: string): void;
}

export const createLocalStorageAdapter = (key: string): StorageAdapter => ({
  read: () => {
    try {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem(key)
        : null;
    } catch {
      return null;
    }
  },
  write: (value: string) => {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    } catch {
      /* no-op in private browsing or blocked storage */
    }
  },
});

export const createMemoryStorageAdapter = (): StorageAdapter => {
  let buf: string | null = null;
  return {
    read: () => buf,
    write: (v: string) => {
      buf = v;
    },
  };
};

/* ---------- File format (v1) ---------- */
type SerializedConfigFileV1 = {
  version: 1;
  /** Optional scoping to a preset without making it mandatory */
  presetId?: string | null;
  enabledRules?: string[];
  ruleConfigs: Record<string, Record<string, unknown>>;
  lastUpdated?: string;
};

// Backward compatible union for old files without a version field
type SerializedConfigFile =
  | SerializedConfigFileV1
  | {
      // v0 legacy shape (no version)
      enabledRules?: string[];
      ruleConfigs: Record<string, Record<string, unknown>>;
      lastUpdated?: string;
      presetId?: string | null;
    };

/* ---------- Options and service shape ---------- */
export type RuleConfigurationService = ReturnType<
  typeof createRuleConfigurationService
>;

export type RuleConfigurationServiceOptions = {
  storage?: StorageAdapter;
  storageKey?: string;
  /** Optional scoping. Kept in the file for multi-preset workflows. */
  presetId?: string | null;
  /** Testability point for timestamps */
  nowISO?: () => string;
  /** Log hook (development only) */
  log?: (msg: string, data?: unknown) => void;
};

/* ---------- Helpers: schema seeding and pruning ---------- */
function applySchemaDefaults(
  schema: RuleConfigSchema | undefined,
  stored: Readonly<Record<string, unknown>> | undefined
): Record<string, unknown> {
  if (!schema) {
    // No schema means leave user settings as-is
    return { ...(stored ?? {}) };
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(schema)) {
    const defVal = (schema as Record<string, { default: unknown }>)[key]
      ?.default;
    out[key] = stored && key in stored ? stored[key] : defVal;
  }
  // prune any unknown keys that were stored previously
  return out;
}

function isV1(file: SerializedConfigFile): file is SerializedConfigFileV1 {
  return (file as SerializedConfigFileV1).version === 1;
}

/* ---------- Factory ---------- */
export const createRuleConfigurationService = (
  ruleRegistry: RuleRegistryLike,
  opts: RuleConfigurationServiceOptions = {}
) => {
  const storageKey = opts.storageKey ?? "codalyn.linter.rules.v1";
  const storage = opts.storage ?? createLocalStorageAdapter(storageKey);
  const nowISO = opts.nowISO ?? (() => new Date().toISOString());
  const log = opts.log ?? (() => {});

  /* ----- Core read/write ----- */
  const readFile = (): SerializedConfigFile => {
    try {
      const raw = storage.read();
      if (!raw) return { ruleConfigs: {} };
      const parsed = JSON.parse(raw) as SerializedConfigFile;
      // Accept v0 silently; upgrade to v1 in memory
      if (isV1(parsed)) return parsed;
      return {
        version: 1,
        enabledRules: parsed.enabledRules ?? [],
        ruleConfigs: parsed.ruleConfigs ?? {},
        lastUpdated: parsed.lastUpdated,
        presetId: parsed.presetId ?? null,
      };
    } catch (err) {
      log("Malformed stored config. Falling back to defaults.", err);
      return { ruleConfigs: {} };
    }
  };

  const writeFile = (file: SerializedConfigFileV1) => {
    try {
      storage.write(stableStringify(file));
      log("Saved linter config", file);
    } catch (err) {
      log("Failed to save linter config", err);
    }
  };

  /* ----- Public API ----- */

  /**
   * Build effective configs by merging storage with registry defaults
   * and seeding/pruning via config schema.
   */
  const load = (): RuleConfiguration[] => {
    const file = readFile();
    const enabledSet = new Set(file.enabledRules ?? []);
    const rules = ruleRegistry.getAllRules();

    return rules.map((rule) => {
      // Enabled logic:
      // - If file lists enabledRules, respect explicit presence
      // - If rule has no stored block yet, default to rule.enabled
      // - If rule is absent from enabledRules but has a stored block, keep disabled
      const hasStored = Object.prototype.hasOwnProperty.call(
        file.ruleConfigs,
        rule.id
      );
      const enabled = file.enabledRules
        ? enabledSet.has(rule.id) || !hasStored
          ? rule.enabled
          : false
        : rule.enabled;

      const storedSettings = file.ruleConfigs[rule.id];
      const customSettings = applySchemaDefaults(
        (rule as Rule & { config?: RuleConfigSchema }).config,
        storedSettings
      );

      return {
        ruleId: rule.id,
        enabled,
        severity: rule.severity,
        customSettings,
      };
    });
  };

  /**
   * Persist a full set of configs. Keeps format stable and compatible.
   */
  const save = (
    configs: ReadonlyArray<RuleConfiguration>,
    presetId: string | null = opts.presetId ?? null
  ): void => {
    const file: SerializedConfigFileV1 = {
      version: 1,
      presetId,
      enabledRules: configs.filter((c) => c.enabled).map((c) => c.ruleId),
      ruleConfigs: configs.reduce<Record<string, Record<string, unknown>>>(
        (acc, cfg) => {
          acc[cfg.ruleId] = { ...cfg.customSettings };
          return acc;
        },
        {}
      ),
      lastUpdated: nowISO(),
    };
    writeFile(file);
  };

  /**
   * Export a set of configs to a JSON string.
   */
  const exportConfiguration = (
    configs: ReadonlyArray<RuleConfiguration>,
    presetId: string | null = opts.presetId ?? null
  ): string => {
    const file: SerializedConfigFileV1 = {
      version: 1,
      presetId,
      enabledRules: configs.filter((c) => c.enabled).map((c) => c.ruleId),
      ruleConfigs: configs.reduce<Record<string, Record<string, unknown>>>(
        (acc, cfg) => {
          acc[cfg.ruleId] = { ...cfg.customSettings };
          return acc;
        },
        {}
      ),
      lastUpdated: nowISO(),
    };
    return stableStringify(file);
  };

  /**
   * Import from JSON and return the effective merged array.
   * Does not auto-save, so caller can preview or validate before persisting.
   */
  const importConfiguration = (json: string): RuleConfiguration[] => {
    let incoming: SerializedConfigFile;
    try {
      incoming = JSON.parse(json) as SerializedConfigFile;
      if (!incoming || typeof incoming !== "object") {
        throw new Error("Invalid payload");
      }
      if (
        !("ruleConfigs" in incoming) ||
        typeof incoming.ruleConfigs !== "object"
      ) {
        throw new Error("Missing ruleConfigs");
      }
    } catch (err) {
      throw new Error("Invalid configuration file");
    }

    const base = load();
    const enabledSet = new Set(incoming.enabledRules ?? []);

    return base.map((cfg) => {
      const next: RuleConfiguration = { ...cfg };
      if (incoming.enabledRules) next.enabled = enabledSet.has(cfg.ruleId);
      if (incoming.ruleConfigs[cfg.ruleId]) {
        // Re-apply schema to imported values as well
        const rule = ruleRegistry
          .getAllRules()
          .find((r) => r.id === cfg.ruleId);
        const schema =
          rule && (rule as Rule & { config?: RuleConfigSchema }).config;
        next.customSettings = applySchemaDefaults(
          schema,
          incoming.ruleConfigs[cfg.ruleId]
        );
      }
      return next;
    });
  };

  /**
   * Reset to registry defaults and persist.
   */
  const resetToDefaults = (
    presetId: string | null = opts.presetId ?? null
  ): RuleConfiguration[] => {
    const defaults = ruleRegistry
      .getAllRules()
      .map<RuleConfiguration>((rule) => {
        const schema = (rule as Rule & { config?: RuleConfigSchema }).config;
        return {
          ruleId: rule.id,
          enabled: rule.enabled,
          severity: rule.severity,
          customSettings: applySchemaDefaults(schema, undefined),
        };
      });
    save(defaults, presetId);
    return defaults;
  };

  /**
   * Convenience helpers for single-rule edits. Both persist immediately.
   */
  const upsertRuleCustomSettings = (
    ruleId: string,
    partial: Record<string, unknown>
  ): RuleConfiguration[] => {
    const current = load();
    const next = current.map((cfg) => {
      if (cfg.ruleId !== ruleId) return cfg;
      const rule = ruleRegistry.getAllRules().find((r) => r.id === ruleId);
      const schema =
        rule && (rule as Rule & { config?: RuleConfigSchema }).config;
      const merged = { ...cfg.customSettings, ...partial };
      return { ...cfg, customSettings: applySchemaDefaults(schema, merged) };
    });
    save(next);
    return next;
  };

  const setRuleEnabled = (
    ruleId: string,
    enabled: boolean
  ): RuleConfiguration[] => {
    const current = load();
    const next = current.map((c) =>
      c.ruleId === ruleId ? { ...c, enabled } : c
    );
    save(next);
    return next;
  };

  return {
    load,
    save,
    exportConfiguration,
    importConfiguration,
    resetToDefaults,
    upsertRuleCustomSettings,
    setRuleEnabled,
  };
};
