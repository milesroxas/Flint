import type { PageRule } from "@/features/linter/services/page-rule-runner";

export const createMainHasContentPageRule = (): PageRule => ({
  id: "canonical:main-has-content",
  name: "Main should contain sections or component roots",
  severity: "warning",
  run: ({ rolesByElement, getChildrenIds }) => {
    const mains = Object.entries(rolesByElement).filter(
      ([, r]) => r === "main"
    );
    if (mains.length !== 1) return [];
    const [mainId] = mains[0];
    const children = getChildrenIds(mainId);
    const ok = children.some((id) => {
      const r = rolesByElement[id];
      return r === "section" || r === "componentRoot";
    });
    return ok
      ? []
      : [
          {
            ruleId: "canonical:main-has-content",
            name: "Main should contain sections or component roots",
            message: "Add at least one section or component root inside main.",
            severity: "warning",
            elementId: mainId,
            className: "",
            isCombo: false,
          },
        ];
  },
});
