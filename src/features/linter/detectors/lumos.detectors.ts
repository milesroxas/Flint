// src/features/linter/presets/lumos/lumos.role-detectors.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  RoleDetector,
  ElementSnapshot,
  DetectionContext,
} from "@/features/linter/model/preset.types";

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
  // Prefer a class that looks like a Lumos base (contains underscore)
  const base = classNames.find((n) => n.includes("_")) ?? classNames[0];
  return base ?? "";
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
      // Tag as soft hint
      const tag = element.tagName?.toLowerCase();
      if (tag === "section") return { role: "section", score: 0.7 };

      // Lumos base naming: section_* as a custom base (do not key off utilities)
      if (element.classes?.some((n) => /^section_/.test(n))) {
        return { role: "section", score: 0.85 };
      }
      return null;
    },
  },

  // WRAP suffix → componentRoot vs childGroup
  {
    id: "lumos-wrapper-detector",
    description:
      "Detects component roots and child groups using wrapper naming patterns",
    detect: (element: ElementSnapshot, _context: DetectionContext) => {
      const base = pickFallbackBase(element.classes);
      if (!base) return null;

      const role = classifyWrapName(base);
      if (!role) return null;

      const score = role === "componentRoot" ? 0.9 : 0.86;
      return { role, score };
    },
  },
];
