// src/features/linter/rules/canonical/structure/main-has-content.page.ts
import type {
  PageRule,
  PageAnalysisArgs,
} from "@/features/linter/model/rule.types";

export const createMainHasContentPageRule = (): PageRule => ({
  id: "canonical:main-has-content",
  name: "Main should contain sections or component roots",
  description:
    "Ensures main element contains semantic content like sections or component roots",
  type: "page",
  category: "structure",
  severity: "error",
  enabled: true,
  analyzePage: ({ rolesByElement, graph }: PageAnalysisArgs) => {
    // Find the main element
    const mainEntry = Object.entries(rolesByElement).find(
      ([, role]) => role === "main"
    );

    if (!mainEntry) return []; // No main found, handled by main-singleton rule

    const [mainElementId] = mainEntry;

    // BFS through descendants looking for section or componentRoot
    const queue: string[] = [...graph.getChildrenIds(mainElementId)];
    const seen = new Set<string>(queue);
    let hasContent = false;

    while (queue.length) {
      const id = queue.shift()!;
      const role = rolesByElement[id];

      if (role === "section" || role === "componentRoot") {
        hasContent = true;
        break;
      }

      const kids = graph.getChildrenIds(id);
      for (const k of kids) {
        if (!seen.has(k)) {
          seen.add(k);
          queue.push(k);
        }
      }
    }

    if (hasContent) return [];

    return [
      {
        ruleId: "canonical:main-has-content",
        name: "Main should contain sections or component roots",
        message: "Add at least one section or component root inside main.",
        severity: "error",
        elementId: mainElementId,
        className: "",
        isCombo: false,
      },
    ];
  },
});
