import type { RoleDetector } from "@/features/linter/model/linter.types";

/** suffix like _wrap or _wrapper */
const WRAP_SUFFIX_RE = /(?:^|[_-])(wrap|wrapper)$/i;
/** split by _ or - */
const splitTokens = (name: string) => name.split(/[_-]+/).filter(Boolean);

const SUBPART_HINTS = new Set([
  // common sub-part tokens in Lumos components
  "cta",
  "header",
  "footer",
  "media",
  "image",
  "inner",
  "content",
  "body",
  "aside",
  "eyebrow",
  "badge",
  "title",
  "subtitle",
  "copy",
  "desc",
  "description",
  "meta",
  "actions",
  "links",
  "buttons",
  "button",
  "btn",
  "grid",
  "cols",
  "col",
  "list",
  "item",
  "figure",
  "lead",
  "stats",
  "stat",
]);

/**
 * Decide root vs childGroup from a base custom class that ends with _wrap/_wrapper.
 * - Strip suffix and inspect base tokens.
 * - 2 tokens (e.g., hero_primary) => componentRoot
 * - >=3 tokens or tail matches a sub-part hint (e.g., hero_primary_cta) => childGroup
 */
const classifyWrapName = (
  name: string
): "componentRoot" | "childGroup" | null => {
  if (!WRAP_SUFFIX_RE.test(name)) return null;

  const tokens = splitTokens(name);
  if (tokens.length === 0) return null;

  const last = tokens[tokens.length - 1].toLowerCase();
  const baseTokens =
    last === "wrap" || last === "wrapper" ? tokens.slice(0, -1) : tokens;
  if (baseTokens.length === 0) return null;

  const tail = baseTokens[baseTokens.length - 1].toLowerCase();
  const looksLikeSubpart = baseTokens.length >= 3 || SUBPART_HINTS.has(tail);

  return looksLikeSubpart ? "childGroup" : "componentRoot";
};

export const lumosRoleDetectors: RoleDetector[] = [
  // main: strong signal on canonical class names
  ({ classNames, elementId }) => {
    const hit = classNames.find(
      (n) => n === "page_main" || n === "main-wrapper"
    );
    return hit ? ({ elementId, role: "main", score: 0.95 } as const) : null;
  },

  // section: u-section* or section_*
  ({ classNames, elementId }) => {
    const hit = classNames.find(
      (n) => n.startsWith("u-section") || /^section_/.test(n)
    );
    return hit ? ({ elementId, role: "section", score: 0.85 } as const) : null;
  },

  // componentRoot vs childGroup: base custom + _wrap/_wrapper
  ({ classNames, parsedFirstCustom, elementId }) => {
    // prefer the first parsed custom; fallback to first classname
    const base = parsedFirstCustom?.raw ?? classNames[0] ?? "";
    if (!base) return null;

    const role = classifyWrapName(base);
    if (!role) return null;

    // Bias slightly toward root by default (avoids false childGroup on simple roots like valid_component_wrap)
    const score = role === "componentRoot" ? 0.9 : 0.86;
    return { elementId, role, score } as const;
  },
];
