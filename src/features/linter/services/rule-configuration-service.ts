import { RuleRegistry } from "@/features/linter/services/rule-registry";
import {
  RuleConfiguration,
  RuleConfigSchema,
} from "@/features/linter/model/rule.types";

interface SerializedConfigFile {
  enabledRules?: string[];
  ruleConfigs: Record<string, Record<string, unknown>>;
  lastUpdated?: string;
}

/** Abstracts storage (localStorage, in-memory, server) */
interface StorageAdapter {
  read(): string | null;
  write(value: string): void;
}

class LocalStorageAdapter implements StorageAdapter {
  constructor(private key: string) {}
  read(): string | null {
    return localStorage.getItem(this.key);
  }
  write(value: string): void {
    localStorage.setItem(this.key, value);
  }
}

export class RuleConfigurationService {
  private storage: StorageAdapter;
  constructor(
    private ruleRegistry: RuleRegistry,
    storageAdapter?: StorageAdapter
  ) {
    this.storage = storageAdapter ?? new LocalStorageAdapter(this.storageKey);
  }

  private storageKey = "webflow-linter-rules-config";

  /** Persist current configs */
  saveConfiguration(configs: RuleConfiguration[]): void {
    try {
      const file: SerializedConfigFile = {
        enabledRules: configs.filter(c => c.enabled).map(c => c.ruleId),
        ruleConfigs: configs.reduce<Record<string, Record<string, unknown>>>(
          (acc, cfg) => {
            acc[cfg.ruleId] = { ...cfg.customSettings };
            return acc;
          },
          {}
        ),
        lastUpdated: new Date().toISOString(),
      };

      this.storage.write(JSON.stringify(file, null, 2));
      console.log("Saved linter config", file);
    } catch (err) {
      console.error("Failed to save rule configuration", err);
    }
  }

  /** Load stored configs, merge with defaults, and validate */
  loadConfiguration(): RuleConfiguration[] {
    let file: SerializedConfigFile = { ruleConfigs: {} };
    try {
      const raw = this.storage.read();
      if (raw) file = JSON.parse(raw);
    } catch (err) {
      console.error("Malformed stored config, falling back to defaults", err);
    }

    const enabledSet = new Set(file.enabledRules ?? []);
    return this.ruleRegistry.getAllRules().map(rule => {
      let enabled: boolean;
      if (file.enabledRules) {
        const listed = enabledSet.has(rule.id);
        const hasStoredConfig = Object.prototype.hasOwnProperty.call(file.ruleConfigs, rule.id);
        // If the rule is explicitly listed, respect it. If it's not listed and we have no stored config for it
        // (i.e., it's new), fall back to the rule's default enabled state instead of disabling.
        enabled = listed || !hasStoredConfig ? rule.enabled : false;
      } else {
        enabled = rule.enabled;
      }

      // clone stored settings or start fresh
      const base = file.ruleConfigs[rule.id] ?? {};
      const customSettings: Record<string, unknown> = { ...base };

      // seed defaults and drop unknown keys
      // If rules expose a config schema, seed defaults and prune unknown keys.
      // New structure rules may not provide a schema; in that case, leave as-is.
      const schema = (rule as any).config as RuleConfigSchema | undefined;
      if (schema) {
        for (const key of Object.keys(schema)) {
          if (!(key in customSettings)) {
            customSettings[key] = schema[key].default;
          }
        }
        for (const key of Object.keys(customSettings)) {
          if (!(key in schema)) {
            delete customSettings[key];
          }
        }
      }

      return {
        ruleId: rule.id,
        enabled,
        severity: rule.severity,
        customSettings,
      } as RuleConfiguration;
    });
  }

  /** Import from user‐provided JSON */
  importConfiguration(json: string): RuleConfiguration[] {
    let file: SerializedConfigFile;
    try {
      file = JSON.parse(json);
      if (!file.ruleConfigs || typeof file.ruleConfigs !== "object") {
        throw new Error("Invalid or missing ruleConfigs");
      }
    } catch (err) {
      console.error("Failed to import configuration", err);
      throw new Error("Invalid configuration file");
    }

    // reuse loadConfiguration to get base + defaults, then override
    const baseConfigs = this.loadConfiguration();
    const enabledSet = new Set(file.enabledRules ?? []);
    return baseConfigs.map(cfg => {
      if (file.enabledRules) {
        cfg.enabled = enabledSet.has(cfg.ruleId);
      }
      if (file.ruleConfigs[cfg.ruleId]) {
        cfg.customSettings = { ...file.ruleConfigs[cfg.ruleId] };
      }
      return cfg;
    });
  }

  /** Export to JSON for sharing/saving */
  exportConfiguration(configs: RuleConfiguration[]): string {
    const file: SerializedConfigFile = {
      enabledRules: configs.filter(c => c.enabled).map(c => c.ruleId),
      ruleConfigs: configs.reduce<Record<string, Record<string, unknown>>>(
        (acc, cfg) => {
          acc[cfg.ruleId] = { ...cfg.customSettings };
          return acc;
        },
        {}
      ),
      lastUpdated: new Date().toISOString(),
    };
    return JSON.stringify(file, null, 2);
  }
}