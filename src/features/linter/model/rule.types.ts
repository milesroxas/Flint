import { StyleInfo } from "@/entities/style/model/style.service";
import { ElementContext } from "@/entities/element/model/element-context.types";

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
  context?: ElementContext;
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
export type ClassType = "custom" | "utility" | "combo";
export type RuleCategory =
  | "format"
  | "semantics"
  | "performance"
  | "accessibility"
  | "custom";
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
  context?: ElementContext;
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

// -------------------------
// Element-level Analysis
// -------------------------
export interface ElementClassItem {
  name: string;
  order: number;
  elementId: string;
  isCombo?: boolean;
  detectionSource?: string;
}

export interface ElementAnalysisArgs {
  classes: ElementClassItem[];
  contexts: ElementContext[];
  allStyles: StyleInfo[];
  getClassType: (className: string, isCombo?: boolean) => ClassType;
  getRuleConfig: (ruleId: string) => RuleConfiguration | undefined;
  rolesByElement?: import("@/features/linter/model/linter.types").RolesByElement;
  getRoleForElement?: (
    elementId: string
  ) => import("@/features/linter/model/linter.types").ElementRole;
  getParentId?: (elementId: string) => string | null;
  getChildrenIds?: (elementId: string) => string[];
  getAncestorIds?: (elementId: string) => string[];
  getClassNamesForElement?: (elementId: string) => string[];
  parseClass?: (
    name: string
  ) => import("@/features/linter/model/linter.types").ParsedClass;
}

export interface RuleConfiguration {
  ruleId: string;
  enabled: boolean;
  severity: Severity;
  customSettings: Record<string, unknown>;
}
