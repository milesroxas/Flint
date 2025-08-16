import type { PageRule } from "@/features/linter/services/page-rule-runner";

export const createMainSingletonPageRule = (): PageRule => ({
  id: "canonical:main-singleton",
  name: "Exactly one main role per page",
  severity: "error",
  run: ({ rolesByElement }) => {
    const mains = Object.entries(rolesByElement).filter(
      ([, role]) => role === "main"
    );
    if (mains.length === 1) return [];
    if (mains.length === 0) {
      return [
        {
          ruleId: "canonical:main-singleton",
          name: "Exactly one main role per page",
          message: "No main role detected on this page.",
          severity: "error",
          className: "",
          isCombo: false,
        },
      ];
    }
    const [, ...extras] = mains;
    return extras.map(([elementId]) => ({
      ruleId: "canonical:main-singleton",
      name: "Exactly one main role per page",
      message: "Multiple main roles detected. Keep exactly one.",
      severity: "error",
      elementId,
      className: "",
      isCombo: false,
    }));
  },
});
