import type { WebflowElement } from "@/entities/element/model/element.types";
import { toElementKey } from "../lib/id";

export interface ParentRelationshipService {
  buildParentChildMap: (
    elements: WebflowElement[]
  ) => Promise<Record<string, string | null>>;
}

/**
 * Creates a service to build parent-child relationships using Webflow's getChildren() API
 * This addresses the limitation that elements don't have a reliable getParent() method
 */
export function createParentRelationshipService(): ParentRelationshipService {
  async function buildParentChildMap(
    elements: WebflowElement[]
  ): Promise<Record<string, string | null>> {
    const parentIdByChildId: Record<string, string | null> = {};
    const elementIdSet = new Set(
      elements.map((element) => toElementKey(element))
    );

    // Initialize all elements with null parent
    for (const element of elements) {
      parentIdByChildId[toElementKey(element)] = null;
    }

    // Build parent-child relationships by traversing from each element using getChildren()
    for (const element of elements) {
      const parentId = toElementKey(element);

      // Check if element has getChildren method
      if (typeof (element as any).getChildren === "function") {
        try {
          const children = await (element as any).getChildren();

          if (Array.isArray(children)) {
            for (const child of children) {
              const childId = toElementKey(child);
              // Only map if the child is in our elements set
              if (elementIdSet.has(childId)) {
                parentIdByChildId[childId] = parentId;
              }
            }
          }
        } catch (error) {
          // getChildren() errors are non-fatal; continue with other elements
          console.warn(
            `[ParentRelationshipService] getChildren error for element ${parentId}:`,
            error
          );
        }
      }
    }

    return parentIdByChildId;
  }

  return {
    buildParentChildMap,
  } as const;
}

export type ParentRelationshipServiceType = ReturnType<
  typeof createParentRelationshipService
>;
