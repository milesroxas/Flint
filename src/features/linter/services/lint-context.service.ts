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
import {
  createLightweightStructuralContext,
  createLightweightGraphApi,
  setPageContextCache,
  invalidatePageContextCache,
} from "@/features/linter/services/lightweight-context.service";
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
  elementTypeByElementId: Map<string, string | null>;
}

export interface LintContextService {
  createContext(elements: WebflowElement[]): Promise<LintContext>;
  createElementContext(
    element: WebflowElement,
    pageContext?: LintContext
  ): Promise<LintContext>;
  createElementContextWithStructural(
    element: WebflowElement,
    useStructural?: boolean,
    pageContext?: LintContext
  ): Promise<LintContext>;
  clearCache(): void;
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

    // 9) Create element graph first (needed for structural role detection)
    const graph = createElementGraphService(validElements, parentIdByChildId);

    // 10) Detect roles with graph context for structural analysis
    const roleDetection = createRoleDetectionService({
      detectors: [...roleDetectors],
      config: roleDetectionConfig,
    });
    const rolesByElement: RolesByElement = roleDetection.detectRolesForPage(
      elementsWithClassNames,
      graph
    );

    // 11) Collect tag information (for semantic HTML validation)
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

    // 12) Collect element type information (for Webflow element type checks)
    const elementTypeByElementId = new Map<string, string | null>();
    for (const { element } of elementStylePairs) {
      const id = toElementKey(element);
      try {
        // Use element.type from Webflow API
        const elementType = (element as any)?.type || null;
        elementTypeByElementId.set(id, elementType);
      } catch (error) {
        elementTypeByElementId.set(id, null);
      }
    }

    // 13) Create element style map for quick lookup
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
      elementTypeByElementId,
    };

    // Cache for future use
    cachedContext = context;
    lastSignature = signature;

    // Also set in lightweight context cache for page mode performance
    setPageContextCache(context);

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
        return await createContext([element]);
      }

      // Return page context - element linting will filter to its own styles
      return pageContext;
    }

    // No page context available, create isolated context
    return await createContext([element]);
  }

  async function createElementContextWithStructural(
    element: WebflowElement,
    useStructural: boolean = false,
    pageContext?: LintContext
  ): Promise<LintContext> {
    if (pageContext) {
      // If we have page context, always use it for best accuracy
      return createElementContext(element, pageContext);
    }

    if (!useStructural) {
      // Standard isolated context (original behavior)
      return await createContext([element]);
    }

    // Create lightweight structural context
    const lightweightContext = await createLightweightStructuralContext(
      element
    );
    if (!lightweightContext) {
      // Fall back to isolated context if lightweight context creation fails
      return await createContext([element]);
    }

    // Create a mini-context with structural information
    const elementId = toElementKey(element);
    if (!elementId || !lightweightContext.availableElements.has(elementId)) {
      return await createContext([element]);
    }

    // Resolve active preset
    const activePreset = resolvePresetOrFallback(getCurrentPreset());
    const grammar = activePreset.grammar ?? lumosGrammar;
    const parseClass = (name: string) => grammar.parse(name);
    const roleDetectors: readonly RoleDetector[] =
      activePreset.roleDetectors ?? [];
    // Role detection config not needed for lightweight context

    // Get styles for all subtree elements (selected + descendants)
    const allStyles: StyleInfo[] =
      await styleService.getAllStylesWithProperties();
    const elementStyles: StyleWithElement[] = [];
    for (const id of lightweightContext.availableElements) {
      const el = lightweightContext.elementById.get(id);
      if (!el) continue;
      try {
        const applied = await styleService.getAppliedStyles(el);
        for (const s of applied) {
          elementStyles.push({ ...s, elementId: id });
        }
      } catch {
        // ignore style failures for non-selected nodes
      }
    }

    // Create lightweight graph API
    const lightweightGraph = createLightweightGraphApi(lightweightContext);

    // For role detection, create entries for all elements in lightweight context
    const elementsWithClassNames: ElementWithClassNames[] = [];
    for (const id of lightweightContext.availableElements) {
      const el = lightweightContext.elementById.get(id) ?? ({} as any);
      const classNames = (
        elementStyles.filter((s) => s.elementId === id).map((s) => s.name) ||
        lightweightContext.elementClassNames.get(id) ||
        []
      ).filter((n) => n && n.trim() !== "");
      elementsWithClassNames.push({ element: el, classNames });
    }

    // Note: For lightweight context, we only have the target element WebflowElement object
    // Other elements are represented by their IDs and class names only

    // Create mock roles by element with lightweight context awareness
    // This allows structural validation in wrapper detection
    const rolesByElement: RolesByElement = {};

    // Note: Not using full role detection service for lightweight context

    // We need to populate rolesByElement with roles for the lightweight context elements
    // so that structural validation can work properly

    // First pass: detect roles for all elements in lightweight context using naming-only
    const tempRolesByElement: RolesByElement = {};
    const allSnapshots: { id: string; snapshot: any }[] = [];

    // Create snapshots for all elements in lightweight context
    for (const availableElementId of lightweightContext.availableElements) {
      if (availableElementId === elementId) {
        // Main target element
        allSnapshots.push({
          id: elementId,
          snapshot: {
            id: elementId,
            classes: elementsWithClassNames[0].classNames,
            tagName: "div",
            parentId: lightweightGraph.getParentId(elementId),
            childrenIds: lightweightGraph.getChildrenIds(elementId),
            attributes: {},
          },
        });
      } else {
        // Other elements in context - use their class names from lightweight context
        const classNames =
          lightweightContext.elementClassNames.get(availableElementId) || [];
        allSnapshots.push({
          id: availableElementId,
          snapshot: {
            id: availableElementId,
            classes: classNames,
            tagName: "div",
            parentId: lightweightGraph.getParentId(availableElementId),
            childrenIds: lightweightGraph.getChildrenIds(availableElementId),
            attributes: {},
          },
        });
      }
    }

    // First pass: basic role detection without structural context
    const basicContext = {
      rolesByElement: {},
      graph: lightweightGraph,
      allElements: [],
      styleInfo: [],
      pageInfo: {},
    };

    for (const { id, snapshot } of allSnapshots) {
      for (const detector of roleDetectors) {
        try {
          const scored = detector.detect(snapshot, basicContext);
          if (scored && scored.score > 0.5) {
            tempRolesByElement[id] = scored.role;
            break;
          }
        } catch (error) {
          console.warn(
            `[LightweightContext] Basic detection failed for ${id}:`,
            error
          );
        }
      }

      // Default to unknown if no role detected
      if (!tempRolesByElement[id]) {
        tempRolesByElement[id] = "unknown";
      }
    }

    // Second pass: re-detect ALL elements with structural context (subtree-boundary)
    const structuralContext = {
      rolesByElement: tempRolesByElement,
      graph: lightweightGraph,
      allElements: [],
      styleInfo: [],
      pageInfo: {},
    };

    for (const { id, snapshot } of allSnapshots) {
      try {
        let bestScore = -1;
        let bestRole: string | null = null;
        for (const detector of roleDetectors) {
          const scored = detector.detect(snapshot, structuralContext);
          if (scored && scored.score > bestScore) {
            bestScore = scored.score;
            bestRole = scored.role;
          }
        }
        rolesByElement[id] = (bestRole ??
          tempRolesByElement[id] ??
          "unknown") as any;
      } catch (error) {
        console.warn(
          `[LightweightContext] Structural detection failed for ${id}:`,
          error
        );
        rolesByElement[id] = (tempRolesByElement[id] ?? "unknown") as any;
      }
    }

    // Ensure a component boundary exists within the subtree. If none detected,
    // promote the selected element to act as the component root boundary so
    // structural rules (e.g., child group key match) can operate within scope.
    const hasComponentRoot = Object.values(rolesByElement).some(
      (r) => r === "componentRoot"
    );
    if (!hasComponentRoot) {
      rolesByElement[elementId] = "componentRoot" as any;
    }

    // Create element style map for subtree
    const elementStyleMap = new Map<string, StyleWithElement[]>();
    for (const s of elementStyles) {
      const list = elementStyleMap.get(s.elementId) ?? [];
      list.push(s);
      elementStyleMap.set(s.elementId, list);
    }

    // Create element type maps (minimal for performance)
    const tagByElementId = new Map<string, string | null>();
    tagByElementId.set(elementId, null); // Don't fetch tags in lightweight mode
    const elementTypeByElementId = new Map<string, string | null>();
    elementTypeByElementId.set(elementId, null); // Don't fetch types in lightweight mode

    const context: LintContext = {
      allStyles,
      rolesByElement,
      graph: lightweightGraph,
      elementStyleMap,
      elementsWithClassNames,
      signature: `lightweight:${elementId}:${useStructural}`,
      activePreset,
      parseClass,
      tagByElementId,
      elementTypeByElementId,
    };

    console.log(`[DEBUG] Final lightweight context for element ${elementId}:`, {
      targetRole: rolesByElement[elementId],
      allRoles: rolesByElement,
      availableElements: Array.from(lightweightContext.availableElements),
      elementStyleMapKeys: Array.from(elementStyleMap.keys()),
      sectionRootId: lightweightContext.sectionRootId,
    });

    return context;
  }

  function clearCache() {
    cachedContext = null;
    lastSignature = null;
    invalidatePageContextCache();
  }

  return {
    createContext,
    createElementContext,
    createElementContextWithStructural,
    clearCache,
  } as const;
}

export type LintContextServiceType = ReturnType<
  typeof createLintContextService
>;
