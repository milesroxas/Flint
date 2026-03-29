import type { StyleInfo } from "@/entities/style/model/style.types";
import { isContainerUtilityClass } from "@/features/linter/grammar/client-first.grammar";
import type { ElementAnalysisArgs, RuleResult, StructureRule } from "@/features/linter/model/rule.types";

/**
 * Returns true when raw CSS on a style suggests a hand-rolled "container" (max-width / centering)
 * instead of using `container-[size]` under `padding-global`.
 */
function hasContainerLikeProperties(props: Record<string, unknown>): boolean {
  const keys = Object.keys(props).filter((k) => !k.startsWith("__") && k !== "order");

  const hasMaxWidth = keys.some((k) => k === "max-width" || k === "maxWidth");

  const ml = props["margin-left"] ?? props["marginLeft"];
  const mr = props["margin-right"] ?? props["marginRight"];
  const margin = props["margin"] ?? props["margin"];

  const marginAutoBoth =
    typeof ml === "string" &&
    ml.includes("auto") &&
    typeof mr === "string" &&
    mr.includes("auto");
  const marginShorthandAuto = typeof margin === "string" && /\bauto\b/.test(margin);

  return hasMaxWidth || marginAutoBoth || marginShorthandAuto;
}

function findDriftingCustomClass(
  classes: ElementAnalysisArgs["classes"],
  getClassType: ElementAnalysisArgs["getClassType"],
  allStyles: StyleInfo[]
): string | null {
  for (const item of classes) {
    if (getClassType(item.className, item.isCombo) !== "custom") continue;
    const style = allStyles.find((s) => s.name === item.className);
    if (!style?.properties || typeof style.properties !== "object") continue;
    if (hasContainerLikeProperties(style.properties as Record<string, unknown>)) {
      return item.className;
    }
  }
  return null;
}

/**
 * Client-First: Under `padding-global`, prefer `container-[size]`. Warn when a direct child
 * skips container utilities but applies container-like layout on a **custom** class (drift).
 *
 * Does not flag utility-only stacks (e.g. `max-width-large`) or custom classes without
 * max-width / margin-auto centering.
 */
export const createCFPaddingGlobalChildContainerRule = (): StructureRule => ({
  id: "cf:structure:padding-global-child-container",
  name: "Client-First: padding-global child should use container utilities",
  description:
    "Direct children of padding-global should use container-[size]. Custom classes with max-width or horizontal margin auto mimic a container and are flagged as structural drift.",
  example: "padding-global > container-large",
  type: "structure",
  category: "structure",
  severity: "warning",
  enabled: true,

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { elementId, classes, getParentId, getClassType, allStyles } = args;

    if (!elementId || !getParentId || !getClassType || !allStyles?.length) return [];

    const parentId = getParentId(elementId);
    if (!parentId) return [];

    const parentNames = args.getClassNamesForElement?.(parentId);
    if (!parentNames?.includes("padding-global")) return [];

    const childClassNames = classes.map((c) => c.className);
    if (childClassNames.some(isContainerUtilityClass)) return [];

    const drifting = findDriftingCustomClass(classes, getClassType, allStyles);
    if (!drifting) return [];

    return [
      {
        ruleId: "cf:structure:padding-global-child-container",
        name: "Client-First: padding-global child should use container utilities",
        message: `This element is under padding-global but uses custom layout ("${drifting}") instead of a container-[size] class. Prefer container-small, container-medium, or container-large for the inner wrapper.`,
        severity: "warning",
        className: drifting,
        elementId,
        isCombo: false,
        example: "padding-global > container-large",
        metadata: {
          driftingCustomClass: drifting,
        },
      },
    ];
  },
});
