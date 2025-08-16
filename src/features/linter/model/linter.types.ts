import type { ElementContextConfig } from "@/entities/element/model/element-context.types";

// Core contracts per docs/guides/unified-plan.md §5

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

export interface ParsedClass {
  raw: string;
  kind: ClassKind;
  type?: string;
  variation?: string;
  elementToken?: string;
  tokens?: string[];
}

export interface GrammarAdapter {
  id: string;
  parse(name: string): ParsedClass;
  isCustomFirstRequired?: boolean;
  utilityPrefix?: string;
  componentPrefix?: string;
  comboPrefix?: string;
}

export interface RoleResolver {
  id: string;
  mapToRole(parsed: ParsedClass): ElementRole;
  isContainerLike?(parsed: ParsedClass): boolean;
}

// Role detection layer contracts
export type RoleScore = { elementId: string; role: ElementRole; score: number };
export type RolesByElement = Record<string, ElementRole>;
export type RoleDetector = (input: {
  elementId: string;
  element: import("@/entities/element/model/element-context.types").WebflowElement;
  classNames: string[];
  parsedFirstCustom?: ParsedClass;
  ancestryIds?: string[];
}) => RoleScore | null;

export interface RoleDetectionConfig {
  threshold: number; // 0..1
}

export interface RuleResultLite {
  id: string;
  message: string;
  severity: "suggestion" | "warning" | "error";
  context?: string;
  metadata?: Record<string, unknown>;
}

export interface RuleLite {
  id: string;
  meta: {
    defaultSeverity: RuleResultLite["severity"];
    description: string;
    context?: string;
  };
  run(ctx: unknown): RuleResultLite[];
}

export interface Preset {
  id: string;
  grammar?: GrammarAdapter;
  roles?: RoleResolver;
  roleDetectors?: RoleDetector[];
  roleDetectionConfig?: RoleDetectionConfig;
  rules: import("./rule.types").Rule[];
  /** Optional element-context classifier configuration for this preset */
  contextConfig?: Partial<ElementContextConfig>;
  ruleConfig?: Record<
    string,
    {
      enabled?: boolean;
      severity?: RuleResultLite["severity"];
      options?: Record<string, unknown>;
    }
  >;
}

export interface ProjectConfig {
  preset: string;
  opinionMode?: "strict" | "balanced" | "lenient";
  overrides?: {
    grammar?: Partial<GrammarAdapter>;
    roleAliases?: Record<string, ElementRole>;
    rules?: Record<
      string,
      {
        enabled?: boolean;
        severity?: RuleResultLite["severity"];
        options?: Record<string, unknown>;
      }
    >;
  };
}


