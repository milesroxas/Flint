import type { NamingRule } from "@/features/linter/model/rule.types";

export const createComponentRootStructureRule = (): NamingRule => ({
  id: "canonical:component-root-structure",
  name: "Component root must live under a section and contain structure",
  description:
    "Component root must be under a section and contain layout/content/childGroup.",
  example: '<section><div class="hero_wrap">...</div></section>',
  category: "semantics",
  type: "naming",
  severity: "warning",
  enabled: true,
  targetClassTypes: ["custom", "combo", "utility"],
  test: () => true,
  analyzeElement: ({
    classes,
    getRoleForElement,
    getParentId,
    getChildrenIds,
  }) => {
    const elementId = classes[0]?.elementId;
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

    const violations = [] as ReturnType<NamingRule["analyzeElement"]>;

    if (!isUnderSection) {
      violations.push({
        ruleId: "canonical:component-root-structure",
        name: "Component root must live under a section and contain structure",
        message: "Component root is not within a section.",
        severity: "error",
        className: classes[0]?.name ?? "",
        isCombo: classes[0]?.isCombo === true,
        metadata: { elementId },
      } as any);
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
        className: classes[0]?.name ?? "",
        isCombo: classes[0]?.isCombo === true,
        metadata: { elementId },
      } as any);
    }

    return violations as any;
  },
});
