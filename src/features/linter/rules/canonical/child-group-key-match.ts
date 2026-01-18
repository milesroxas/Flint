// Canonical rules must be preset-agnostic. Avoid importing preset-specific
// heuristics; rely only on the active grammar's parseClass output.
import type { ElementRole, ParsedClass } from "@/features/linter/model/linter.types";
import type { Rule } from "@/features/linter/model/rule.types";

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

    // Canonical rule runs only for detected child groups to avoid
    // false positives on utilities/containers across presets.
    if (role !== "childGroup") return [];

    if (!parseClass || !getAncestorIds || !getClassNamesForElement) return [];

    // find nearest ancestor with role componentRoot
    const rootId = (getAncestorIds(elementId) ?? []).find((id) => getRoleForElement(id) === "componentRoot") ?? null;

    if (!rootId) {
      const first = classes?.[0];
      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match its nearest component root",
          message: "Child group has no component root ancestor (check structural detection).",
          severity: "error",
          elementId,
          className: first?.className ?? "",
          isCombo: !!first?.isCombo,
        },
      ];
    }

    // Helper: pick the most specific custom class on the element to represent the child group
    // Strategy (preset-agnostic): among custom classes, choose the one with the highest token count
    // (preferring names with >=3 tokens and not ending with wrap/wrapper). Falls back to the first
    // custom if no better candidate exists.
    const getBaseCustomClassName = (id: string, list?: { className: string; isCombo?: boolean }[]) => {
      const provided = (list ?? []).map((c) => c.className).filter((n) => (getClassType?.(n) ?? "custom") === "custom");
      const raw = (getClassNamesForElement(id) ?? []).filter((n) => (getClassType?.(n) ?? "custom") === "custom");
      const all = Array.from(new Set<string>([...provided, ...raw]));
      if (all.length === 0) return "";

      let best = all[0];
      let bestScore = -1;
      for (const name of all) {
        const parsed = (parseClass?.(name) as ParsedClass | null) ?? null;
        const tokens = parsed?.tokens ?? name.split(/[_-]+/).filter(Boolean);
        const last = (parsed?.elementToken ?? tokens[tokens.length - 1] ?? "").toString().toLowerCase();
        const notWrapper = last !== "wrap" && last !== "wrapper";
        const tokenCount = tokens.length;
        const score = (notWrapper ? 10 : 0) + tokenCount; // prefer non-wrapper and more tokens
        if (score > bestScore) {
          best = name;
          bestScore = score;
        }
      }
      return best;
    };

    // parse child's base custom class (ignore utilities/combos) with fallback to raw class names
    const baseChildName = getBaseCustomClassName(elementId, classes);
    if (!baseChildName) return [];

    const parsedChild = (parseClass(baseChildName ?? "") as ParsedClass | null) ?? null;
    const childKey = parsedChild?.componentKey ?? null;

    // parse root's base custom class, with robust fallback when roles are incomplete
    const pickRootBaseClass = (candidateId: string | null): { base: string; id: string | null } => {
      if (!candidateId) return { base: "", id: null };
      const names = getClassNamesForElement(candidateId) ?? [];
      const base = names.find((n) => (getClassType?.(n) ?? "custom") === "custom") ?? "";
      return { base, id: candidateId };
    };

    let rootBaseInfo = pickRootBaseClass(rootId);

    // If no componentRoot role was found or base is missing, walk ancestors to find first ancestor
    // with a parseable componentKey (preset-agnostic via grammar)
    if (!rootId || !rootBaseInfo.base) {
      const ancestorIds = getAncestorIds(elementId) ?? [];
      for (const aid of ancestorIds) {
        const { base } = pickRootBaseClass(aid);
        if (!base) continue;
        const parsed = (parseClass(base) as ParsedClass | null) ?? null;
        if (parsed?.kind === "custom" && parsed?.componentKey) {
          rootBaseInfo = { base, id: aid };
          break;
        }
      }
    }

    const parsedRoot = (parseClass(rootBaseInfo.base) as ParsedClass | null) ?? null;
    const rootKey = parsedRoot?.componentKey ?? null;

    // Allow child to extend a single-token root key (e.g., root: "blog" → child: "blog_cms_wrap").
    // If the root key includes a variant (two tokens, e.g., "blog_main"), enforce exact match.
    const rootParts = (rootKey ?? "").split("_").filter(Boolean);
    const isSingleTokenRoot = rootParts.length === 1;

    // Preset-agnostic allowance:
    // If the root key is a single token (e.g., "hero"), allow child groups to
    // extend it only when they do not introduce a variant according to the
    // active grammar (i.e., parsedChild.variation is empty/falsy). This allows
    // names like "hero_grid" but rejects variant-like forms such as
    // "hero_main_grid" when the root has no variant.
    const childKeyParts = (childKey ?? "").split("_").filter(Boolean);
    const childExtendsAllowedSingleTokenRoot =
      !!childKey &&
      !!rootKey &&
      isSingleTokenRoot &&
      childKeyParts.length >= 2 &&
      childKeyParts[0] === rootKey &&
      !parsedChild?.variation;

    // Enforce primarily for detected child groups. As a fallback for contexts
    // that didn't compute roles with structure (e.g., element-only scans),
    // infer likely child groups using grammar: custom class with >= 3 tokens
    // whose last token is not wrap/wrapper, and with at least one ancestor in
    // the context (to avoid isolated false positives).
    const ancestorIds = getAncestorIds(elementId) ?? [];
    const lastToken = parsedChild?.elementToken?.toLowerCase?.();
    const tokenCount = (parsedChild?.tokens ?? []).length;
    const grammarSuggestsChildGroup =
      parsedChild?.kind === "custom" &&
      tokenCount >= 3 &&
      lastToken !== "wrap" &&
      lastToken !== "wrapper" &&
      ancestorIds.length > 0;

    const shouldEnforce = role === "childGroup" || grammarSuggestsChildGroup;

    if (shouldEnforce && (!childKey || !rootKey || (childKey !== rootKey && !childExtendsAllowedSingleTokenRoot))) {
      const baseName = baseChildName ?? "";
      const msg = !childKey
        ? `Could not extract component key from "${baseName}". Use "<name>_<variant>_<group>_wrap".`
        : !rootKey
          ? `Could not extract component key from root "${rootBaseInfo.base}". Use "<name>_<variant>_wrap".`
          : isSingleTokenRoot && childKeyParts[0] === rootKey && childKeyParts.length >= 2
            ? `Child group key "${childKey}" introduces a variant but root key "${rootKey}" has none. Prefer "${rootKey}_${parsedChild?.elementToken ?? "[element]"}".`
            : `Child group key "${childKey}" does not match root key "${rootKey}". Rename to "${rootKey}_[element]_wrap".`;

      return [
        {
          ruleId: "canonical:childgroup-key-match",
          name: "Child group key must match its nearest component root",
          message: msg,
          severity: "error",
          elementId,
          className: baseChildName ?? "",
          isCombo: false,
        },
      ];
    }

    return [];
  },
});
