import type { Rule } from "@/features/linter/model/rule.types";
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
  severity: "error",
  enabled: true,
  type: "structure",
  targetClassTypes: [],

  analyzeElement: ({ elementId, classes, getRoleForElement, getParentId }) => {
    if (!elementId || typeof getRoleForElement !== "function") return [];

    const role: ElementRole = getRoleForElement(elementId) ?? "unknown";
    if (role !== "section") return [];

    const parentId =
      typeof getParentId === "function" ? getParentId(elementId) : null;
    const parentRole: ElementRole = parentId
      ? getRoleForElement(parentId) ?? "unknown"
      : "unknown";

    if (parentRole === "main") return [];

    return [
      {
        ruleId: "canonical:section-parent-is-main",
        name: "Section must be a direct child of main",
        message: "This section is not a direct child of the main role.",
        severity: "error",
        elementId,
        className: classes[0]?.className ?? "",
        isCombo: !!classes[0]?.isCombo,
      },
    ];
  },
});
