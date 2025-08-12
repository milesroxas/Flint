import type { GrammarAdapter, ParsedClass, ClassKind } from "@/features/linter/model/linter.types";

function getClassKind(name: string): ClassKind {
  if (name.startsWith("u-")) return "utility";
  if (name.startsWith("c-")) return "component" as ClassKind; // tolerated by ClassKind union via assignment narrowing
  // Treat variant-like classes as combos even when incorrectly formatted
  // Matches: is-foo, is_bar, isActive
  const comboLike = /^(?:is-[A-Za-z0-9]|is_[A-Za-z0-9]|is[A-Z]).*/;
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
  return parsed;
}

export const lumosGrammar: GrammarAdapter = {
  id: "lumos",
  isCustomFirstRequired: true,
  utilityPrefix: "u-",
  componentPrefix: "c-",
  comboPrefix: "is-",
  parse(name: string): ParsedClass {
    const kind = getClassKind(name);
    if (kind !== "custom") {
      return { raw: name, kind } as ParsedClass;
    }
    return parseCustom(name);
  },
};


