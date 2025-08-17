import type { Rule, RuleResult } from "@/features/linter/model/rule.types";
import type { ElementRole } from "@/features/linter/model/linter.types";

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

  analyzeElement: ({
    elementId,
    classes,
    getRoleForElement,
    getParentId,
    getChildrenIds,
    getAncestorIds,
    getClassType,
  }) => {
    if (!elementId || !getRoleForElement) return [];

    const role: ElementRole = getRoleForElement(elementId) ?? "unknown";
    if (role !== "componentRoot") return [];

    // Prefer the base custom class for clearer messaging
    const baseClass =
      classes.find(
        (c) =>
          (getClassType?.(c.className, c.isCombo) ?? "custom") === "custom" &&
          !c.isCombo
      ) ?? classes[0];

    // ---- Check ancestry for `section` (prefer getAncestorIds, fallback to parent walk)
    const ancestorIds = getAncestorIds?.(elementId);
    let isUnderSection = false;

    if (Array.isArray(ancestorIds)) {
      isUnderSection = ancestorIds.some(
        (id) => getRoleForElement(id) === "section"
      );
    } else if (getParentId) {
      let p = getParentId(elementId);
      while (p) {
        if (getRoleForElement(p) === "section") {
          isUnderSection = true;
          break;
        }
        p = getParentId(p);
      }
    }

    const violations: RuleResult[] = [];

    if (!isUnderSection) {
      violations.push({
        ruleId: "canonical:component-root-structure",
        name: "Component root must live under a section and contain structure",
        message: "Component root is not within a section.",
        severity: "error",
        elementId,
        className: baseClass?.className ?? "",
        isCombo: !!baseClass?.isCombo,
      });
    }

    // ---- Check required structure children (layout | content | childGroup)
    if (getChildrenIds) {
      const children = getChildrenIds(elementId);
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
          className: baseClass?.className ?? "",
          isCombo: !!baseClass?.isCombo,
        });
      }
    }
    // If getChildrenIds is not provided, skip the structure-child check.

    return violations;
  },
});
