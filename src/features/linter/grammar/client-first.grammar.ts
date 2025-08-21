import type {
  GrammarAdapter,
  ParsedClass,
} from "@/features/linter/model/linter.types";
import type { ClassType } from "@/features/linter/model/rule.types";

function getClassType(name: string): ClassType {
  if (name.startsWith("u-")) return "utility";
  if (name.startsWith("c-")) return "component" as ClassType;
  if (name.startsWith("is-")) return "combo";
  return "custom";
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
  if (tokens.length > 2)
    parsed.variation = tokens.slice(1, -1).join("_") || undefined;
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
