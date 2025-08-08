import { ruleRegistry, initializeRuleRegistry } from "@/features/linter/services/registry";

let isInitialized = false;

export function ensureLinterInitialized(): void {
  if (isInitialized) return;
  initializeRuleRegistry();
  isInitialized = true;
}

export function getRuleRegistry() {
  return ruleRegistry;
}


