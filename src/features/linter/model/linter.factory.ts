import {
  ruleRegistry,
  initializeRuleRegistry,
} from "@/features/linter/services/registry";
import { getDefaultPresetId, getPresetIds } from "@/features/linter/presets";
import type { OpinionMode } from "@/features/linter/model/opinion.modes";

let isInitialized = false;
let currentMode: OpinionMode = "balanced";
let currentPreset: string = getDefaultPresetId();

export function ensureLinterInitialized(
  mode: OpinionMode = "balanced",
  preset: string = currentPreset
): void {
  if (isInitialized && mode === currentMode && preset === currentPreset) return;
  initializeRuleRegistry(mode, preset);
  isInitialized = true;
  currentMode = mode;
  currentPreset = preset;
  // Invalidate style cache and services when registry (and potentially preset) changes
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
}

export function getCurrentPreset(): string {
  return currentPreset;
}

export function getAvailablePresetIds(): string[] {
  return getPresetIds();
}
