import type { WebflowElement } from "@/entities/element/model/element-context.types";

export type ElementGraph = {
  getParentId: (id: string) => string | null;
  getChildrenIds: (id: string) => string[];
  getAncestorIds: (id: string) => string[];
};

export function createElementGraphService(
  elements: WebflowElement[],
  parentIdByChildId: Record<string, string | null>
): ElementGraph {
  const childrenByParentId = new Map<string, string[]>();

  for (const el of elements) {
    const id = String(
      ((el as any)?.id && ((el as any).id as any).element) ||
        (el as any)?.id ||
        (el as any)?.nodeId ||
        ""
    );
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

  return { getParentId, getChildrenIds, getAncestorIds } as const;
}
