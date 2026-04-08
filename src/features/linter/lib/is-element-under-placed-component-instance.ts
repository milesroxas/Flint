/**
 * Detect whether linting should treat `elementId` as inside a component: placed instance on the canvas
 * **or** editing a component definition in the Designer (`getCurrentComponent()`).
 *
 * Signals (first match wins):
 * - `isEditingComponentDefinition` (Designer component edit mode; not a canvas instance)
 * - `placedComponentSubtreeElementIds` contains `elementId`
 * - An ancestor id is in `componentIdByElementId`
 * - `getElementType(ancestorId) === "ComponentInstance"` on an ancestor
 */

export type PlacedComponentDetectionDeps = {
  getParentId?: (id: string) => string | null;
  getAncestorIds?: (id: string) => string[];
  getElementType?: (id: string) => string | null;
  componentIdByElementId?: ReadonlyMap<string, string>;
  /**
   * All element ids at or under each placed instance root (from lint context graph + `componentIdByElementId` keys).
   */
  placedComponentSubtreeElementIds?: ReadonlySet<string>;
  /**
   * Designer is editing a component definition (`webflow.getCurrentComponent()`), not only the page canvas.
   */
  isEditingComponentDefinition?: boolean;
};

/** Precompute ids for every node in each placed component subtree (O(nodes) once per lint context). */
export function buildPlacedComponentSubtreeElementIds(
  graph: { getDescendantIds: (id: string) => string[] },
  componentIdByElementId: ReadonlyMap<string, string>
): Set<string> {
  const out = new Set<string>();
  for (const rootId of componentIdByElementId.keys()) {
    out.add(rootId);
    for (const d of graph.getDescendantIds(rootId)) {
      out.add(d);
    }
  }
  return out;
}

export function isElementUnderPlacedComponentInstance(elementId: string, deps: PlacedComponentDetectionDeps): boolean {
  if (deps.isEditingComponentDefinition) {
    return true;
  }

  if (deps.placedComponentSubtreeElementIds?.has(elementId)) {
    return true;
  }

  const { getParentId, getAncestorIds, getElementType, componentIdByElementId } = deps;

  const ancestors: string[] =
    typeof getAncestorIds === "function"
      ? getAncestorIds(elementId)
      : (() => {
          const out: string[] = [];
          if (!getParentId) return out;
          let cur: string | null = getParentId(elementId);
          while (cur) {
            out.push(cur);
            cur = getParentId(cur);
          }
          return out;
        })();

  for (const id of ancestors) {
    if (componentIdByElementId?.has(id)) return true;
    if (getElementType?.(id) === "ComponentInstance") return true;
  }
  return false;
}
