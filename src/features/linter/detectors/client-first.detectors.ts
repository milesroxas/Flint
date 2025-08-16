import type { RoleDetector } from "@/features/linter/model/linter.types";

const endsWithWrap = (name: string) => /(?:^|[_-])(wrap|wrapper)$/.test(name);

export const clientFirstRoleDetectors: RoleDetector[] = [
  ({ classNames, elementId }) => {
    const hit = classNames.find(
      (n) => n === "main-wrapper" || /^main_/.test(n)
    );
    if (hit) return { elementId, role: "main", score: 0.95 } as const;
    return null;
  },
  ({ classNames, elementId }) => {
    const hit = classNames.find((n) => /^section[_-]/.test(n));
    if (hit) return { elementId, role: "section", score: 0.85 } as const;
    return null;
  },
  ({ classNames, parsedFirstCustom, elementId }) => {
    if (!parsedFirstCustom) return null;
    const first =
      classNames.find((n) => n === parsedFirstCustom.raw) ??
      parsedFirstCustom.raw;
    if (!endsWithWrap(first)) return null;
    const tokenCount = parsedFirstCustom.tokens?.length ?? 0;
    if (tokenCount >= 3)
      return { elementId, role: "childGroup", score: 0.7 } as const;
    return { elementId, role: "componentRoot", score: 0.72 } as const;
  },
];
