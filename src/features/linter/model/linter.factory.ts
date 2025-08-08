import { ruleRegistry, initializeRuleRegistry } from "@/features/linter/services/registry";
import type { OpinionMode } from "@/features/linter/model/opinion.modes";

let isInitialized = false;
let currentMode: OpinionMode = "balanced";

export function ensureLinterInitialized(mode: OpinionMode = "balanced"): void {
  if (isInitialized && mode === currentMode) return;
  initializeRuleRegistry(mode);
  isInitialized = true;
  currentMode = mode;
}

export function getRuleRegistry() {
  return ruleRegistry;
}


