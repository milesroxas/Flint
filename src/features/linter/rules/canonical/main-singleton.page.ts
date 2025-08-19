// src/features/linter/rules/canonical/structure/main-singleton.page.ts
import type {
  PageRule,
  RuleResult,
  Severity,
} from "@/features/linter/model/rule.types";

export const createMainSingletonPageRule = (): PageRule => ({
  id: "canonical:main-singleton",
  name: "Exactly one main role per page",
  description:
    "There must be one and only one element with role 'main' using the proper <main> tag.",
  type: "page",
  category: "structure",
  severity: "error",
  enabled: true,

  analyzePage: ({ rolesByElement, getTagName, styles }): RuleResult[] => {
    // Helper function to get class names for an element
    const getClassNamesForElement = (elementId: string): string[] => {
      return styles
        .filter((style) => (style as any).elementId === elementId)
        .map((style) => style.name)
        .filter(Boolean);
    };

    // Helper function to detect if element uses preset-specific main class
    const hasPresetMainClass = (elementId: string): boolean => {
      const classNames = getClassNamesForElement(elementId);

      // Lumos preset: page_main class
      const hasLumosMain = classNames.includes("page_main");

      // Client-First preset: main-wrapper or main_* patterns
      const hasClientFirstMain = classNames.some(
        (name) => name === "main-wrapper" || /^main[_-]/.test(name)
      );

      return hasLumosMain || hasClientFirstMain;
    };

    const mains = Object.entries(rolesByElement).filter(
      ([, role]) => role === "main"
    );

    const results: RuleResult[] = [];

    // Check if we have exactly one main element
    if (mains.length === 0) {
      return [
        {
          ruleId: "canonical:main-singleton",
          name: "Exactly one main role per page",
          message: "No element with role 'main' detected.",
          severity: "error" as Severity,
          className: "",
          isCombo: false,
        },
      ];
    }

    if (mains.length > 1) {
      // If multiple, flag all extras for clarity
      const [, ...extras] = mains;
      results.push(
        ...extras.map(([elementId]) => ({
          ruleId: "canonical:main-singleton",
          name: "Exactly one main role per page",
          message: "Multiple elements have role 'main'. Keep exactly one.",
          severity: "error" as Severity,
          className: "",
          isCombo: false,
          elementId,
        }))
      );
    }

    // Validate that main elements use the correct <main> tag or have preset-specific fallback
    for (const [elementId] of mains) {
      const tagName = getTagName(elementId);
      const hasPresetClass = hasPresetMainClass(elementId);

      if (tagName === null) {
        // Element has no tag (non-DOM element) - check for preset-specific fallback
        if (hasPresetClass) {
          results.push({
            ruleId: "canonical:main-singleton",
            name: "Exactly one main role per page",
            message:
              "Element with role 'main' should use <main> tag, but detected preset-specific main class (e.g., page_main). Consider using proper <main> tag for better semantics.",
            severity: "warning" as Severity,
            className: "",
            isCombo: false,
            elementId,
          });
        } else {
          // No tag and no preset class - this is an error
          results.push({
            ruleId: "canonical:main-singleton",
            name: "Exactly one main role per page",
            message:
              "Element with role 'main' must be a DOM element with <main> tag, but no tag was found.",
            severity: "error" as Severity,
            className: "",
            isCombo: false,
            elementId,
          });
        }
      } else if (tagName.toLowerCase() !== "main") {
        // Element has wrong tag - check for preset-specific fallback
        if (hasPresetClass) {
          results.push({
            ruleId: "canonical:main-singleton",
            name: "Exactly one main role per page",
            message: `Element with role 'main' should use <main> tag, but uses <${tagName}>. Detected preset-specific main class which is acceptable but consider using proper <main> tag.`,
            severity: "warning" as Severity,
            className: "",
            isCombo: false,
            elementId,
          });
        } else {
          // Wrong tag and no preset class - this is an error
          results.push({
            ruleId: "canonical:main-singleton",
            name: "Exactly one main role per page",
            message: `Element with role 'main' should use <main> tag, but uses <${tagName}>.`,
            severity: "error" as Severity,
            className: "",
            isCombo: false,
            elementId,
          });
        }
      }
      // If tagName === "main", no violation needed
    }

    return results;
  },
});
