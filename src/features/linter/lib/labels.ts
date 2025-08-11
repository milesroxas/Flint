import type { ElementContext } from "@/entities/element/model/element-context.types";
import type { ElementRole } from "@/features/linter/model/linter.types";

export function toTitleCase(input: string): string {
  return input.replace(/(^|[_-])(\w)/g, (_, p1, p2) => (p1 ? " " : "") + p2.toUpperCase());
}

export function contextToLabel(ctx: ElementContext): string {
  if (ctx === "componentRoot") return "Component Root";
  return toTitleCase(String(ctx));
}

export function roleToLabel(role: ElementRole): string {
  if (role === "componentRoot") return "Component Root";
  return toTitleCase(String(role));
}


