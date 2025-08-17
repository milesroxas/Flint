import { StyleInfo } from "@/features/linter/entities/style/model/style.service";
import { ElementRole, ParsedClass } from "@/features/linter/model/linter.types";

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
  elementId?: string;
  isCombo: boolean;
  comboIndex?: number;
  example?: string;
  metadata?: Record<string, any>;
}

// -------------------------
// Configuration Schema
// -------------------------
export type RuleConfigFieldType =
  | "string"
  | "string[]"
  | "number"
  | "boolean"
  | "enum";

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
export type ClassType = "custom" | "utility" | "combo" | "unknown";
export type RuleCategory =
  | "structure"
  | "format"
  | "semantics"
  | "performance"
  | "accessibility"
  | "custom";
export type RuleType = "naming" | "property" | "structure";

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
  analyzeElement?: (args: ElementAnalysisArgs) => RuleResult[];
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
    properties: Record<string, unknown>,
    context: RuleContext & { config?: Record<string, unknown> }
  ) => RuleResult[];
  config?: RuleConfigSchema;
}

export type Rule = NamingRule | PropertyRule | BaseRule;

// -------------------------
// Execution Context & Save
// -------------------------
export interface RuleContext {
  allStyles: StyleInfo[];
  utilityClassPropertiesMap: Map<string, { name: string; properties: any }[]>;
  propertyToClassesMap: Map<string, Set<string>>;
}

// -------------------------
// Element-level Analysis
// -------------------------
export interface ElementClassItem {
  className: string;
  order: number;
  elementId: string;
  isCombo?: boolean;
  comboIndex?: number;
  detectionSource?: string;
}

export interface ElementAnalysisArgs {
  elementId: string;
  classes: ElementClassItem[];
  allStyles: StyleInfo[];
  getClassType: (className: string, isCombo?: boolean) => ClassType;
  getRuleConfig: (ruleId: string) => RuleConfiguration | undefined;
  rolesByElement?: import("@/features/linter/model/linter.types").RolesByElement;
  getRoleForElement?: (elementId: string) => ElementRole;
  getParentId?: (elementId: string) => string | null;
  getChildrenIds?: (elementId: string) => string[];
  getAncestorIds?: (elementId: string) => string[];
  getClassNamesForElement?: (elementId: string) => string[];
  parseClass?: (name: string) => ParsedClass;
}

export interface RuleConfiguration {
  ruleId: string;
  enabled: boolean;
  severity: Severity;
  customSettings: Record<string, unknown>;
}
