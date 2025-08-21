import type { WebflowElement } from "@/entities/element/model/element.types";
import { toElementKey } from "@/entities/element/lib/id";
import { createElementGraphService } from "@/entities/element/services/element-graph.service";
import { createParentRelationshipService } from "@/entities/element/services/parent-relationship.service";
import type { LintContext } from "@/features/linter/services/lint-context.service";

export interface LightweightStructuralContext {
  /** Target element ID */
  targetElementId: string;
  /** Map of element ID to parent ID (limited scope) */
  parentMap: Record<string, string | null>;
  /** Map of element ID to children IDs (limited scope) */
  childrenMap: Record<string, string[]>;
  /** Map of element ID to ancestor IDs (limited scope) */
  ancestorMap: Record<string, string[]>;
  /** Available elements in the lightweight context */
  availableElements: Set<string>;
  /** Lookup of element ID to actual WebflowElement for style resolution */
  elementById: Map<string, WebflowElement>;
  /** Map of element ID to class names for role detection */
  elementClassNames: Map<string, string[]>;
  /** Section root element ID if found (defines component boundary) */
  sectionRootId: string | null;
}

/**
 * Cache for page lint context to improve performance for page mode
 * This is ONLY used by page lint mode, not element lint mode
 */
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

/**
 * Find the section element that represents a component boundary.
 * Walks up the ancestor chain to find a section element.
 */
async function findSectionRoot(
  element: WebflowElement
): Promise<WebflowElement | null> {
  let current: WebflowElement | null = element;

  while (current) {
    try {
      // Check if current element is a section
      const styles = await (current as any).getStyles?.();
      const classNames = (styles || [])
        .map((style: any) => style.name)
        .filter((name: string) => name && name.trim() !== "");

      // Check for section patterns across presets
      const isSection = classNames.some(
        (name: string) =>
          name === "u-section" ||
          /^section[_-]/.test(name) ||
          name === "page_main" // Lumos main pattern
      );

      if (isSection || (current as any).tagName?.toLowerCase() === "section") {
        return current;
      }

      // Move to parent
      current = await (current as any).getParent?.();
    } catch {
      // If we can't access parent or styles, break the chain
      break;
    }
  }

  return null;
}

/**
 * Recursively gather all descendants of an element
 */
async function gatherDescendants(
  element: WebflowElement,
  visited: Set<string>
): Promise<WebflowElement[]> {
  const descendants: WebflowElement[] = [];
  const elementId = toElementKey(element);

  if (!elementId || visited.has(elementId)) {
    return descendants;
  }

  visited.add(elementId);

  try {
    const children = await (element as any).getChildren?.();
    if (Array.isArray(children)) {
      for (const child of children) {
        const childId = toElementKey(child);
        if (childId && !visited.has(childId)) {
          descendants.push(child);
          // Recursively get grandchildren
          const grandchildren = await gatherDescendants(child, visited);
          descendants.push(...grandchildren);
        }
      }
    }
  } catch {
    // Children access failed
  }

  return descendants;
}

/**
 * Creates a lightweight structural context for a target element.
 *
 * Strategy:
 * 1. Find the section root (component boundary) and walk from there
 * 2. Include the target element and its structural context within the section
 *
 * This provides proper component boundary detection for child group rules.
 */
export async function createLightweightStructuralContext(
  targetElement: WebflowElement
): Promise<LightweightStructuralContext | null> {
  try {
    const targetElementId = toElementKey(targetElement);
    if (!targetElementId) return null;

    console.log(
      `[LightweightContext] Building subtree-based context for element ${targetElementId}`
    );

    const elements: WebflowElement[] = [];
    const elementIds = new Set<string>();
    const elementById = new Map<string, WebflowElement>();

    // Component boundary is the selected element; include it and all descendants
    elements.push(targetElement);
    elementIds.add(targetElementId);
    elementById.set(targetElementId, targetElement);
    const visited = new Set<string>();
    const descendants = await gatherDescendants(targetElement, visited);
    for (const descendant of descendants) {
      const descendantId = toElementKey(descendant);
      if (descendantId && !elementIds.has(descendantId)) {
        elements.push(descendant);
        elementIds.add(descendantId);
        elementById.set(descendantId, descendant);
      }
    }

    // Mark the boundary root as the selected element
    const sectionRootId: string | null = targetElementId;

    // Build parent relationships for the scope
    const parentRelationshipService = createParentRelationshipService();
    const parentIdByChildId =
      await parentRelationshipService.buildParentChildMap(elements);

    // Create element graph for the scope
    const graph = createElementGraphService(elements, parentIdByChildId);

    // Build maps for easy access
    const childrenMap: Record<string, string[]> = {};
    const ancestorMap: Record<string, string[]> = {};
    const elementClassNames = new Map<string, string[]>();

    for (const elementId of elementIds) {
      childrenMap[elementId] = graph.getChildrenIds(elementId);
      ancestorMap[elementId] = graph.getAncestorIds(elementId);
    }

    // Collect class names for each element (needed for role detection)
    for (const element of elements) {
      const elementId = toElementKey(element);
      if (elementId) {
        try {
          const styles = await (element as any).getStyles?.();
          const classNames = (styles || [])
            .map((style: any) => style.name)
            .filter((name: string) => name && name.trim() !== "");
          elementClassNames.set(elementId, classNames);
        } catch {
          // If we can't get styles, set empty array
          elementClassNames.set(elementId, []);
        }
      }
    }

    console.log(
      `[LightweightContext] Built context with ${elementIds.size} elements for ${targetElementId}`
    );

    return {
      targetElementId,
      parentMap: parentIdByChildId,
      childrenMap,
      ancestorMap,
      availableElements: elementIds,
      elementById,
      elementClassNames,
      sectionRootId,
    };
  } catch (error) {
    console.warn(
      "[LightweightContext] Failed to create lightweight context:",
      error
    );
    return null;
  }
}

/**
 * Creates a mock graph API that uses the lightweight context
 */
export function createLightweightGraphApi(
  context: LightweightStructuralContext
) {
  return {
    getParentId: (elementId: string): string | null => {
      return context.parentMap[elementId] ?? null;
    },
    getChildrenIds: (elementId: string): string[] => {
      return context.childrenMap[elementId] ?? [];
    },
    getAncestorIds: (elementId: string): string[] => {
      return context.ancestorMap[elementId] ?? [];
    },
    getTag: (): Promise<string | null> => {
      // For lightweight context, we don't fetch tags to avoid performance overhead
      // This is acceptable since wrapper detection primarily relies on structure
      return Promise.resolve(null);
    },
    getDescendantIds: (elementId: string): string[] => {
      // Simple implementation: get all descendants by recursively walking children
      const descendants: string[] = [];
      const queue = [...(context.childrenMap[elementId] ?? [])];

      while (queue.length > 0) {
        const childId = queue.shift();
        if (childId && !descendants.includes(childId)) {
          descendants.push(childId);
          queue.push(...(context.childrenMap[childId] ?? []));
        }
      }

      return descendants;
    },
  };
}
