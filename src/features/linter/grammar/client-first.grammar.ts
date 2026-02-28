import type { GrammarAdapter, ParsedClass } from "@/features/linter/model/linter.types";
import type { ClassType } from "@/features/linter/model/rule.types";

/**
 * Core structure class names that are global/structural in Client-First.
 * These use dashes only and are NOT custom-folder classes.
 */
export const CF_CORE_STRUCTURE_CLASSES = new Set([
  "page-wrapper",
  "main-wrapper",
  "padding-global",
  "global-styles",
  "spacing-clean",
]);

/**
 * Prefixes for core structure utility systems in Client-First.
 */
export const CF_CORE_STRUCTURE_PREFIXES = ["container-", "padding-section-"] as const;

/**
 * Client-First class type classification.
 *
 * Key convention:
 * - Underscore `_` in the name → **custom** (folder convention: `folder_element`)
 * - `is-` prefix → **combo** (variant modifier)
 * - `u-` prefix → **utility** (explicit utility prefix)
 * - Everything else (dash-only) → **utility** (Client-First utility/global class)
 */
function getClassType(name: string): ClassType {
  if (name.startsWith("u-")) return "utility";
  if (name.startsWith("c-")) return "component" as ClassType;
  if (name.startsWith("is-")) return "combo";
  // Client-First convention: underscore = custom folder class
  if (name.includes("_")) return "custom";
  // Dash-only classes are utility/global in Client-First
  return "utility";
}

function parseCustom(name: string): ParsedClass {
  // Client-First commonly uses kebab for structure; normalize tokens for role extraction
  const normalized = name.replace(/-/g, "_");
  const tokens = normalized.split("_").filter(Boolean);
  const parsed: ParsedClass = {
    raw: name,
    kind: "custom",
    tokens,
  };

  if (tokens.length > 0) parsed.type = tokens[0];
  if (tokens.length > 2) parsed.variation = tokens.slice(1, -1).join("_") || undefined;
  if (tokens.length >= 2) parsed.elementToken = tokens[tokens.length - 1];

  // Extract componentKey: for wrapper patterns, exclude the wrapper suffix
  // e.g., "home-testimonials_wrapper" -> "home_testimonials", "home-testimonial-cta_wrapper" -> "home_testimonial"
  if (tokens.length >= 2) {
    const lastToken = tokens[tokens.length - 1]?.toLowerCase();
    if (lastToken === "wrap" || lastToken === "wrapper") {
      // Remove wrapper suffix and use the remaining tokens as componentKey
      const keyTokens = tokens.slice(0, -1);
      if (keyTokens.length >= 2) {
        // For child groups, use the first two tokens to match component root
        parsed.componentKey = keyTokens.slice(0, 2).join("_");
      } else if (keyTokens.length === 1) {
        // For simple wrappers, use the single token
        parsed.componentKey = keyTokens[0];
      } else {
        parsed.componentKey = null;
      }
    } else {
      // Client-First: treat `section_[root]-[variant]` as component root and key = `root_variant`
      if (tokens[0]?.toLowerCase() === "section") {
        if (tokens.length >= 3) {
          parsed.componentKey = tokens.slice(1, 3).join("_");
        } else if (tokens.length === 2) {
          parsed.componentKey = tokens[1];
        } else {
          parsed.componentKey = null;
        }
      } else {
        // For other non-wrapper classes in Client-First:
        // Component key extraction depends on the element's role:
        // - Component roots (single or two tokens): use first token only
        // - Child groups (3+ tokens): use first two tokens to capture variant
        if (tokens.length >= 3) {
          // Likely child group: use first two tokens (name + variant)
          parsed.componentKey = tokens.slice(0, 2).join("_");
        } else if (tokens.length >= 1) {
          // Likely component root: use first token only
          parsed.componentKey = tokens[0];
        } else {
          parsed.componentKey = null;
        }
      }
    }
  } else {
    parsed.componentKey = null;
  }

  return parsed;
}

export const clientFirstGrammar: GrammarAdapter = {
  id: "client-first",
  isCustomFirstRequired: true,
  utilityPrefix: "u-",
  componentPrefix: "c-",
  comboPrefix: "is-",
  parse(name: string): ParsedClass {
    const kind = getClassType(name);
    if (kind !== "custom") {
      return { raw: name, kind } as ParsedClass;
    }
    return parseCustom(name);
  },
};
