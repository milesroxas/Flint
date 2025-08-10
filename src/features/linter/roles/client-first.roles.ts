import type { RoleResolver, ParsedClass, ElementRole } from "@/features/linter/model/linter.types";

function norm(s?: string): string { return (s || "").toLowerCase(); }

function mapTokenToRole(token: string): ElementRole {
  const t = norm(token);
  if (t === "wrap" || t === "wrapper") return "componentRoot";
  if (t === "contain" || t === "container") return "container";
  if (t === "layout") return "layout";
  if (t === "content") return "content";
  if (t === "title" || t === "heading" || t === "header") return "title";
  if (t === "text" || t === "paragraph" || t === "rich-text") return "text";
  if (t === "actions" || t === "buttons") return "actions";
  if (t === "button" || t === "btn") return "button";
  if (t === "link") return "link";
  if (t === "icon") return "icon";
  if (t === "list" || t === "collection-list") return "list";
  if (t === "item" || t === "collection-item" || t === "li") return "item";
  return "unknown";
}

export const clientFirstRoles: RoleResolver = {
  id: "client-first",
  mapToRole(parsed: ParsedClass): ElementRole {
    if (parsed.kind !== "custom") return "unknown";
    // Handle common structural wrappers by tokens, already normalized in grammar
    return mapTokenToRole(parsed.elementToken ?? "");
  },
  isContainerLike(parsed: ParsedClass): boolean {
    const token = norm(parsed.elementToken);
    return (
      token === "contain" ||
      token === "container" ||
      token === "layout" ||
      token === "wrapper" ||
      token.startsWith("section") ||
      token === "page" ||
      token === "main" ||
      token === "padding" ||
      token === "padding-global"
    );
  },
};


