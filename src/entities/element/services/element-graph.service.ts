import type { WebflowElement } from "@/entities/element/model/element.types";
import { toElementKey, getElementTag } from "../lib/id";

export type ElementGraph = {
  getParentId: (id: string) => string | null;
  getChildrenIds: (id: string) => string[];
  getAncestorIds: (id: string) => string[];
  getDescendantIds: (id: string) => string[];
  getTag: (id: string) => Promise<string | null>;
};

export function createElementGraphService(
  elements: WebflowElement[],
  parentIdByChildId: Record<string, string | null>
): ElementGraph {
  const childrenByParentId = new Map<string, string[]>();
  const elementById = new Map<string, WebflowElement>();

  // Build element lookup and children maps
  for (const el of elements) {
    const id = toElementKey(el);
    elementById.set(id, el);
    if (!childrenByParentId.has(id)) childrenByParentId.set(id, []);
  }

  for (const [childId, parentId] of Object.entries(parentIdByChildId)) {
    if (parentId) {
      const list = childrenByParentId.get(parentId) ?? [];
      list.push(childId);
      childrenByParentId.set(parentId, list);
    }
  }

  const getParentId = (id: string): string | null =>
    parentIdByChildId[id] ?? null;
  const getChildrenIds = (id: string): string[] =>
    childrenByParentId.get(id) ?? [];
  const getAncestorIds = (id: string): string[] => {
    const out: string[] = [];
    let cur: string | null = getParentId(id);
    while (cur) {
      out.push(cur);
      cur = getParentId(cur);
    }
    return out;
  };
  const getDescendantIds = (id: string): string[] => {
    const result: string[] = [];
    const visited = new Set<string>();

    function collectDescendants(currentId: string) {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const children = getChildrenIds(currentId);
      for (const childId of children) {
        result.push(childId);
        collectDescendants(childId);
      }
    }

    collectDescendants(id);
    return result;
  };

  const getTag = async (id: string): Promise<string | null> => {
    const element = elementById.get(id);
    if (!element) return null;
    return await getElementTag(element);
  };

  return {
    getParentId,
    getChildrenIds,
    getAncestorIds,
    getDescendantIds,
    getTag,
  } as const;
}
