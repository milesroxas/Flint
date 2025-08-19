import type {
  GrammarAdapter,
  ElementRole,
} from "@/features/linter/model/linter.types";

/** Stable, minimal element snapshot for role detection */
export interface ElementSnapshot {
  readonly id: string;
  readonly tagName: string;
  readonly classes: readonly string[];
  readonly parentId: string | null;
  readonly childrenIds: readonly string[];
  readonly textContent?: string;
  readonly attributes: Readonly<Record<string, string>>;
}

/** Platform-agnostic context for role detection */
export interface DetectionContext {
  readonly allElements: readonly ElementSnapshot[];
  readonly styleInfo: readonly {
    readonly className: string;
    readonly properties: Readonly<Record<string, unknown>>;
  }[];
  readonly pageInfo: {
    readonly title?: string;
    readonly url?: string;
  };
}

/** Role detection result */
export interface RoleDetectionResult {
  readonly role: ElementRole;
  readonly score: number;
  readonly reasoning?: string;
}

/** Role detector function type */
export interface RoleDetector {
  readonly id: string;
  readonly description?: string;
  detect(
    element: ElementSnapshot,
    context: DetectionContext
  ): RoleDetectionResult | null;
}

/** Preset configuration interface */
export interface Preset {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly grammar?: GrammarAdapter;
  readonly roleDetectors?: readonly RoleDetector[];
  readonly roleDetectionConfig?: {
    readonly threshold: number;
    readonly fallbackRole?: ElementRole;
  };
  readonly rules: readonly import("@/features/linter/model/rule.types").Rule[];
}
