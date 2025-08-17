import type { Rule } from "@/features/linter/model/rule.types";

export const createChildGroupKeyMatchRule = (): Rule => ({
  id: "canonical:childgroup-key-match",
  name: "Child group key must match nearest component root",
  description:
    "Child group component key must match its nearest component root.",
  example: "hero_wrap → hero_cta_wrap",
  category: "structure",
  type: "structure",
  severity: "error",
  enabled: true,
  targetClassTypes: ["custom", "combo", "utility"],
  analyzeElement: ({
    elementId,
    classes,
    getRoleForElement,
    getAncestorIds,
    parseClass,
    getClassType,
    getClassNamesForElement,
  }) => {
    if (!elementId || typeof getRoleForElement !== "function") return [];
    const role = getRoleForElement(elementId);
    if (role !== "childGroup") return [];

    const ancestors =
      typeof getAncestorIds === "function" ? getAncestorIds(elementId) : [];
    const rootId = ancestors.find(
      (id) => getRoleForElement(id) === "componentRoot"
    );
    if (!rootId) {
      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match nearest component root",
          message: "Child group has no component root ancestor.",
          severity: "error",
          elementId,
          className: classes[0]?.className ?? "",
          isCombo: classes[0]?.isCombo === true,
          metadata: { elementId },
        },
      ];
    }

    const childParsed =
      (parseClass?.(classes[0]?.className ?? "") as any) ?? null;
    const childKey = childParsed?.componentKey ?? null;
    const rootClassNames = (
      typeof getClassNamesForElement === "function"
        ? getClassNamesForElement(rootId)
        : []
    ) as string[];
    const rootBaseName =
      rootClassNames.find(
        (n) => (getClassType?.(n) ?? "custom") === "custom"
      ) ?? "";
    const rootParsed = (parseClass?.(rootBaseName) as any) ?? null;
    const rootKey = rootParsed?.componentKey ?? null;
    if (!childKey || !rootKey || childKey !== rootKey) {
      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match nearest component root",
          message:
            "Child group's component key does not match the nearest component root.",
          severity: "error",
          elementId,
          className: classes[0]?.className ?? "",
          isCombo: classes[0]?.isCombo === true,
          metadata: { elementId },
        },
      ];
    }
    return [];
  },
});
