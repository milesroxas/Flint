import type {
  GrammarAdapter,
  ParsedClass,
} from "@/features/linter/model/linter.types";
import type { ClassType } from "@/features/linter/model/rule.types";

function getClassType(name: string): ClassType {
  if (name.startsWith("u-")) return "utility";
  if (name.startsWith("c-")) return "component" as ClassType; // tolerated by ClassKind union via assignment narrowing
  // Treat variant-like classes as combos even when incorrectly formatted
  // Matches: is-foo, is_bar, isActive
  const comboLike = /^(?:is[-_][A-Za-z0-9_]+|is[A-Z][A-Za-z0-9_]*)$/;
  if (comboLike.test(name)) return "combo";
  return "custom";
}

function parseCustom(name: string): ParsedClass {
  const tokens = name.split("_").filter(Boolean);
  const parsed: ParsedClass = {
    raw: name,
    kind: "custom",
    tokens,
  };

  if (tokens.length > 0) {
    parsed.type = tokens[0];
  }
  if (tokens.length > 2) {
    // Assume middle token is variation when there are 3+ tokens
    parsed.variation = tokens.slice(1, -1).join("_") || undefined;
  }
  if (tokens.length >= 2) {
    parsed.elementToken = tokens[tokens.length - 1];
  }

  // Extract componentKey consistently for both componentRoot and childGroup
  // componentRoot: name_variant_wrap → componentKey: name_variant
  // childGroup: name_variant_element_wrap → componentKey: name_variant
  if (tokens.length >= 2) {
    const lastToken = tokens[tokens.length - 1]?.toLowerCase();
    if (lastToken === "wrap" || lastToken === "wrapper") {
      const keyTokens = tokens.slice(0, -1); // Remove wrapper suffix

      if (keyTokens.length >= 2) {
        // Always use first two tokens for componentKey (name_variant)
        // This ensures both "hero_primary_wrap" and "hero_primary_cta_wrap"
        // have the same componentKey: "hero_primary"
        parsed.componentKey = keyTokens.slice(0, 2).join("_");
      } else if (keyTokens.length === 1) {
        // Single token case (e.g., "hero_wrap")
        parsed.componentKey = keyTokens[0];
      } else {
        parsed.componentKey = null;
      }
    } else {
      // For non-wrapper classes, use first two tokens if available
      if (tokens.length >= 2) {
        parsed.componentKey = tokens.slice(0, 2).join("_");
      } else {
        parsed.componentKey = tokens[0] || null;
      }
    }
  } else {
    parsed.componentKey = null;
  }

  return parsed;
}

export const lumosGrammar: GrammarAdapter = {
  id: "lumos",
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
