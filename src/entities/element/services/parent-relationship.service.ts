import type { WebflowElement } from "@/entities/element/model/element.types";
import { toElementKey } from "../lib/id";

export interface ParentChildMapResult {
  parentIdByChildId: Record<string, string | null>;
  discoveredElements: WebflowElement[];
}

export interface ParentRelationshipService {
  buildParentChildMap: (elements: WebflowElement[]) => Promise<Record<string, string | null>>;
  buildParentChildMapWithDiscovery: (elements: WebflowElement[]) => Promise<ParentChildMapResult>;
}

/**
 * Creates a service to build parent-child relationships using Webflow's getChildren() API
 * This addresses the limitation that elements don't have a reliable getParent() method
 */
export function createParentRelationshipService(): ParentRelationshipService {
  async function buildParentChildMapWithDiscovery(
    elements: WebflowElement[],
    existingMap: Record<string, string | null> = {}
  ): Promise<ParentChildMapResult> {
    const parentIdByChildId: Record<string, string | null> = { ...existingMap };
    const elementIdSet = new Set(elements.map((element) => toElementKey(element)));
    const discoveredElements: WebflowElement[] = [];

    // Initialize elements with null parent ONLY if not already in the map
    for (const element of elements) {
      const key = toElementKey(element);
      if (!(key in parentIdByChildId)) {
        parentIdByChildId[key] = null;
      }
    }

    // Debug: Log all elements being processed
    console.log(`[ParentRelationshipService] Processing ${elements.length} elements:`);
    for (const el of elements) {
      const elType = (el as any)?.type || "(empty/slot)";
      console.log(`  - ${toElementKey(el)}: ${elType}`);
    }

    // Build parent-child relationships by traversing from each element using getChildren()
    // Also discover children that weren't in the original elements set (e.g., slot children)
    for (const element of elements) {
      const parentId = toElementKey(element);
      const elementType = (element as any)?.type || "(empty/slot)";
      const isSlot = !elementType || elementType === "(empty/slot)";

      // Debug: Log slot elements
      if (isSlot) {
        console.log(`[ParentRelationshipService] Processing slot element: ${parentId}`);
      }

      // Check if element has getChildren method
      if (typeof (element as any).getChildren === "function") {
        try {
          const children = await (element as any).getChildren();

          // Debug: Log children for slots
          if (isSlot) {
            console.log(
              `[ParentRelationshipService] Slot ${parentId} getChildren returned:`,
              Array.isArray(children) ? children.length : children
            );
          }

          if (Array.isArray(children)) {
            for (const child of children) {
              const childId = toElementKey(child);
              const childType = (child as any)?.type || "(empty/slot)";

              // Always map the parent-child relationship
              parentIdByChildId[childId] = parentId;

              // Debug: Log discovered children
              if (isSlot) {
                console.log(`[ParentRelationshipService] Slot child found: ${childId} (type: ${childType})`);
              }

              // Track elements that weren't in the original set (discovered from slots)
              if (!elementIdSet.has(childId)) {
                elementIdSet.add(childId);
                discoveredElements.push(child);
                console.log(`[ParentRelationshipService] Discovered new element: ${childId} (type: ${childType})`);
              }
            }
          }
        } catch (error) {
          // getChildren() errors are non-fatal; continue with other elements
          console.warn(`[ParentRelationshipService] getChildren error for element ${parentId}:`, error);
        }
      } else if (isSlot) {
        // Slot doesn't have getChildren - log this
        console.log(`[ParentRelationshipService] Slot ${parentId} has NO getChildren method`);
      }
    }

    // Recursively process discovered elements to find their children too
    if (discoveredElements.length > 0) {
      // Pass the current map so discovered elements keep their parent relationships
      const nested = await buildParentChildMapWithDiscovery(discoveredElements, parentIdByChildId);
      // Merge nested discoveries (nested map already includes current map)
      Object.assign(parentIdByChildId, nested.parentIdByChildId);
      discoveredElements.push(...nested.discoveredElements);
    }

    // Debug: Log final parent-child relationships
    console.log(`[ParentRelationshipService] Final parent-child map:`);
    for (const [childId, parentId] of Object.entries(parentIdByChildId)) {
      if (parentId) {
        console.log(`  ${childId} -> parent: ${parentId}`);
      }
    }
    console.log(`[ParentRelationshipService] Total discovered: ${discoveredElements.length}`);

    return { parentIdByChildId, discoveredElements };
  }

  // Legacy method for backwards compatibility
  async function buildParentChildMap(elements: WebflowElement[]): Promise<Record<string, string | null>> {
    const result = await buildParentChildMapWithDiscovery(elements);
    return result.parentIdByChildId;
  }

  return {
    buildParentChildMap,
    buildParentChildMapWithDiscovery,
  } as const;
}

export type ParentRelationshipServiceType = ReturnType<typeof createParentRelationshipService>;
