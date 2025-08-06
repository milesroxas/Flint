import { StyleInfo } from "../lib/style-service";

// -------------------------
// Severity & Result Types
// -------------------------
export type Severity = "suggestion" | "warning" | "error";

export interface RuleResult {
  ruleId: string;
  name: string;
  message: string;
  severity: Severity;
  className: string;
  isCombo: boolean;
  comboIndex?: number;
  example?: string;
  metadata?: Record<string, any>;
}

// -------------------------
// Configuration Schema
// -------------------------
export type RuleConfigFieldType = "string" | "string[]" | "number" | "boolean" | "enum";

export interface RuleConfigField {
  label: string;
  type: RuleConfigFieldType;
  description?: string;
  default: unknown;
  options?: string[]; // only for enum
}

export type RuleConfigSchema = Record<string, RuleConfigField>;

// -------------------------
// Core Rule Types
// -------------------------
export type ClassType = "custom" | "utility" | "combo";
export type RuleCategory = "format" | "semantics" | "performance" | "accessibility" | "custom";
export type RuleType = "naming" | "property";

export interface BaseRule {
  id: string;
  name: string;
  description: string;
  example?: string;
  type: RuleType;
  severity: Severity;
  enabled: boolean;
  category: RuleCategory;
  targetClassTypes: ClassType[];
}

export interface NamingRule extends BaseRule {
  type: "naming";
  test: (className: string) => boolean;
  evaluate?: (
    className: string,
    context?: { config?: Record<string, unknown> }
  ) => RuleResult | null | undefined;
  config?: RuleConfigSchema;
}

export interface PropertyRule extends BaseRule {
  type: "property";
  analyze: (
    className: string,
    properties: any,
    context: RuleContext & { config?: Record<string, unknown> }
  ) => RuleResult[];
  config?: RuleConfigSchema;
}

export type Rule = NamingRule | PropertyRule;

// -------------------------
// Execution Context & Save
// -------------------------
export interface RuleContext {
  allStyles: StyleInfo[];
  utilityClassPropertiesMap: Map<string, { name: string; properties: any }[]>;
  propertyToClassesMap: Map<string, Set<string>>;
}

export interface RuleConfiguration {
  ruleId: string;
  enabled: boolean;
  severity: Severity;
  customSettings: Record<string, unknown>;
}
