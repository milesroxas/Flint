import type {
  RoleDetectionConfig,
  RolesByElement,
} from "@/features/linter/model/linter.types";
import type { RoleDetector } from "@/features/linter/model/preset.types";
import type {
  ElementWithClassNames,
  WebflowElement,
} from "@/entities/element/model/element.types";
import { toElementKey } from "@/entities/element/lib/id";

interface CreateArgs {
  detectors: RoleDetector[];
  config?: RoleDetectionConfig;
}

const DEFAULT_CONFIG: RoleDetectionConfig = { threshold: 0.6 };

function getParentId(el: WebflowElement | undefined): string | null {
  const pid =
    (el as any)?.parentId ??
    (el as any)?.parent?.id ??
    (el as any)?.parentNode?.id ??
    null;
  return pid ? String(pid) : null;
}

export function createRoleDetectionService({ detectors, config }: CreateArgs) {
  const effectiveConfig: RoleDetectionConfig = {
    ...DEFAULT_CONFIG,
    ...(config ?? {}),
  };

  function detectRolesForPage(
    elements: ElementWithClassNames[]
  ): RolesByElement {
    const threshold = Math.max(0, Math.min(1, effectiveConfig.threshold));
    const result: RolesByElement = {};

    const parentIdByChildId = new Map<string, string | null>();
    const classesByElementId = new Map<string, string[]>();
    const elementById = new Map<string, WebflowElement | undefined>();

    for (const item of elements) {
      const element = item.element as WebflowElement | undefined;
      const elId = toElementKey(element);
      if (!elId) continue;

      const classNames = (item.classNames ?? []).filter(Boolean);
      classesByElementId.set(elId, classNames);

      parentIdByChildId.set(elId, getParentId(element));
      elementById.set(elId, element);
    }

    // Build children index from parent map
    const childrenIdsByParentId = new Map<string, string[]>();
    for (const [childId, parentId] of parentIdByChildId.entries()) {
      if (!parentId) continue;
      const list = childrenIdsByParentId.get(parentId) ?? [];
      list.push(childId);
      childrenIdsByParentId.set(parentId, list);
    }

    // Build stable snapshots for detectors with ancestry context
    const snapshots: {
      readonly id: string;
      readonly tagName: string;
      readonly classes: readonly string[];
      readonly parentId: string | null;
      readonly childrenIds: readonly string[];
      readonly textContent?: string;
      readonly attributes: Readonly<Record<string, string>>;
    }[] = [];
    const snapshotById = new Map<string, any>();

    for (const [id, _el] of elementById.entries()) {
      const el = _el as any;
      const classes = classesByElementId.get(id) ?? [];
      const parentId = parentIdByChildId.get(id) ?? null;
      const childrenIds = childrenIdsByParentId.get(id) ?? [];
      const tagName = (el?.tagName || "div") as string;
      const textContent = (el?.textContent ?? undefined) as string | undefined;
      const attributes: Record<string, string> = (() => {
        try {
          const attrs = el?.attributes;
          if (!attrs || typeof attrs !== "object") return {};
          // Normalize a shallow copy of string-like attributes
          const out: Record<string, string> = {};
          for (const [k, v] of Object.entries(attrs)) {
            if (typeof v === "string") out[k] = v;
          }
          return out;
        } catch {
          return {};
        }
      })();

      const snap = {
        id,
        tagName,
        classes,
        parentId,
        childrenIds,
        textContent,
        attributes,
      } as const;
      snapshots.push(snap);
      snapshotById.set(id, snap);
    }

    // Track best scores for singleton main enforcement
    const scoresByElement: Record<
      string,
      { best: number; role: RolesByElement[string] }
    > = {};

    for (const item of elements) {
      const element = item.element as WebflowElement | undefined;
      const elementId = toElementKey(element);
      if (!elementId) {
        console.log("[DEBUG] Skipping element with no ID:", item);
        continue;
      }

      let bestRole: RolesByElement[string] | null = null;
      let bestScore = -1;

      // Prepare shared detection context (currently no style/page signals wired)
      const detectionContext = {
        allElements: snapshots,
        styleInfo: [],
        pageInfo: {},
      } as const;

      for (const detector of detectors) {
        try {
          const elementSnapshot = snapshotById.get(elementId);
          if (!elementSnapshot) continue;

          const scored = detector.detect(elementSnapshot, detectionContext);

          if (!scored) continue;
          if (scored.score > bestScore) {
            bestScore = scored.score;
            bestRole = scored.role;
          }
        } catch (error) {
          console.error(
            `[DEBUG] Detector ${detector.id} error for element ${elementId}:`,
            error
          );
          // detector errors are non-fatal; continue
        }
      }

      // Thresholding
      result[elementId] =
        bestRole && bestScore >= threshold ? bestRole : "unknown";
      scoresByElement[elementId] = { best: bestScore, role: result[elementId] };

      // DEBUG: Log role detection results
      if (bestRole === "section" || bestRole === "main" || bestScore > 0) {
        const snapshot = snapshotById.get(elementId);
        console.log(`[DEBUG] Role detection for ${elementId}:`, {
          classes: snapshot?.classes || [],
          bestRole,
          bestScore,
          threshold,
          finalRole: result[elementId],
        });
      }
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
