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
 * All utility classes that ship with the standard Client-First template.
 * These should be excluded from duplicate-property checks since users did not
 * create them — they are premade by the template and may intentionally share
 * property values.
 */
export const CF_BUILTIN_UTILITY_CLASSES: readonly string[] = [
  // Structure
  "page-wrapper",
  "main-wrapper",
  "global-styles",
  "spacing-clean",
  // Padding — horizontal wrappers
  "padding-global",
  "padding-custom1",
  "padding-custom2",
  // Padding — vertical section sizes
  "padding-section-small",
  "padding-section-medium",
  "padding-section-large",
  // Containers — max-width constraints
  "container-small",
  "container-medium",
  "container-large",
];

/** Check whether a class name represents the page-wrapper role. */
export function isPageWrapperClass(cls: string): boolean {
  return cls === "page-wrapper" || cls.endsWith("-page-wrapper");
}

/** Client-First `container-[size]` utilities (padding-global → container chain). */
export const CF_CONTAINER_CLASS_PREFIX = "container-" as const;

/**
 * Prefixes for core structure utility systems in Client-First.
 */
export const CF_CORE_STRUCTURE_PREFIXES = [CF_CONTAINER_CLASS_PREFIX, "padding-section-"] as const;

/** True if the class is a Client-First container utility (e.g. container-large). */
export function isContainerUtilityClass(name: string): boolean {
  return name.startsWith(CF_CONTAINER_CLASS_PREFIX);
}

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

/**
 * Check if a token ends with a wrapper suffix.
 * In Client-First, element names use dashes, so "content-wrapper" is a single token
 * where "-wrapper" is the suffix.
 */
function isWrapperToken(token: string): boolean {
  const lower = token.toLowerCase();
  return lower === "wrap" || lower === "wrapper" || lower.endsWith("-wrap") || lower.endsWith("-wrapper");
}

function parseCustom(name: string): ParsedClass {
  // Client-First: underscore `_` is the ONLY folder separator.
  // Dashes within each segment are meaningful (e.g., "team-list_headshot-image"
  // = folder "team-list", element "headshot-image"). Do NOT normalize dashes.
  const tokens = name.split("_").filter(Boolean);
  const parsed: ParsedClass = {
    raw: name,
    kind: "custom",
    tokens,
  };

  if (tokens.length > 0) parsed.type = tokens[0];
  if (tokens.length > 2) parsed.variation = tokens.slice(1, -1).join("_") || undefined;
  if (tokens.length >= 2) parsed.elementToken = tokens[tokens.length - 1];

  // Extract componentKey: for wrapper patterns, exclude the wrapper suffix
  // e.g., "home-testimonials_wrapper" -> "home-testimonials", "team-list_headshot-wrapper" -> "team-list"
  if (tokens.length >= 2) {
    const lastToken = tokens[tokens.length - 1] ?? "";
    if (isWrapperToken(lastToken)) {
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
      // Client-First: treat `section_[root]` as component root and key = root token
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
        // - 3+ underscore-tokens (nested folders): use first two as componentKey
        // - 1-2 underscore-tokens: use first token as componentKey
        if (tokens.length >= 3) {
          parsed.componentKey = tokens.slice(0, 2).join("_");
        } else if (tokens.length >= 1) {
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

/**
 * Tokenize a Client-First custom class name by splitting on underscore only.
 * Dashes within segments are preserved (e.g., "team-list_headshot-image" → ["team-list", "headshot-image"]).
 * This is the single source of truth for CF tokenization — use this instead of manual splitting.
 */
export const tokenizeCFCustomClass = (name: string): string[] => name.split("_").filter(Boolean);

/**
 * Dash-only names are classified as "utility" for Client-First, but a single segment without
 * hyphens (e.g. `button`, `icon`) is a semantic part name inside components — not a token utility
 * like `background-color-primary`. Those should not be consolidated against hyphenated utilities.
 */
export function isClientFirstDashlessSemanticClassName(className: string): boolean {
  if (!className || className.includes("-") || className.includes("_")) return false;
  if (className.startsWith("u-") || className.startsWith("is-") || className.startsWith("c-")) return false;
  return true;
}

export const clientFirstGrammar: GrammarAdapter = {
  id: "client-first",
  isCustomFirstRequired: true,
  utilityPrefix: "u-",
  componentPrefix: "c-",
  comboPrefix: "is-",
  elementSeparator: "-",
  parse(name: string): ParsedClass {
    const kind = getClassType(name);
    if (kind !== "custom") {
      return { raw: name, kind } as ParsedClass;
    }
    return parseCustom(name);
  },
};
