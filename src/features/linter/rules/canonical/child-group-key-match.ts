import type { Rule } from "@/features/linter/model/rule.types";
import type {
  ElementRole,
  ParsedClass,
} from "@/features/linter/model/linter.types";

/**
 * Child group component key must match nearest component root.
 * - Runs ONLY for elements detected as `childGroup`.
 * - Compares `componentKey` from child vs nearest ancestor with role `componentRoot`.
 */
export const createChildGroupKeyMatchRule = (): Rule => ({
  id: "canonical:childgroup-key-match",
  name: "Child group key must match its nearest component root",
  description:
    "Child groups must share the same component key (name_variant) as their nearest component root ancestor.",
  example: "hero_primary_wrap → hero_primary_cta_wrap",
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
    if (!elementId || !getRoleForElement) return [];

    const role: ElementRole = getRoleForElement(elementId) ?? "unknown";
    if (role !== "childGroup") return []; // hard-gate: never fire on roots/sections/main/etc.

    if (!parseClass || !getAncestorIds || !getClassNamesForElement) return [];

    // find nearest ancestor with role componentRoot
    const rootId =
      (getAncestorIds(elementId) ?? []).find(
        (id) => getRoleForElement(id) === "componentRoot"
      ) ?? null;

    if (!rootId) {
      const first = classes?.[0];
      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match its nearest component root",
          message:
            "Child group has no component root ancestor (check structural detection).",
          severity: "error",
          elementId,
          className: first?.className ?? "",
          isCombo: !!first?.isCombo,
        },
      ];
    }

    // parse child's base custom class (ignore utilities/combos)
    const baseChild =
      classes?.find(
        (c) =>
          (getClassType?.(c.className, c.isCombo) ?? "custom") === "custom" &&
          !c.isCombo
      ) ?? classes?.[0];

    const childKey =
      (parseClass(baseChild?.className ?? "") as ParsedClass | null)
        ?.componentKey ?? null;

    // parse root's base custom class
    const rootClassNames = getClassNamesForElement(rootId) ?? [];
    const rootBase =
      rootClassNames.find(
        (n) => (getClassType?.(n) ?? "custom") === "custom"
      ) ??
      rootClassNames[0] ??
      "";
    const rootKey =
      (parseClass(rootBase) as ParsedClass | null)?.componentKey ?? null;

    // Allow child to extend a single-token root key (e.g., root: "blog" → child: "blog_cms_wrap").
    // If the root key includes a variant (two tokens, e.g., "blog_main"), enforce exact match.
    const rootParts = (rootKey ?? "").split("_").filter(Boolean);
    const isSingleTokenRoot = rootParts.length === 1;
    const childExtendsSingleTokenRoot =
      !!childKey && !!rootKey && isSingleTokenRoot && childKey.startsWith(`${rootKey}_`);

    if (!childKey || !rootKey || (childKey !== rootKey && !childExtendsSingleTokenRoot)) {
      const baseName = baseChild?.className ?? "";
      const msg = !childKey
        ? `Could not extract component key from "${baseName}". Use "<name>_<variant>_<group>_wrap".`
        : !rootKey
        ? `Could not extract component key from root "${rootBase}". Use "<name>_<variant>_wrap".`
        : `Child group key "${childKey}" does not match root key "${rootKey}". Rename to "${rootKey}_[element]_wrap".`;

      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match its nearest component root",
          message: msg,
          severity: "error",
          elementId,
          className: baseChild?.className ?? "",
          isCombo: !!baseChild?.isCombo,
        },
      ];
    }

    return [];
  },
});
