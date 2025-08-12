import { ruleRegistry, initializeRuleRegistry } from "@/features/linter/services/registry";
import { getDefaultPresetId, getPresetIds } from "@/presets";
import { resetStyleServiceCache } from "@/entities/style/model/style.service";
import type { OpinionMode } from "@/features/linter/model/opinion.modes";

let isInitialized = false;
let currentMode: OpinionMode = "balanced";
let currentPreset: string = getDefaultPresetId();

export function ensureLinterInitialized(mode: OpinionMode = "balanced", preset: string = currentPreset): void {
  if (isInitialized && mode === currentMode && preset === currentPreset) return;
  initializeRuleRegistry(mode, preset);
  isInitialized = true;
  currentMode = mode;
  currentPreset = preset;
  // Invalidate style cache when registry (and potentially preset) changes
  resetStyleServiceCache();
}

export function getRuleRegistry() {
  return ruleRegistry;
}

export function setPreset(preset: string) {
  currentPreset = preset;
  // Reinitialize with existing mode but new preset
  ensureLinterInitialized(currentMode, currentPreset);
}

export function getCurrentPreset(): string { return currentPreset; }

export function getAvailablePresetIds(): string[] { return getPresetIds(); }


