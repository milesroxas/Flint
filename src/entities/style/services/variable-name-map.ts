/**
 * Resolves Webflow variable ids to display names (Designer API).
 * Cached for the session; reset alongside style cache when site data may have changed.
 */

let cachedPromise: Promise<ReadonlyMap<string, string>> | null = null;

export function resetVariableNameMapCache(): void {
  cachedPromise = null;
}

async function buildVariableNameByIdMap(): Promise<ReadonlyMap<string, string>> {
  const map = new Map<string, string>();

  try {
    const wf = typeof webflow !== "undefined" ? webflow : undefined;
    if (!wf) return map;

    type VariableLike = { id: string; getName: () => Promise<string> };
    type CollectionLike = { getAllVariables?: () => Promise<VariableLike[]> };

    const collections: CollectionLike[] = [];

    if (typeof wf.getAllVariableCollections === "function") {
      const cols = await wf.getAllVariableCollections();
      for (const c of cols) collections.push(c as CollectionLike);
    } else if (typeof wf.getDefaultVariableCollection === "function") {
      const d = await wf.getDefaultVariableCollection();
      if (d) collections.push(d as CollectionLike);
    }

    for (const col of collections) {
      if (typeof col.getAllVariables !== "function") continue;
      const vars = await col.getAllVariables();
      for (const v of vars) {
        try {
          const n = await v.getName();
          if (n?.trim() && v.id) map.set(v.id, n.trim());
        } catch {
          /* skip */
        }
      }
    }
  } catch {
    /* Designer unavailable (tests / SSR) */
  }

  return map;
}

/**
 * Single-flight cached map of `variable-…` id → variable display name.
 */
export function getVariableNameByIdMap(): Promise<ReadonlyMap<string, string>> {
  if (!cachedPromise) {
    cachedPromise = buildVariableNameByIdMap();
  }
  return cachedPromise;
}
