import type { Rule } from "@/features/linter/model/rule.types";
import type {
  ElementRole,
  ParsedClass,
} from "@/features/linter/model/linter.types";

export const createChildGroupKeyMatchRule = (): Rule => ({
  id: "canonical:childgroup-key-match",
  name: "Child group component key must match nearest component root",
  description:
    "Child groups must share the same component key (name_variant) with their nearest component root ancestor to maintain consistent component naming.",
  example: "hero_primary_wrap (root) → hero_primary_cta_wrap (child group)",
  category: "structure",
  type: "structure",
  severity: "error",
  enabled: true,

  analyzeElement: ({
    elementId,
    classes,
    getRoleForElement,
    getAncestorIds,
    parseClass,
    getClassType,
    getClassNamesForElement,
  }) => {
    // DEBUG: Log all rule execution attempts
    console.log(
      `[DEBUG] child-group-key-match rule executing for element ${elementId}`
    );
    console.log(
      `[DEBUG] Element classes:`,
      classes?.map((c) => c.className)
    );

    if (!elementId || !getRoleForElement) {
      console.log(
        `[DEBUG] Missing required dependencies: elementId=${!!elementId}, getRoleForElement=${!!getRoleForElement}`
      );
      return [];
    }

    const role: ElementRole = getRoleForElement(elementId) ?? "unknown";
    console.log(`[DEBUG] Element ${elementId} has role: ${role}`);

    // Only analyze elements that have been identified as child groups by the detectors
    // This ensures component roots and sections are never processed as child groups
    if (role !== "childGroup") {
      // Log when we skip elements for role reasons
      if (role !== "unknown") {
        console.log(
          `[DEBUG] Skipping element ${elementId} with role ${role} (not childGroup)`
        );
      }
      return [];
    }

    console.log(`[DEBUG] Processing childGroup element ${elementId}`);

    // Required helpers; if missing, skip to avoid false positives
    if (!parseClass || !getAncestorIds || !getClassNamesForElement) return [];

    // Find nearest componentRoot ancestor
    const ancestors = getAncestorIds(elementId) ?? [];
    console.log(`[DEBUG] Ancestors for ${elementId}:`, ancestors);

    // Log roles for all ancestors
    const ancestorRoles = ancestors.map((id) => ({
      id,
      role: getRoleForElement(id),
    }));
    console.log(`[DEBUG] Ancestor roles:`, ancestorRoles);

    const rootId = ancestors.find(
      (id) => getRoleForElement(id) === "componentRoot"
    );

    console.log(`[DEBUG] Found component root:`, rootId);

    if (!rootId) {
      // This should be rare now that we have structural detection
      const first = classes[0];
      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group component key must match nearest component root",
          message:
            "Child group has no component root ancestor (structural validation failed).",
          severity: "error",
          elementId,
          className: first?.className ?? "",
          isCombo: !!first?.isCombo,
        },
      ];
    }

    // Extract child group's component key
    const baseChild =
      classes.find(
        (c) =>
          (getClassType?.(c.className, c.isCombo) ?? "custom") === "custom" &&
          !c.isCombo
      ) ?? classes[0];

    const childParsed: ParsedClass | null =
      parseClass(baseChild?.className ?? "") ?? null;
    const childKey = childParsed?.componentKey ?? null;

    // Extract component root's component key
    const rootClassNames = getClassNamesForElement(rootId) ?? [];
    const rootBaseName =
      rootClassNames.find(
        (n) => (getClassType?.(n) ?? "custom") === "custom"
      ) ?? "";

    const rootParsed: ParsedClass | null = parseClass(rootBaseName) ?? null;
    const rootKey = rootParsed?.componentKey ?? null;

    // Validate component key matching
    if (!childKey || !rootKey || childKey !== rootKey) {
      let message: string;
      let actionableAdvice = "";

      if (!childKey) {
        message = `Child group component key could not be extracted from "${baseChild?.className}".`;
        actionableAdvice =
          " Ensure child group follows naming pattern like 'hero_primary_content_wrap'.";
      } else if (!rootKey) {
        message = `Component root key could not be extracted from "${rootBaseName}".`;
        actionableAdvice =
          " Ensure component root follows naming pattern like 'hero_primary_wrap'.";
      } else {
        message = `Child group key "${childKey}" does not match component root key "${rootKey}".`;
        actionableAdvice = ` Change child group to use "${rootKey}_[element]_wrap" pattern.`;
      }

      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group component key must match nearest component root",
          message: message + actionableAdvice,
          severity: "error",
          elementId,
          className: baseChild?.className ?? "",
          isCombo: !!baseChild?.isCombo,
        },
      ];
    }

    // Keys match - component structure is valid
    return [];
  },
});
