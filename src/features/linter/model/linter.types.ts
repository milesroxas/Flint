// Legacy context config removed entirely

export type ClassKind = "custom" | "utility" | "combo" | "unknown";

export type ElementRole =
  | "main"
  | "section"
  | "componentRoot"
  | "childGroup"
  // staged roles (reserved, not yet used by rules)
  | "container"
  | "layout"
  | "content"
  | "unknown";

/** Parsed output from the active GrammarAdapter. Keep fields optional unless guaranteed. */
export interface ParsedClass {
  raw: string;
  kind: ClassKind;
  type?: string;
  variation?: string;
  elementToken?: string;
  tokens?: string[];
  /** e.g., hero_primary extracted from hero_primary_wrap; may be missing */
  componentKey?: string | null;
}

export interface GrammarAdapter {
  id: string;
  parse(name: string): ParsedClass;
  /** Some presets require base custom first in the class list */
  isCustomFirstRequired?: boolean;
  /** Optional naming hints for utilities/components/combos */
  utilityPrefix?: string;
  componentPrefix?: string;
  comboPrefix?: string;
}

/** Role detection layer contracts */
export type RoleScore = { elementId: string; role: ElementRole; score: number };
export type RolesByElement = Record<string, ElementRole>;

export type RoleDetector = (input: {
  elementId: string;
  element: import("@/features/linter/entities/element/model/element.types").WebflowElement;
  classNames: string[];
  /** First base custom parsed (if any) to save work across detectors */
  parsedFirstCustom?: ParsedClass;
  /** Closest ancestor chain (nearest first or farthest first—document your choice) */
  ancestryIds?: string[];
}) => RoleScore | null;

export interface RoleDetectionConfig {
  /** Score threshold (0..1) required for a role to classify; below → unknown */
  threshold: number;
}

/** Shared severity union used everywhere (match your rule.types Severity) */
export type Severity = "suggestion" | "warning" | "error";

/** Minimal “lite” result/rule (optional—align to main Severity) */
export interface RuleResultLite {
  id: string;
  message: string;
  severity: Severity;
  context?: string;
  metadata?: Record<string, unknown>;
}

export interface RuleLite {
  id: string;
  meta: {
    defaultSeverity: Severity;
    description: string;
    context?: string;
  };
  run(ctx: unknown): RuleResultLite[];
}

/** Page-scope rules (run by page-rule-runner before element rules) */
export interface PageRule {
  id: string;
  name: string;
  severity: Severity;
  enabled: boolean;
  /** Analyze the whole page graph/roles; return element-scoped RuleResults */
  analyzePage: (args: {
    rolesByElement: RolesByElement;
    getParentId: (id: string) => string | null;
    getChildrenIds: (id: string) => string[];
    getAncestorIds?: (id: string) => string[];
    /** Useful for naming-derived checks inside page rules */
    getClassNamesForElement: (id: string) => string[];
    parseClass?: (name: string) => ParsedClass;
  }) => import("./rule.types").RuleResult[];
}

/** Preset definition: detectors + rules bundles */
export interface Preset {
  id: string;
  grammar?: GrammarAdapter;

  /** Detector-based roles (preferred; replaces legacy resolvers) */
  roleDetectors?: RoleDetector[];
  roleDetectionConfig?: RoleDetectionConfig;

  /** Optional filter to exclude globals/utilities from classification */
  excludeElement?: (
    element: import("@/features/linter/entities/element/model/element.types").WebflowElement
  ) => boolean;

  /** Element-scope rules (naming/property/structure) */
  rules: import("./rule.types").Rule[];
  /** Page-scope rules (e.g., main singleton, main-children) */
  pageRules?: PageRule[];

  /** Per-rule overrides for enabled/severity/options */
  ruleConfig?: Record<
    string,
    {
      enabled?: boolean;
      severity?: Severity;
      options?: Record<string, unknown>;
    }
  >;
}

export interface ProjectConfig {
  preset: string;
  opinionMode?: "strict" | "balanced" | "lenient";
  overrides?: {
    grammar?: Partial<GrammarAdapter>;
    /** Optional aliases for custom roles (rare; prefer detectors) */
    roleAliases?: Record<string, ElementRole>;
    rules?: Record<
      string,
      {
        enabled?: boolean;
        severity?: Severity;
        options?: Record<string, unknown>;
      }
    >;
  };
}
