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
// Cache for page lint context to improve performance for page mode
let cachedPageContext: LintContext | null = null;

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
 * Invalidate page context cache when page changes
 */
export function invalidatePageContextCache(): void {
  cachedPageContext = null;
}
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
  const filtered = elements.filter((el: any) => {
    const hasGetStyles = el && typeof el.getStyles === "function";
    
    // Also include page slots (no element type but has component+element ID structure)
    const hasComponentElementId = el?.id?.component && el?.id?.element;
    const hasNoType = !el.type || el.type === "";
    const isPageSlot = hasComponentElementId && hasNoType;
    
    const shouldInclude = hasGetStyles || isPageSlot;
    
    return shouldInclude;
  });
  
  return filtered;
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
        const elementId = toElementKey(element);
        
        // For elements without getStyles (like page slots), return empty styles
        let applied: StyleInfo[];
        if (typeof (element as any).getStyles === "function") {
          applied = await styleService.getAppliedStyles(element);
        } else {
          applied = []; // Page slots typically have no styles
        }
        
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

    // For structural context without page context, we need to create a page-like context
    // since we can't traverse parent relationships from a single element

    try {
      // Get all elements on the page via Webflow API
      const wf = (window as any).webflow;
      if (!wf || typeof wf.getAllElements !== "function") {
        return await createContext([element]);
      }

      const allElements = await wf.getAllElements();
      if (!Array.isArray(allElements) || allElements.length === 0) {
        return await createContext([element]);
      }

      // Create full page context and then scope it down to the section
      const fullPageContext = await createContext(allElements);

      // Now find the section that contains our target element and scope down
      const elementId = toElementKey(element);
      if (!elementId) {
        return await createContext([element]);
      }

      // Find the section containing this element using the page context graph
      const sectionId = findSectionContainingElement(
        elementId,
        fullPageContext
      );
      if (!sectionId) {
        return fullPageContext;
      }

      // Create scoped context for just the section
      return createScopedContextForSection(sectionId, fullPageContext);
    } catch (error) {
      return await createContext([element]);
    }
  }

  // Helper function to find the section containing an element
  function findSectionContainingElement(
    elementId: string,
    context: LintContext
  ): string | null {
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

  // Helper function to create a scoped context for a specific section
  function createScopedContextForSection(
    sectionId: string,
    fullContext: LintContext
  ): LintContext {
    // Get all descendants of the section
    const sectionDescendants =
      fullContext.graph.getDescendantIds?.(sectionId) || [];
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
    const sectionElementsWithClassNames =
      fullContext.elementsWithClassNames.filter((item) =>
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
