// src/features/linter/utils/id-utils.ts
export function toElementKey(el: unknown): string {
  const anyEl = el as any;
  return String(
    (anyEl?.id && anyEl.id.element) ?? anyEl?.id ?? anyEl?.nodeId ?? ""
  );
}
