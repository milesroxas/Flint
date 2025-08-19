import type { Rule, RuleResult } from "@/features/linter/model/rule.types";
import type { ElementRole } from "@/features/linter/model/linter.types";

/**
 * Canonical structural rule:
 * A `section` must be a direct child of `main`.
 */
export const createSectionParentIsMainRule = (): Rule => ({
  id: "canonical:section-parent-is-main",
  name: "Section must be a direct child of main",
  description:
    "Enforces that any element with role 'section' is a direct child of a 'main' element.",
  category: "structure",
  type: "structure",
  severity: "error",
  enabled: true,

  // If your BaseRule requires this, keep it. It is ignored by element-scope execution.
  targetClassTypes: ["custom", "combo", "utility"],

  analyzeElement: ({
    elementId,
    classes,
    getRoleForElement,
    getParentId,
    getClassType,
  }) => {
    if (!elementId || !getRoleForElement) return [];

    const role: ElementRole = getRoleForElement(elementId) ?? "unknown";
    if (role !== "section") return [];

    // If the graph helper isn't available, skip to avoid false positives
    if (!getParentId) return [];

    const parentId = getParentId(elementId);
    const parentRole: ElementRole = parentId
      ? getRoleForElement(parentId) ?? "unknown"
      : "unknown";

    if (parentRole === "main") return [];

    // Prefer a base custom class for clearer messaging
    const baseClass =
      classes.find(
        (c) =>
          (getClassType?.(c.className, c.isCombo) ?? "custom") === "custom" &&
          !c.isCombo
      ) ?? classes[0];

    const violation: RuleResult = {
      ruleId: "canonical:section-parent-is-main",
      name: "Section must be a direct child of main",
      message: "This section is not a direct child of the main role.",
      severity: "error",
      elementId,
      className: baseClass?.className ?? "",
      isCombo: !!baseClass?.isCombo,
    };

    return [violation];
  },
});
