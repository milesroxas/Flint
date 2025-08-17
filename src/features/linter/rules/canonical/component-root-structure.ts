import type { Rule } from "@/features/linter/model/rule.types";

export const createComponentRootStructureRule = (): Rule => ({
  id: "canonical:component-root-structure",
  name: "Component root must live under a section and contain structure",
  description:
    "Component root must be under a section and contain layout/content/childGroup.",
  example: '<section><div class="hero_wrap">...</div></section>',
  category: "structure",
  type: "structure",
  severity: "warning",
  enabled: true,
  targetClassTypes: ["custom", "combo", "utility"],
  analyzeElement: ({
    elementId,
    classes,
    getRoleForElement,
    getParentId,
    getChildrenIds,
  }) => {
    if (!elementId || typeof getRoleForElement !== "function") return [];
    const role = getRoleForElement(elementId);
    if (role !== "componentRoot") return [];

    // Check ancestry for section
    let p = typeof getParentId === "function" ? getParentId(elementId) : null;
    let isUnderSection = false;
    while (p) {
      if (getRoleForElement(p) === "section") {
        isUnderSection = true;
        break;
      }
      p = typeof getParentId === "function" ? getParentId(p) : null;
    }

    const violations = [] as any[];

    if (!isUnderSection) {
      violations.push({
        ruleId: "canonical:component-root-structure",
        name: "Component root must live under a section and contain structure",
        message: "Component root is not within a section.",
        severity: "error",
        elementId,
        className: classes[0]?.className ?? "",
        isCombo: classes[0]?.isCombo === true,
        metadata: { elementId },
      } as const);
    }

    const children =
      typeof getChildrenIds === "function" ? getChildrenIds(elementId) : [];
    const hasStructure = children.some((id) => {
      const r = getRoleForElement(id);
      return r === "layout" || r === "content" || r === "childGroup";
    });
    if (!hasStructure) {
      violations.push({
        ruleId: "canonical:component-root-structure",
        name: "Component root must live under a section and contain structure",
        message:
          "Add a layout, content, or childGroup inside this component root.",
        severity: "warning",
        elementId,
        className: classes[0]?.className ?? "",
        isCombo: classes[0]?.isCombo === true,
        metadata: { elementId },
      } as const);
    }

    return violations;
  },
});
