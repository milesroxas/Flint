import type { GrammarAdapter, ParsedClass, ClassKind } from "@/features/linter/model/linter.types";

function getClassKind(name: string): ClassKind {
  if (name.startsWith("u-")) return "utility";
  if (name.startsWith("c-")) return "component" as ClassKind;
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
  if (tokens.length > 2) parsed.variation = tokens.slice(1, -1).join("_") || undefined;
  if (tokens.length >= 2) parsed.elementToken = tokens[tokens.length - 1];
  return parsed;
}

export const clientFirstGrammar: GrammarAdapter = {
  id: "client-first",
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


