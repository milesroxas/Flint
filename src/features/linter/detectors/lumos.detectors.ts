// src/features/linter/presets/lumos/lumos.role-detectors.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  RoleDetector,
  ElementSnapshot,
  DetectionContext,
} from "@/features/linter/model/preset.types";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";

/** Accept underscore or hyphen suffixes for wrap */
const WRAP_SUFFIX_RE = /(?:^|[_-])(wrap|wrapper)$/i;
const splitTokens = (name: string) => name.split(/[_-]+/).filter(Boolean);

/** Tokens that often indicate a child group wrapper rather than the component root */
const SUBPART_HINTS = new Set([
  "inner",
  "content",
  "media",
  "image",
  "grid",
  "list",
  "item",
  "header",
  "footer",
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
  "badge",
  "cta",
]);

/** Heuristic to decide componentRoot vs childGroup based on a base name ending in wrap/wrapper */
const classifyWrapName = (
  name: string
): "componentRoot" | "childGroup" | null => {
  if (!WRAP_SUFFIX_RE.test(name)) return null;

  const tokens = splitTokens(name);
  const last = tokens[tokens.length - 1]?.toLowerCase();
  const base =
    last === "wrap" || last === "wrapper" ? tokens.slice(0, -1) : tokens;
  if (base.length === 0) return null;

  const tail = base[base.length - 1]?.toLowerCase();
  const looksChild = base.length >= 3 || SUBPART_HINTS.has(tail);
  return looksChild ? "childGroup" : "componentRoot";
};

/** Fallback to a plausible "base custom" when parsedFirstCustom is not provided */
function pickFallbackBase(classNames: readonly string[]): string {
  if (!classNames?.length) return "";

  // Prefer a class that looks like a proper Lumos custom base:
  // - Contains underscore(s) for token separation
  // - Not a utility (u-*), component (c-*), or combo (is-*)
  // - Has multiple tokens (not just single word with underscore)
  const lumosCustom = classNames.find((n) => {
    if (!n.includes("_")) return false;
    if (n.startsWith("u-") || n.startsWith("c-") || n.startsWith("is-"))
      return false;
    const tokens = n.split("_").filter(Boolean);
    return tokens.length >= 2; // Must have at least type + element
  });

  if (lumosCustom) return lumosCustom;

  // Fallback to first underscore-containing class if no proper custom found
  const underscoreClass = classNames.find((n) => n.includes("_"));
  return underscoreClass ?? classNames[0] ?? "";
}

export const lumosRoleDetectors: RoleDetector[] = [
  // MAIN detector
  {
    id: "lumos-main-detector",
    description: "Detects main elements using Lumos naming conventions",
    detect: (element: ElementSnapshot, _context: DetectionContext) => {
      // Strong naming signal per Lumos
      if (element.classes?.some((n) => n === "page_main")) {
        return { role: "main", score: 0.95 };
      }
      // Soft tag fallback if available
      const tag = element.tagName?.toLowerCase();
      if (tag === "main") return { role: "main", score: 0.6 };
      return null;
    },
  },

  // SECTION detector
  {
    id: "lumos-section-detector",
    description: "Detects section elements using Lumos naming conventions",
    detect: (element: ElementSnapshot, _context: DetectionContext) => {
      // Check for utility class u-section (common across frameworks)
      if (element.classes?.includes("u-section")) {
        return { role: "section", score: 0.95 };
      }

      // Tag as soft hint
      const tag = element.tagName?.toLowerCase();
      if (tag === "section") return { role: "section", score: 0.7 };

      // Lumos base naming: section_* as a custom base (do not key off utilities)
      if (element.classes?.some((n) => /^section_/.test(n))) {
        return { role: "section", score: 0.9 };
      }
      return null;
    },
  },

  // WRAP suffix → componentRoot vs childGroup
  {
    id: "lumos-wrapper-detector",
    description:
      "Detects component roots and child groups using wrapper naming patterns",
    detect: (element: ElementSnapshot, context: DetectionContext) => {
      // Prefer grammar awareness when possible to choose a custom base
      const parsedCustoms = (element.classes ?? [])
        .map((n) => lumosGrammar.parse(n))
        .filter((p) => p.kind === "custom");
      const preferred = parsedCustoms.find((p) => !!p.elementToken)?.raw;
      const base = preferred ?? pickFallbackBase(element.classes);
      if (!base) return null;

      const role = classifyWrapName(base);
      if (!role) return null;

      // Context-aware scoring: promote if under a section, demote if not
      const ancestors: readonly ElementSnapshot[] = (() => {
        try {
          const out: ElementSnapshot[] = [];
          // Walk parent links using the snapshot array in context
          const byId = new Map(
            context.allElements.map((e) => [e.id, e] as const)
          );
          let current: ElementSnapshot | undefined =
            byId.get(element.parentId ?? "") ?? undefined;
          while (current !== undefined) {
            out.push(current);
            current = current.parentId
              ? byId.get(current.parentId) ?? undefined
              : undefined;
          }
          return out;
        } catch {
          return [] as ElementSnapshot[];
        }
      })();

      const ancestorHasSection = ancestors.some((a) => {
        // Cheap check: tag name or a class that looks like section_*
        const tag = (a.tagName ?? "").toLowerCase();
        if (tag === "section") return true;
        return (a.classes ?? []).some((c) => /^section_/.test(c));
      });

      // Base scores
      let score = role === "componentRoot" ? 0.9 : 0.86;
      if (role === "componentRoot") {
        score = ancestorHasSection
          ? Math.min(1, score + 0.05)
          : Math.max(0.55, score - 0.2);
      } else {
        // childGroup is more plausible when nested under a root which itself should be under a section
        score = ancestorHasSection ? Math.min(1, score + 0.02) : score;
      }

      return { role, score };
    },
  },
];
