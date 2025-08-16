import type { NamingRule } from "@/features/linter/model/rule.types";

export const createChildGroupKeyMatchRule = (): NamingRule => ({
  id: "canonical:childgroup-key-match",
  name: "Child group key must match nearest component root",
  description:
    "Child group component key must match its nearest component root.",
  example: "hero_wrap → hero_cta_wrap",
  category: "semantics",
  type: "naming",
  severity: "error",
  enabled: true,
  targetClassTypes: ["custom", "combo", "utility"],
  test: () => true,
  analyzeElement: ({
    classes,
    getRoleForElement,
    getAncestorIds,
    parseClass,
    getClassType,
    getClassNamesForElement,
  }) => {
    const elementId = classes[0]?.elementId;
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
          className: classes[0]?.name ?? "",
          isCombo: classes[0]?.isCombo === true,
          metadata: { elementId },
        },
      ];
    }

    const childKey = parseClass?.(classes[0]?.name ?? "")?.componentKey ?? null;
    const rootClassNames = (
      typeof getClassNamesForElement === "function"
        ? getClassNamesForElement(rootId)
        : []
    ) as string[];
    const rootBaseName =
      rootClassNames.find(
        (n) => (getClassType?.(n) ?? "custom") === "custom"
      ) ?? "";
    const rootKey = parseClass?.(rootBaseName)?.componentKey ?? null;
    if (!childKey || !rootKey || childKey !== rootKey) {
      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match nearest component root",
          message:
            "Child group's component key does not match the nearest component root.",
          severity: "error",
          className: classes[0]?.name ?? "",
          isCombo: classes[0]?.isCombo === true,
          metadata: { elementId },
        },
      ];
    }
    return [];
  },
});
