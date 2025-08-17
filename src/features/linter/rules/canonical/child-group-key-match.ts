import type { Rule } from "@/features/linter/model/rule.types";
import type {
  ElementRole,
  ParsedClass,
} from "@/features/linter/model/linter.types";

export const createChildGroupKeyMatchRule = (): Rule => ({
  id: "canonical:childgroup-key-match",
  name: "Child group key must match nearest component root",
  description:
    "Child group component key must match its nearest component root.",
  example: "hero_primary_wrap → hero_primary_cta_wrap",
  category: "structure",
  type: "structure",
  severity: "error",
  enabled: true,

  analyzeElement: ({
    elementId,
    classes,
    getRoleForElement,
    getAncestorIds,
    parseClass,
    getClassType,
    getClassNamesForElement,
  }) => {
    if (!elementId || !getRoleForElement) return [];

    const role: ElementRole = getRoleForElement(elementId) ?? "unknown";
    if (role !== "childGroup") return [];

    // Required helpers; if missing, skip to avoid false positives
    if (!parseClass || !getAncestorIds || !getClassNamesForElement) return [];

    // Find nearest componentRoot ancestor
    const ancestors = getAncestorIds(elementId) ?? [];
    const rootId = ancestors.find(
      (id) => getRoleForElement(id) === "componentRoot"
    );
    if (!rootId) {
      const first = classes[0];
      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match nearest component root",
          message: "Child group has no component root ancestor.",
          severity: "error",
          elementId,
          className: first?.className ?? "",
          isCombo: !!first?.isCombo,
        },
      ];
    }

    // --- Child group's base custom class
    const baseChild =
      classes.find(
        (c) =>
          (getClassType?.(c.className, c.isCombo) ?? "custom") === "custom" &&
          !c.isCombo
      ) ?? classes[0];

    const childParsed: ParsedClass | null =
      parseClass(baseChild?.className ?? "") ?? null;
    const childKey = childParsed?.componentKey ?? null;

    // --- Root's base custom class
    const rootClassNames = getClassNamesForElement(rootId) ?? [];
    const rootBaseName =
      rootClassNames.find(
        (n) => (getClassType?.(n) ?? "custom") === "custom"
      ) ?? "";

    const rootParsed: ParsedClass | null = parseClass(rootBaseName) ?? null;
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
          className: baseChild?.className ?? "",
          isCombo: !!baseChild?.isCombo,
        },
      ];
    }

    return [];
  },
});
