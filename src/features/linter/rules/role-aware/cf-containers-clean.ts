import type {
  PropertyRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

// Role-gated element-level rule: on componentRoot, discourage spacing utilities on the root
export const cfContainersCleanRule: PropertyRule = {
  id: "cf-containers-clean",
  name: "Client-First: Containers Should Be Clean",
  description:
    "Do not apply spacing utilities (padding-/margin-/gap-) to container elements; move spacing to an inner wrapper.",
  example:
    "container-large padding-medium ➜ move padding-medium to a wrapper inside the container",
  type: "property",
  category: "semantics",
  severity: "warning",
  enabled: true,
  targetClassTypes: ["utility"],
  analyze: () => [],
  analyzeElement: ({ classes, allStyles, getRoleForElement }) => {
    const results: RuleResult[] = [];
    const elementId = classes[0]?.elementId;
    if (!elementId || typeof getRoleForElement !== "function") return results;
    if (getRoleForElement(elementId) !== "componentRoot") return results;

    // Build properties lookup for utility classes
    const propsByClass = new Map<string, any>();
    for (const s of allStyles) {
      if (!propsByClass.has(s.name)) propsByClass.set(s.name, s.properties);
    }

    const spacingProps = new Set([
      "padding",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "margin",
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
      "gap",
      "rowGap",
      "columnGap",
    ]);

    for (const cls of classes) {
      const name = cls.className;
      if (!name || !name.startsWith("u-")) continue;
      const props = propsByClass.get(name) ?? {};
      const hasSpacing = Object.keys(props).some((k) => spacingProps.has(k));
      if (hasSpacing) {
        results.push({
          ruleId: "cf-containers-clean",
          name: "Client-First: Containers Should Be Clean",
          message:
            "Containers should not carry spacing utilities; apply spacing on an inner wrapper.",
          severity: "warning",
          className: name,
          isCombo: Boolean(cls.isCombo),
        });
      }
    }
    return results;
  },
};
