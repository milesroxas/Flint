import type {
  PropertyRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

// Role-gated element-level rule: discourages padding utilities on childGroup
export const cfNoPaddingOnInnerRule: PropertyRule = {
  id: "cf-no-padding-on-inner",
  name: "Client-First: Avoid Padding Utilities on Inner Elements",
  description:
    "Use custom classes for inner padding; avoid padding-* on nested elements.",
  example: "card_content padding-small ➜ move padding to card_content class",
  type: "property",
  category: "format",
  severity: "suggestion",
  enabled: true,
  targetClassTypes: ["utility"],
  analyze: () => [],
  analyzeElement: ({ classes, allStyles, getRoleForElement }) => {
    const results: RuleResult[] = [];
    const elementId = classes[0]?.elementId;
    if (!elementId || typeof getRoleForElement !== "function") return results;
    if (getRoleForElement(elementId) !== "childGroup") return results;

    const propsByClass = new Map<string, any>();
    for (const s of allStyles) {
      if (!propsByClass.has(s.name)) propsByClass.set(s.name, s.properties);
    }

    const isPaddingProp = (key: string) =>
      key === "padding" || key.startsWith("padding");

    for (const cls of classes) {
      const name = cls.className;
      if (!name || !name.startsWith("u-")) continue;
      const props = propsByClass.get(name) ?? {};
      const hasPadding = Object.keys(props).some(isPaddingProp);
      if (hasPadding) {
        results.push({
          ruleId: "cf-no-padding-on-inner",
          name: "Client-First: Avoid Padding Utilities on Inner Elements",
          message:
            "Avoid padding-* utilities on inner elements; use a custom class instead.",
          severity: "suggestion",
          className: name,
          isCombo: Boolean(cls.isCombo),
        });
      }
    }
    return results;
  },
};
