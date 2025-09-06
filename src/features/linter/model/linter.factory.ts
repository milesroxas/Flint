import {
  ruleRegistry,
  initializeRuleRegistry,
} from "@/features/linter/services/registry";
import { getDefaultPresetId, getPresetIds } from "@/features/linter/presets";
import type { OpinionMode } from "@/features/linter/model/opinion.modes";

let isInitialized = false;
let currentMode: OpinionMode = "balanced";

// Local storage key for remembering the active preset between UI states
const PRESET_STORAGE_KEY = "flowlint.activePresetId";

function safeReadStorage(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteStorage(key: string, value: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    /* ignore storage errors (private mode, blocked storage, etc.) */
  }
}

function resolveInitialPreset(): string {
  // 1) try persisted preset
  const persisted = safeReadStorage(PRESET_STORAGE_KEY);
  if (persisted) {
    const ids = getPresetIds();
    if (ids.includes(persisted)) return persisted;
  }
  // 2) fallback to default
  return getDefaultPresetId();
}

let currentPreset: string = resolveInitialPreset();

export function ensureLinterInitialized(
  mode: OpinionMode = "balanced",
  preset: string = currentPreset
): void {
  if (isInitialized && mode === currentMode && preset === currentPreset) return;
  initializeRuleRegistry(mode, preset);
  isInitialized = true;
  currentMode = mode;
  currentPreset = preset;
  // Persist selected preset so subsequent UI states (e.g., mode switches) keep it
  safeWriteStorage(PRESET_STORAGE_KEY, currentPreset);
  void (async () => {
    try {
      const styleCacheMod = await import(
        "@/entities/style/services/style-cache"
      );
      if (
        styleCacheMod &&
        typeof styleCacheMod.resetStyleServiceCache === "function"
      ) {
        styleCacheMod.resetStyleServiceCache();
      }

      const servicesMod = await import(
        "@/features/linter/services/linter-service-singleton"
      );
      if (
        servicesMod &&
        typeof servicesMod.resetLinterServices === "function"
      ) {
        servicesMod.resetLinterServices();
      }
    } catch {
      // Ignore errors in cache reset during initialization
    }
  })();
}

export function getRuleRegistry() {
  return ruleRegistry;
}

export function setPreset(preset: string) {
  currentPreset = preset;
  // Reinitialize with existing mode but new preset
  ensureLinterInitialized(currentMode, currentPreset);
  // Persist selection as well
  safeWriteStorage(PRESET_STORAGE_KEY, currentPreset);
}

export function getCurrentPreset(): string {
  return currentPreset;
}

export function getAvailablePresetIds(): string[] {
  return getPresetIds();
}
