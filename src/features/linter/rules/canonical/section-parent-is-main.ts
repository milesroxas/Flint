import type { NamingRule } from "@/features/linter/model/rule.types";

export const createSectionParentIsMainRule = (): NamingRule => ({
  id: "canonical:section-parent-is-main",
  name: "Section must be a direct child of main",
  description: "Ensures a section element is directly under the main role.",
  example: '<main><section class="u-section"/></main>',
  category: "semantics",
  type: "naming",
  severity: "error",
  enabled: true,
  targetClassTypes: ["custom", "combo", "utility"],
  test: () => true,
  analyzeElement: ({ classes, getRoleForElement, getParentId }) => {
    const elementId = classes[0]?.elementId;
    if (!elementId || typeof getRoleForElement !== "function") return [];
    const role = getRoleForElement(elementId);
    if (role !== "section") return [];
    const parentId =
      typeof getParentId === "function" ? getParentId(elementId) : null;
    const parentRole = parentId ? getRoleForElement(parentId) : "unknown";
    if (parentRole === "main") return [];
    return [
      {
        ruleId: "canonical:section-parent-is-main",
        name: "Section must be a direct child of main",
        message: "This section is not a direct child of the main role.",
        severity: "error",
        className: classes[0]?.name ?? "",
        isCombo: classes[0]?.isCombo === true,
        metadata: { elementId },
      },
    ];
  },
});
