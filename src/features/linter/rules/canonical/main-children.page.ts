// src/features/linter/rules/canonical/main-children.page.ts
import type {
  PageRule,
  RuleResult,
  Severity,
} from "@/features/linter/model/rule.types";
import type { ElementRole } from "@/features/linter/model/linter.types";

export const createMainChildrenPageRule = (): PageRule => ({
  id: "canonical:main-children",
  name: "Main should contain sections or component roots",
  description:
    "Ensures main element contains semantic content like sections or component roots as direct or descendant children",
  type: "page",
  category: "structure",
  severity: "error",
  enabled: true,

  analyzePage: ({ rolesByElement, graph, getRoleForElement }): RuleResult[] => {
    // Find the main element
    const mainEntry = Object.entries(rolesByElement).find(
      ([, role]) => role === "main"
    );

    if (!mainEntry) return []; //

    const [mainElementId] = mainEntry;

    // Use BFS to search through all descendants for semantic content
    const queue: string[] = [...graph.getChildrenIds(mainElementId)];
    const visited = new Set<string>();
    let hasSemanticContent = false;

    // DEBUG: Log graph children detection
    console.log(
      `[DEBUG] Graph children for main ${mainElementId}:`,
      graph.getChildrenIds(mainElementId)
    );

    // Track found content for better error messages
    const foundRoles: ElementRole[] = [];

    // DEBUG: Log initial search state
    console.log(
      `[DEBUG] Main-children rule starting BFS for ${mainElementId}:`,
      {
        initialQueue: queue,
        rolesByElement,
      }
    );

    while (queue.length > 0 && !hasSemanticContent) {
      const currentElementId = queue.shift()!;

      if (visited.has(currentElementId)) {
        continue;
      }
      visited.add(currentElementId);

      const role: ElementRole = getRoleForElement(currentElementId);
      foundRoles.push(role);

      // DEBUG: Log each element being processed
      console.log(
        `[DEBUG] Processing element ${currentElementId}: role=${role}`
      );

      // Check if we found semantic content
      if (role === "section" || role === "componentRoot") {
        console.log(
          `[DEBUG] Found semantic content! Element ${currentElementId} has role ${role}`
        );
        hasSemanticContent = true;
        break;
      }

      // Continue searching descendants
      const children = graph.getChildrenIds(currentElementId);
      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }

    if (hasSemanticContent) {
      return [];
    }

    // Generate helpful error message based on what we found
    const uniqueRoles = [...new Set(foundRoles)].filter(
      (role) => role !== "unknown"
    );
    const foundRolesText =
      uniqueRoles.length > 0
        ? ` Found roles: ${uniqueRoles.join(", ")}.`
        : " No semantic roles found.";

    const result: RuleResult = {
      ruleId: "canonical:main-children",
      name: "Main should contain sections or component roots",
      message: `Main element must contain at least one section or component root.${foundRolesText}`,
      severity: "error" as Severity,
      elementId: mainElementId,
      className: "",
      isCombo: false,
    };

    return [result];
  },
});
