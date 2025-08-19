import type {
  RoleDetectionConfig,
  RolesByElement,
} from "@/features/linter/model/linter.types";
import type { RoleDetector } from "@/features/linter/model/preset.types";
import type {
  WebflowElement,
  ElementWithClassNames,
} from "@/entities/element/model/element.types";

import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import { resolvePresetOrFallback } from "@/features/linter/presets";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";

import { createRoleDetectionService } from "@/features/linter/services/role-detection.service";
import {
  createElementGraphService,
  type ElementGraph,
} from "@/entities/element/services/element-graph.service";
import { createParentRelationshipService } from "@/entities/element/services/parent-relationship.service";
import { toElementKey } from "@/entities/element/lib/id";

import type {
  StyleInfo,
  StyleWithElement,
} from "@/entities/style/model/style.types";
import type { StyleService } from "@/entities/style/services/style.service";

export interface LintContext {
  allStyles: StyleInfo[];
  rolesByElement: RolesByElement;
  graph: ElementGraph;
  elementStyleMap: Map<string, StyleWithElement[]>;
  elementsWithClassNames: ElementWithClassNames[];
  signature: string;
  activePreset: ReturnType<typeof resolvePresetOrFallback>;
  parseClass: (name: string) => any;
  tagByElementId: Map<string, string | null>;
}

export interface LintContextService {
  createContext(elements: WebflowElement[]): Promise<LintContext>;
  createElementContext(
    element: WebflowElement,
    pageContext?: LintContext
  ): Promise<LintContext>;
}

/**
 * Filters elements to only those that support getStyles() method
 */
function filterValidElements(elements: WebflowElement[]): WebflowElement[] {
  return elements.filter((el: any) => el && typeof el.getStyles === "function");
}

/**
 * Creates signature for caching based on elements and their relationships
 */
function createSignature(
  pairs: { element: WebflowElement; styles: StyleWithElement[] }[],
  parentOf: Record<string, string | null>
): string {
  const rows = pairs
    .map((p) => {
      const id = toElementKey(p.element);
      const names = p.styles
        .map((s) => s.name)
        .filter(Boolean)
        .sort();
      return `${id}:${names.join("|")}`;
    })
    .sort();

  const tree = Object.entries(parentOf)
    .map(([child, parent]) => `${child}->${parent ?? ""}`)
    .sort();

  const djb2 = (s: string) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i);
    return (h >>> 0).toString(36);
  };

  return `v2:${djb2(rows.join("\n"))}:${djb2(tree.join("\n"))}`;
}

export function createLintContextService(deps: {
  styleService: StyleService;
}): LintContextService {
  const { styleService } = deps;

  // Cache for page contexts to avoid redundant computation
  let cachedContext: LintContext | null = null;
  let lastSignature: string | null = null;

  async function createContext(
    elements: WebflowElement[]
  ): Promise<LintContext> {
    if (!Array.isArray(elements)) {
      throw new Error("Elements must be an array");
    }

    // 1) Filter valid elements
    const validElements = filterValidElements(elements);

    // 2) Resolve active preset once
    const activePreset = resolvePresetOrFallback(getCurrentPreset());
    const grammar = activePreset.grammar ?? lumosGrammar;
    const parseClass = (name: string) => grammar.parse(name);
    const roleDetectors: readonly RoleDetector[] =
      activePreset.roleDetectors ?? [];
    const roleDetectionConfig: RoleDetectionConfig | undefined =
      activePreset.roleDetectionConfig;

    // 3) Load site-wide styles
    const allStyles: StyleInfo[] =
      await styleService.getAllStylesWithProperties();

    // 4) Collect applied styles with normalized element ids
    const elementStylePairs = await Promise.all(
      validElements.map(async (element) => {
        const applied = await styleService.getAppliedStyles(element);
        const elementId = toElementKey(element);
        const styles: StyleWithElement[] = applied.map((s) => ({
          ...s,
          elementId,
        }));
        return { element, styles };
      })
    );

    // 5) Build parent relationships
    const parentRelationshipService = createParentRelationshipService();
    const parentIdByChildId =
      await parentRelationshipService.buildParentChildMap(validElements);

    // 6) Create signature for caching
    const signature = createSignature(elementStylePairs, parentIdByChildId);

    // 7) Check cache
    if (cachedContext && lastSignature === signature) {
      return cachedContext;
    }

    // 8) Build ElementWithClassNames for role detection
    const elementsWithClassNames: ElementWithClassNames[] =
      elementStylePairs.map((pair) => ({
        element: pair.element,
        classNames: pair.styles
          .map((s) => s.name)
          .filter((n) => n.trim() !== ""),
      }));

    // 9) Detect roles
    const roleDetection = createRoleDetectionService({
      detectors: [...roleDetectors],
      config: roleDetectionConfig,
    });
    const rolesByElement: RolesByElement = roleDetection.detectRolesForPage(
      elementsWithClassNames
    );

    // 10) Create element graph
    const graph = createElementGraphService(validElements, parentIdByChildId);

    // 11) Collect tag information
    const tagByElementId = new Map<string, string | null>();
    await Promise.all(
      elementStylePairs.map(async ({ element }) => {
        const id = toElementKey(element);
        try {
          const tag = await graph.getTag(id);
          tagByElementId.set(id, tag);
        } catch (error) {
          tagByElementId.set(id, null);
        }
      })
    );

    // 12) Create element style map for quick lookup
    const elementStyleMap = new Map<string, StyleWithElement[]>();
    for (const pair of elementStylePairs) {
      const elementId = toElementKey(pair.element);
      elementStyleMap.set(elementId, pair.styles);
    }

    const context: LintContext = {
      allStyles,
      rolesByElement,
      graph,
      elementStyleMap,
      elementsWithClassNames,
      signature,
      activePreset,
      parseClass,
      tagByElementId,
    };

    // Cache for future use
    cachedContext = context;
    lastSignature = signature;

    return context;
  }

  async function createElementContext(
    element: WebflowElement,
    pageContext?: LintContext
  ): Promise<LintContext> {
    if (pageContext) {
      // If we have page context, create a focused context for this element
      // while preserving the rich page context for role detection and graph traversal
      const elementId = toElementKey(element);

      // Ensure the element's styles are in the page context
      if (!pageContext.elementStyleMap.has(elementId)) {
        // Element not in page context, fall back to isolated context
        return createContext([element]);
      }

      // Return page context - element linting will filter to its own styles
      return pageContext;
    }

    // No page context available, create isolated context
    return createContext([element]);
  }

  return {
    createContext,
    createElementContext,
  } as const;
}

export type LintContextServiceType = ReturnType<
  typeof createLintContextService
>;
