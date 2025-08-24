import { StyleInfo } from "@/entities/style/model/style.types";
import { ElementGraph } from "@/entities/element/services/element-graph.service";
import {
  ElementRole,
  ParsedClass,
  RolesByElement,
} from "@/features/linter/model/linter.types";

// -------------------------
// Severity & Result Types
// -------------------------

export type Severity = "suggestion" | "warning" | "error";

// -------------------------
// Expanded View Support
// -------------------------
export type ExpandedViewContentType =
  | "recognized-elements"
  | "rule-documentation"
  | "diagnostic-details"
  | "suggested-fixes";

export interface ExpandedViewCapability {
  contentType: ExpandedViewContentType;
  title: string;
  description?: string;
  /** Predicate to determine if this expansion is relevant for a given violation */
  isRelevantFor?: (violation: RuleResult) => boolean;
}

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
  fix?: QuickFix;
  /** Declares what expanded view capabilities this result supports */
  expandedViewCapabilities?: ExpandedViewCapability[];
}

// -------------------------
// Quick Fix
// -------------------------
export type QuickFix =
  | {
      kind: "rename-class";
      from: string;
      to: string;
      scope: "element" | "global";
    }
  | {
      kind: "reorder-classes";
      order: string[]; // full class order to apply
      scope: "element";
    }
  | {
      kind: "add-class";
      className: string;
      scope: "element";
    }
  | {
      kind: "remove-class";
      className: string;
      scope: "element";
    };

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
  | "composition"
  | "semantics"
  | "performance"
  | "accessibility"
  | "maintainability"
  | "custom";
export type RuleType =
  | "naming"
  | "property"
  | "structure"
  | "composition"
  | "page";

export interface BaseRule {
  id: string;
  name: string;
  description: string;
  example?: string;
  type: RuleType;
  severity: Severity;
  enabled: boolean;
  category: RuleCategory;
  analyzeElement?: (args: ElementAnalysisArgs) => RuleResult[];
}

export interface NamingRule extends BaseRule {
  type: "naming";
  targetClassTypes: ClassType[];
  test: (className: string) => boolean;
  evaluate?: (
    className: string,
    context: RuleContext & { config?: Record<string, unknown> }
  ) => RuleResult | null | undefined;
  config?: RuleConfigSchema;
}

export interface PropertyRule extends BaseRule {
  type: "property";
  targetClassTypes: ClassType[];
  analyze: (
    className: string,
    properties: Record<string, unknown>,
    context: RuleContext & { config?: Record<string, unknown> }
  ) => RuleResult[];
  config?: RuleConfigSchema;
}

export interface StructureRule extends BaseRule {
  type: "structure";
  category: "structure";
  targetClassTypes?: ClassType[];
  analyzeElement: (args: ElementAnalysisArgs) => RuleResult[];
}

export interface CompositionRule extends BaseRule {
  type: "composition";
  category: RuleCategory;
  analyzeElement: (args: ElementAnalysisArgs) => RuleResult[];
  config?: RuleConfigSchema;
}

/** Page-scope rules aggregate signals across the whole page */
export interface PageRule extends BaseRule {
  type: "page";
  analyzePage(args: PageAnalysisArgs): RuleResult[];
}

export type Rule =
  | NamingRule
  | PropertyRule
  | StructureRule
  | CompositionRule
  | PageRule;

// -------------------------
// Execution Context & Save
// -------------------------
export interface RuleContext {
  allStyles: StyleInfo[];
  utilityClassPropertiesMap: Map<string, { name: string; properties: any }[]>;
  propertyToClassesMap: Map<string, Set<string>>;
}

// -------------------------
// Page-level Analysis
// -------------------------

export interface PageAnalysisArgs {
  rolesByElement: RolesByElement;
  graph: ElementGraph;
  styles: StyleInfo[];
  getRoleForElement(id: string): ElementRole | "unknown";
  getRuleConfig<T extends Record<string, unknown>>(
    ruleId: string
  ): {
    ruleId: string;
    enabled: boolean;
    severity: Severity;
    customSettings: T;
  };
  getTagName(id: string): string | null;
  getElementType(id: string): string | null;
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

  rolesByElement?: RolesByElement;
  getRoleForElement?: (elementId: string) => ElementRole;

  getParentId?: (elementId: string) => string | null;
  getChildrenIds?: (elementId: string) => string[];
  getAncestorIds?: (elementId: string) => string[];

  getClassNamesForElement?: (elementId: string) => string[];
  parseClass?: (name: string) => ParsedClass;
  getTagName?: (elementId: string) => string | null;
  getElementType?: (elementId: string) => string | null;
}

export interface RuleConfiguration {
  ruleId: string;
  enabled: boolean;
  severity: Severity;
  customSettings: Record<string, unknown>;
}
