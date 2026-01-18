import type { ElementRole } from "@/features/linter/model/linter.types";

export function toTitleCase(input: string): string {
  return input.replace(/(^|[_-])(\w)/g, (_, p1, p2) => (p1 ? " " : "") + p2.toUpperCase());
}

export function roleToLabel(role: ElementRole): string {
  if (role === "componentRoot") return "Component Root";
  return toTitleCase(String(role));
}
