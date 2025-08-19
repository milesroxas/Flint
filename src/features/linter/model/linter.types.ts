import type { ClassType } from "@/features/linter/model/rule.types";

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
  kind: ClassType;
  type?: string;
  variation?: string;
  elementToken?: string;
  tokens?: string[];
  componentKey?: string | null;
}

export interface GrammarAdapter {
  id: string;
  parse(name: string): ParsedClass;
  isCustomFirstRequired?: boolean;
  utilityPrefix?: string;
  componentPrefix?: string;
  comboPrefix?: string;
}

/** Role detection outputs and helpers */
export type RolesByElement = Record<ElementId, ElementRole>;
export type RoleScore = {
  elementId: ElementId;
  role: ElementRole;
  score: number;
};

export interface ElementGraphApi {
  getParentId(id: ElementId): ElementId | null;
  getChildrenIds(id: ElementId): ElementId[];
  getAncestorIds(id: ElementId): ElementId[];
  getDescendantIds(id: ElementId): ElementId[];
  getTagName(id: ElementId): string | null;
}

/** Style context used by rules but defined by the linter runtime */
export interface ElementStyleApi {
  /** Ordered list of class names as set in Designer for an element */
  getClasses(id: ElementId): string[];
  /** All unique class names on page for cross-checks */
  getAllStyles(): string[];
  /** Identify a class kind quickly without full parse */
  getClassType(name: string): ClassType;
}

/** Element ID type alias */
export type ElementId = string;

/** Role detection configuration */
export interface RoleDetectionConfig {
  readonly threshold: number;
  readonly fallbackRole?: ElementRole;
}
