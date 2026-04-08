import type { ElementWithClassNames, WebflowElement } from "@/entities/element/model/element.types";
import { createElementGraphService, type ElementGraph } from "@/entities/element/services/element-graph.service";
import { createParentRelationshipService } from "@/entities/element/services/parent-relationship.service";

import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import { buildPlacedComponentSubtreeElementIds } from "@/features/linter/lib/is-element-under-placed-component-instance";
import { getCurrentPreset } from "@/features/linter/model/linter.factory";
import type { RoleDetectionConfig, RolesByElement } from "@/features/linter/model/linter.types";
import type { RoleDetector } from "@/features/linter/model/preset.types";
import { resolvePresetOrFallback } from "@/features/linter/presets";
import { createRoleDetectionService } from "@/features/linter/services/role-detection.service";

// Cache for page lint context to improve performance for page mode
let cachedPageContext: LintContext | null = null;

/**
 * createContext() memo: signature → last built LintContext. Must be cleared together with
 * cachedPageContext when the canvas changes; previously only cachedPageContext was nulled
 * and stale graphs could be reused after deleting elements (e.g. components).
 */
let cachedLintContext: LintContext | null = null;
let lastLintContextSignature: string | null = null;

/**
 * Set page context cache for page mode performance
 */
export function setPageContextCache(context: LintContext): void {
  cachedPageContext = context;
}

/**
 * Get cached page context if available (for page mode performance)
 */
export function getPageContextCache(): LintContext | null {
  return cachedPageContext;
}

/**
 * Invalidate all lint context caches when the page/canvas changes or before a fresh scan.
 */
export function invalidatePageContextCache(): void {
  cachedPageContext = null;
  cachedLintContext = null;
  lastLintContextSignature = null;
  resetVariableNameMapCache();
}

import { toElementKey } from "@/entities/element/lib/id";
import type { StyleInfo, StyleWithElement } from "@/entities/style/model/style.types";
import type { StyleService } from "@/entities/style/services/style.service";
import { getVariableNameByIdMap, resetVariableNameMapCache } from "@/entities/style/services/variable-name-map";
import { createDebugger } from "@/shared/utils/debug";

export interface LintContext {
  allStyles: StyleInfo[];
  rolesByElement: RolesByElement;
  graph: ElementGraph;
  elementStyleMap: Map<string, StyleWithElement[]>;
  elementsWithClassNames: ElementWithClassNames[];
  signature: string;
  activePreset: ReturnType<typeof resolvePresetOrFallback>;
  parseClass: (name: string) => any;
  grammarElementSeparator: string;
  /** Webflow variable id → display name for lint messages */
  variableNameById: ReadonlyMap<string, string>;
  tagByElementId: Map<string, string | null>;
  elementTypeByElementId: Map<string, string | null>;
  /** For ComponentInstance elements: element key → component definition id (Designer API) */
  componentIdByElementId: Map<string, string>;
  /** Every element id at or under a placed instance root (graph-backed; used for reliable “inside component” checks). */
  placedComponentSubtreeElementIds: ReadonlySet<string>;
}

export interface LintContextService {
  createContext(elements: WebflowElement[]): Promise<LintContext>;
  createElementContext(element: WebflowElement, pageContext?: LintContext): Promise<LintContext>;
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
  const filtered = elements.filter((el: any) => {
    const hasGetStyles = el && typeof el.getStyles === "function";

    // Also include page slots (no element type but has component+element ID structure)
    const hasComponentElementId = el?.id?.component && el?.id?.element;
    const hasNoType = !el.type || el.type === "";
    const isPageSlot = hasComponentElementId && hasNoType;

    const isComponentInstance = el?.type === "ComponentInstance";

    const shouldInclude = hasGetStyles || isPageSlot || isComponentInstance;

    return shouldInclude;
  });

  return filtered;
}

/**
 * Resolves each ComponentInstance to a component definition id for catalog lookups.
 * Uses `element.getComponent()` when available so ids align with `webflow.getAllComponents()`.
 */
async function buildComponentDefinitionIdByElementId(allValidElements: WebflowElement[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const el of allValidElements) {
    if ((el as any)?.type !== "ComponentInstance") continue;
    const id = toElementKey(el);
    let defId: string | null = null;
    if (typeof (el as any).getComponent === "function") {
      try {
        const comp = await (el as any).getComponent();
        if (comp?.id != null) defId = String(comp.id);
      } catch {
        /* fall through to id.component */
      }
    }
    if (defId == null && (el as any)?.id?.component != null) {
      defId = String((el as any).id.component);
    }
    if (defId != null) out.set(id, defId);
  }
  return out;
}

/**
 * Tries to get class names from a slot element via DOM access
 * Webflow slots don't have getStyles(), but may have getDomElement()
 */
async function getClassesFromDomElement(element: any): Promise<StyleInfo[]> {
  try {
    // Method 1: Try getDomElement() API (Webflow Designer API)
    if (typeof element?.getDomElement === "function") {
      const domEl = await element.getDomElement();
      if (domEl?.classList) {
        const classNames = Array.from(domEl.classList) as string[];
        return classNames.map((name, index) => ({
          id: `slot-class-${name}`,
          name,
          properties: {},
          order: index,
          isCombo: false,
        }));
      }
    }

    // Method 2: Check for className property directly
    if (element?.className && typeof element.className === "string") {
      const classNames = element.className.split(/\s+/).filter(Boolean);
      return classNames.map((name: string, index: number) => ({
        id: `slot-class-${name}`,
        name,
        properties: {},
        order: index,
        isCombo: false,
      }));
    }

    // Method 3: Check for classes array property
    if (Array.isArray(element?.classes)) {
      return element.classes.map((name: string, index: number) => ({
        id: `slot-class-${name}`,
        name,
        properties: {},
        order: index,
        isCombo: false,
      }));
    }
  } catch (_error) {
    // Silently fail - slot classes are optional
  }

  return [];
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

export function createLintContextService(deps: { styleService: StyleService }): LintContextService {
  const { styleService } = deps;
  const debug = createDebugger("lint-context");

  async function createContext(elements: WebflowElement[]): Promise<LintContext> {
    if (!Array.isArray(elements)) {
      throw new Error("Elements must be an array");
    }

    debug.log("createContext: received elements count", elements.length);
    // 1) Filter valid elements
    const validElements = filterValidElements(elements);
    debug.log("createContext: validElements count", validElements.length);

    // 2) Resolve active preset once
    const activePreset = resolvePresetOrFallback(getCurrentPreset());
    const grammar = activePreset.grammar ?? lumosGrammar;
    const parseClass = (name: string) => grammar.parse(name);
    const roleDetectors: readonly RoleDetector[] = activePreset.roleDetectors ?? [];
    const roleDetectionConfig: RoleDetectionConfig | undefined = activePreset.roleDetectionConfig;

    // 3) Load site-wide styles
    const allStyles: StyleInfo[] = await styleService.getAllStylesWithProperties();
    debug.log("createContext: loaded allStyles count", allStyles.length);

    // 4) Collect applied styles with normalized element ids
    const elementStylePairs = await Promise.all(
      validElements.map(async (element) => {
        const elementId = toElementKey(element);

        // For elements without getStyles (like page slots), try alternative methods
        let applied: StyleInfo[];
        if (typeof (element as any).getStyles === "function") {
          applied = await styleService.getAppliedStyles(element);
        } else {
          // Try to get classes from DOM element for slots
          applied = await getClassesFromDomElement(element);
        }

        const styles: StyleWithElement[] = applied.map((s) => ({
          ...s,
          elementId,
        }));
        return { element, styles };
      })
    );

    // 5) Build parent relationships and discover slot children
    const parentRelationshipService = createParentRelationshipService();
    const { parentIdByChildId, discoveredElements } =
      await parentRelationshipService.buildParentChildMapWithDiscovery(validElements);
    debug.log("createContext: parent map size", Object.keys(parentIdByChildId).length);
    debug.log("createContext: discovered slot children", discoveredElements.length);

    // 5b) Process discovered elements (slot children) for styles
    const discoveredStylePairs = await Promise.all(
      discoveredElements.map(async (element) => {
        const elementId = toElementKey(element);

        let applied: StyleInfo[];
        if (typeof (element as any).getStyles === "function") {
          applied = await styleService.getAppliedStyles(element);
        } else {
          applied = await getClassesFromDomElement(element);
        }

        const styles: StyleWithElement[] = applied.map((s) => ({
          ...s,
          elementId,
        }));
        return { element, styles };
      })
    );

    // Merge discovered elements into the main lists
    const allElementStylePairs = [...elementStylePairs, ...discoveredStylePairs];
    const allValidElements = [...validElements, ...discoveredElements];

    // 6) Create signature for caching
    const signature = createSignature(allElementStylePairs, parentIdByChildId);

    const variableNameById = await getVariableNameByIdMap();

    // 7) Check cache (always refresh variable names — not part of element/style signature)
    if (cachedLintContext && lastLintContextSignature === signature) {
      debug.log("createContext: cache hit", signature);
      return { ...cachedLintContext, variableNameById };
    }

    // 8) Build ElementWithClassNames for role detection
    const elementsWithClassNames: ElementWithClassNames[] = allElementStylePairs.map((pair) => ({
      element: pair.element,
      classNames: pair.styles.map((s) => s.name).filter((n) => n.trim() !== ""),
    }));

    // 9) Create element graph first (needed for structural role detection)
    const graph = createElementGraphService(allValidElements, parentIdByChildId);
    debug.log("createContext: graph created with", allValidElements.length, "nodes");

    // 10) Detect roles with graph context for structural analysis
    const roleDetection = createRoleDetectionService({
      detectors: [...roleDetectors],
      config: roleDetectionConfig,
    });
    const rolesByElement: RolesByElement = roleDetection.detectRolesForPage(elementsWithClassNames, graph);

    // 11) Collect tag information (for semantic HTML validation)
    const tagByElementId = new Map<string, string | null>();
    await Promise.all(
      allElementStylePairs.map(async ({ element }) => {
        const id = toElementKey(element);
        try {
          const tag = await graph.getTag(id);
          tagByElementId.set(id, tag);
        } catch (_error) {
          tagByElementId.set(id, null);
        }
      })
    );

    // 12) Collect element type information (for Webflow element type checks)
    const elementTypeByElementId = new Map<string, string | null>();
    for (const { element } of allElementStylePairs) {
      const id = toElementKey(element);
      try {
        // Use element.type from Webflow API
        const elementType = (element as any)?.type || null;
        elementTypeByElementId.set(id, elementType);
      } catch (_error) {
        elementTypeByElementId.set(id, null);
      }
    }

    // 12b) Component instances (no styles): map element → component definition id for page rules.
    // Prefer `getComponent()` so the id matches `getAllComponents()` / `getComponent(id)` catalog keys.
    const componentIdByElementId = await buildComponentDefinitionIdByElementId(allValidElements);
    const placedComponentSubtreeElementIds = buildPlacedComponentSubtreeElementIds(graph, componentIdByElementId);

    // 13) Create element style map for quick lookup
    const elementStyleMap = new Map<string, StyleWithElement[]>();
    for (const pair of allElementStylePairs) {
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
      grammarElementSeparator: grammar.elementSeparator,
      variableNameById,
      tagByElementId,
      elementTypeByElementId,
      componentIdByElementId,
      placedComponentSubtreeElementIds,
    };

    // Cache for future use
    cachedLintContext = context;
    lastLintContextSignature = signature;

    // Also set in lightweight context cache for page mode performance
    setPageContextCache(context);
    debug.log("createContext: context created signature", signature);

    return context;
  }

  async function createElementContext(element: WebflowElement, pageContext?: LintContext): Promise<LintContext> {
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
      debug.log("createElementContextWithStructural: structural off, isolated context");
      return await createContext([element]);
    }

    // For structural context without page context, we need a scoped, page-like context: prefer a
    // semantic section, else the enclosing placed component (nav/header often has no section role).

    try {
      // Access Webflow Designer API
      const wf = (window as any).webflow;
      if (!wf || typeof wf.getAllElements !== "function") {
        debug.warn("createElementContextWithStructural: webflow API unavailable or getAllElements missing");
        return await createContext([element]);
      }

      const allElements = await wf.getAllElements();
      if (!Array.isArray(allElements) || allElements.length === 0) {
        debug.warn("createElementContextWithStructural: page getAllElements empty");
        return await createContext([element]);
      }

      // Create full page context and then scope it down to the section
      const fullPageContext = await createContext(allElements);

      // Now find the section that contains our target element and scope down
      const elementId = toElementKey(element);
      if (!elementId) {
        debug.warn("createElementContextWithStructural: toElementKey returned empty for element");
        return await createContext([element]);
      }

      const sectionId = findSectionContainingElement(elementId, fullPageContext);
      if (sectionId) {
        debug.log("createElementContextWithStructural: scoped to section", sectionId);
        return createScopedContextForSection(sectionId, fullPageContext);
      }

      const placedRootId = findEnclosingPlacedComponentRoot(elementId, fullPageContext);
      if (placedRootId) {
        debug.log("createElementContextWithStructural: scoped to placed component", placedRootId);
        return createScopedContextForSection(placedRootId, fullPageContext);
      }

      debug.log("createElementContextWithStructural: no section or placed component scope, using fullPageContext");
      return fullPageContext;
    } catch (error) {
      debug.error("createElementContextWithStructural: unexpected error", error);
      return await createContext([element]);
    }
  }

  // Helper function to find the section containing an element
  function findSectionContainingElement(elementId: string, context: LintContext): string | null {
    // Check if the element itself is a section
    const elementRole = context.rolesByElement[elementId];
    if (elementRole === "section" || elementRole === "main") {
      return elementId;
    }

    // Walk up the ancestor chain to find a section
    const ancestors = context.graph.getAncestorIds(elementId);
    for (const ancestorId of ancestors) {
      const role = context.rolesByElement[ancestorId];
      if (role === "section" || role === "main") {
        return ancestorId;
      }
    }

    return null;
  }

  /** Nearest ancestor (or self) that is a placed `ComponentInstance` root in `componentIdByElementId`. */
  function findEnclosingPlacedComponentRoot(elementId: string, context: LintContext): string | null {
    const map = context.componentIdByElementId;
    if (map.has(elementId)) return elementId;
    let cur: string | null = context.graph.getParentId(elementId);
    while (cur) {
      if (map.has(cur)) return cur;
      cur = context.graph.getParentId(cur);
    }
    return null;
  }

  // Helper: scope styles/roles to a subtree (section, main, or placed component root).
  function createScopedContextForSection(sectionId: string, fullContext: LintContext): LintContext {
    // Get all descendants of the section
    const sectionDescendants = fullContext.graph.getDescendantIds?.(sectionId) || [];
    const sectionElementIds = new Set([sectionId, ...sectionDescendants]);

    // Filter styles to only include elements in the section
    const sectionStyles = Array.from(fullContext.elementStyleMap.entries())
      .filter(([elementId]) => sectionElementIds.has(elementId))
      .reduce((map, [elementId, styles]) => {
        map.set(elementId, styles);
        return map;
      }, new Map());

    // Filter roles to only include elements in the section
    const sectionRoles: Record<string, any> = {};
    for (const elementId of sectionElementIds) {
      if (fullContext.rolesByElement[elementId]) {
        sectionRoles[elementId] = fullContext.rolesByElement[elementId];
      }
    }

    // Filter elementsWithClassNames to only include section elements
    const sectionElementsWithClassNames = fullContext.elementsWithClassNames.filter((item) =>
      sectionElementIds.has(toElementKey(item.element))
    );

    // Return scoped context
    return {
      ...fullContext,
      elementStyleMap: sectionStyles,
      rolesByElement: sectionRoles,
      elementsWithClassNames: sectionElementsWithClassNames,
      signature: `scoped:${sectionId}:${fullContext.signature}`,
    };
  }

  function clearCache() {
    invalidatePageContextCache();
  }

  return {
    createContext,
    createElementContext,
    createElementContextWithStructural,
    clearCache,
  } as const;
}

export type LintContextServiceType = ReturnType<typeof createLintContextService>;
