import type {
  PropertyRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

// Role-gated element-level rule: checks utilities applied to a componentRoot element
export const componentRootNoDisplayUtilities: PropertyRule = {
  id: "component-root-no-display-utilities",
  name: "No Display Utilities on Component Roots",
  description: "Component root elements should not use display utility classes",
  example: "Avoid: u-flex, u-block, u-none on component roots",
  type: "property",
  category: "performance",
  severity: "warning",
  enabled: true,
  // Keep utility focus for intent; class-level analyze is disabled below
  targetClassTypes: ["utility"],
  // Disable class-level execution to avoid duplicates; logic lives in analyzeElement
  analyze: () => [],
  analyzeElement: ({ classes, allStyles, getRoleForElement }) => {
    const results: RuleResult[] = [];
    const elementId = classes[0]?.elementId;
    if (!elementId || typeof getRoleForElement !== "function") return results;
    const role = getRoleForElement(elementId);
    if (role !== "componentRoot") return results;

    // Build a quick lookup of style properties by class name
    const propsByClass = new Map<string, any>();
    for (const s of allStyles) {
      if (!propsByClass.has(s.name)) propsByClass.set(s.name, s.properties);
    }

    for (const cls of classes) {
      const name = cls.className;
      if (!name || !name.startsWith("u-")) continue;
      const props = propsByClass.get(name) ?? {};
      if (props && typeof props === "object" && "display" in props) {
        results.push({
          ruleId: "component-root-no-display-utilities",
          name: "No Display Utilities on Component Roots",
          message: `Component root element should not use display utility '${name}'. Consider using custom CSS or applying to child elements.`,
          severity: "warning",
          className: name,
          isCombo: Boolean(cls.isCombo),
          example: "Move display utilities to child elements",
        });
      }
    }
    return results;
  },
};
