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

function getFirstCustom(
  grammar: GrammarAdapter,
  classNames: string[]
): ParsedClass | undefined {
  for (const name of classNames) {
    const parsed = grammar.parse(name);
    if (
      parsed.kind === "custom" ||
      (parsed as any).kind === "component" ||
      parsed.kind === "unknown"
    ) {
      return parsed;
    }
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

    // Collect scores per element
    const scoresByElement: Record<
      string,
      { best: number; role: string } & Record<string, number>
    > = {} as any;

    for (const item of elements) {
      const element = item.element as WebflowElement;
      const classNames = (item.classNames || []).filter(
        (n) => n && n.trim() !== ""
      );
      const elementId = String(
        ((element as any)?.id && ((element as any).id as any).element) ||
          (element as any)?.id ||
          (element as any)?.nodeId ||
          ""
      );
      const parsedFirstCustom = getFirstCustom(grammar, classNames);
      const ancestryIds: string[] | undefined = undefined; // Keep for future ancestry signals if needed

      let bestRole: string | null = null;
      let bestScore = -1;

      for (const detector of detectors) {
        try {
          const score = detector({
            elementId,
            element,
            classNames,
            parsedFirstCustom,
            ancestryIds,
          });
          if (!score) continue;
          if (score.score > bestScore) {
            bestScore = score.score;
            bestRole = score.role;
          }
        } catch {
          // detector errors are non-fatal; continue
        }
      }

      // Apply threshold
      if (bestRole && bestScore >= threshold) {
        result[elementId] = bestRole as any;
      } else {
        result[elementId] = "unknown" as any;
      }

      // Track for singleton enforcement
      scoresByElement[elementId] = {
        best: bestScore,
        role: (bestRole ?? "unknown") as any,
      } as any;
    }

    // Enforce singleton main
    const mainCandidates = Object.entries(scoresByElement)
      .filter(([, v]) => v.role === "main")
      .map(([elId, v]) => ({ elId, score: v.best }));

    if (mainCandidates.length > 1) {
      let winner = mainCandidates[0];
      for (const c of mainCandidates) {
        if (c.score > winner.score) winner = c;
      }
      for (const c of mainCandidates) {
        if (c.elId !== winner.elId) {
          result[c.elId] = "unknown" as any;
        }
      }
      result[winner.elId] = "main" as any;
    }

    return result;
  }

  return { detectRolesForPage } as const;
}
