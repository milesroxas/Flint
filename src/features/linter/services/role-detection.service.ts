import type {
  GrammarAdapter,
  ParsedClass,
  RoleDetectionConfig,
  RoleDetector,
  RolesByElement,
} from "@/features/linter/model/linter.types";
import type {
  ElementWithClassNames,
  WebflowElement,
} from "@/features/linter/entities/element/model/element.types";

interface CreateArgs {
  grammar: GrammarAdapter;
  detectors: RoleDetector[];
  config?: RoleDetectionConfig;
}

const DEFAULT_CONFIG: RoleDetectionConfig = { threshold: 0.6 };

/** Best-effort, stable element id extraction */
function getElementId(el: WebflowElement | undefined): string {
  // Prefer plain id → nodeId → nested { element } shape (older adapters)
  const id =
    (el as any)?.id ??
    (el as any)?.nodeId ??
    (el as any)?.element?.id ??
    (el as any)?.element ??
    "";
  return String(id);
}

/** Try to read a parent id if the element object exposes one */
function getParentId(el: WebflowElement | undefined): string | null {
  const pid =
    (el as any)?.parentId ??
    (el as any)?.parent?.id ??
    (el as any)?.parentNode?.id ??
    null;
  return pid ? String(pid) : null;
}

/** Returns the first BASE custom class parsed by the active grammar */
function getFirstCustom(
  grammar: GrammarAdapter,
  classNames: string[]
): ParsedClass | undefined {
  for (const name of classNames) {
    let parsed: ParsedClass;
    try {
      parsed = grammar.parse(name);
    } catch {
      continue;
    }
    if (parsed?.kind === "custom") return parsed;
  }
  return undefined;
}

export function createRoleDetectionService({
  grammar,
  detectors,
  config,
}: CreateArgs) {
  const effectiveConfig: RoleDetectionConfig = {
    ...DEFAULT_CONFIG,
    ...(config ?? {}),
  };

  function detectRolesForPage(
    elements: ElementWithClassNames[]
  ): RolesByElement {
    const threshold = Math.max(0, Math.min(1, effectiveConfig.threshold));
    const result: RolesByElement = {};

    // Build parent map (best-effort) to compute ancestry if possible
    const parentIdByChildId = new Map<string, string | null>();
    const classesByElementId = new Map<string, string[]>();

    for (const item of elements) {
      const element = item.element as WebflowElement | undefined;
      const elId = getElementId(element);
      if (!elId) continue;

      const classNames = (item.classNames ?? []).filter(Boolean);
      classesByElementId.set(elId, classNames);

      parentIdByChildId.set(elId, getParentId(element));
    }

    const getAncestry = (id: string): string[] => {
      const out: string[] = [];
      let p = parentIdByChildId.get(id) ?? null;
      const guard = new Set<string>();
      while (p && !guard.has(p)) {
        out.push(p);
        guard.add(p);
        p = parentIdByChildId.get(p) ?? null;
      }
      return out;
    };

    // Track best scores for singleton main enforcement
    const scoresByElement: Record<
      string,
      { best: number; role: RolesByElement[string] }
    > = {};

    for (const item of elements) {
      const element = item.element as WebflowElement | undefined;
      const elementId = getElementId(element);
      if (!elementId) continue;

      const classNames = classesByElementId.get(elementId) ?? [];
      const parsedFirstCustom = getFirstCustom(grammar, classNames);
      const ancestryIds = getAncestry(elementId);

      let bestRole: RolesByElement[string] | null = null;
      let bestScore = -1;

      for (const detector of detectors) {
        try {
          const scored = detector({
            elementId,
            element: element as WebflowElement,
            classNames,
            parsedFirstCustom,
            ancestryIds,
          });
          if (!scored) continue;
          if (scored.score > bestScore) {
            bestScore = scored.score;
            bestRole = scored.role;
          }
        } catch {
          // detector errors are non-fatal; continue
        }
      }

      // Thresholding
      result[elementId] =
        bestRole && bestScore >= threshold ? bestRole : "unknown";
      scoresByElement[elementId] = { best: bestScore, role: result[elementId] };
    }

    // Enforce singleton `main`: keep highest-scoring, demote others to unknown
    const mainCandidates = Object.entries(scoresByElement)
      .filter(([, v]) => v.role === "main")
      .map(([elId, v]) => ({ elId, score: v.best }));

    if (mainCandidates.length > 1) {
      let winner = mainCandidates[0];
      for (const c of mainCandidates) {
        if (c.score > winner.score) winner = c;
      }
      for (const c of mainCandidates) {
        result[c.elId] = c.elId === winner.elId ? "main" : "unknown";
      }
    }

    return result;
  }

  return { detectRolesForPage } as const;
}
