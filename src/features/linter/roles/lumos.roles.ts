import type { RoleResolver, ParsedClass, ElementRole } from "@/features/linter/model/linter.types";

function normalizeToken(token: string | undefined): string {
  return (token || "").toLowerCase();
}

function mapTokenToRole(token: string): ElementRole {
  const t = normalizeToken(token);
  if (t === "wrap") return "componentRoot";
  if (t === "contain" || t === "container") return "container";
  if (t === "layout") return "layout";
  if (t === "content") return "content";
  if (t === "title" || t === "heading" || t === "header") return "title";
  if (t === "text" || t === "paragraph" || t === "rich-text") return "text";
  if (t === "actions" || t === "buttons") return "actions";
  if (t === "button" || t === "btn") return "button";
  if (t === "link") return "link";
  if (t === "icon") return "icon";
  if (t === "list") return "list";
  if (t === "item" || t === "li") return "item";
  return "unknown";
}

export const lumosRoles: RoleResolver = {
  id: "lumos",
  mapToRole(parsed: ParsedClass): ElementRole {
    if (parsed.kind !== "custom") return "unknown";
    return mapTokenToRole(parsed.elementToken ?? "");
  },
  isContainerLike(parsed: ParsedClass): boolean {
    const role = this.mapToRole(parsed);
    return role === "container" || role === "layout";
  },
};


