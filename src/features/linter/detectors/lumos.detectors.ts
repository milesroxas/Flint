import type { RoleDetector } from "@/features/linter/model/linter.types";

const endsWithWrap = (name: string) => /(?:^|[_-])(wrap|wrapper)$/.test(name);

export const lumosRoleDetectors: RoleDetector[] = [
  // main: strong signal on canonical class names
  ({ classNames, elementId }) => {
    const hit = classNames.find(
      (n) => n === "page_main" || n === "main-wrapper"
    );
    if (hit) return { elementId, role: "main", score: 0.95 } as const;
    return null;
  },

  // section: u-section* or section_*
  ({ classNames, elementId }) => {
    const hit = classNames.find(
      (n) => n.startsWith("u-section") || /^section_/.test(n)
    );
    if (hit) return { elementId, role: "section", score: 0.85 } as const;
    return null;
  },

  // componentRoot vs childGroup: tokens and wrap suffix
  ({ classNames, parsedFirstCustom, elementId }) => {
    if (
      !parsedFirstCustom ||
      !parsedFirstCustom.tokens ||
      parsedFirstCustom.tokens.length === 0
    )
      return null;
    const first =
      classNames.find((n) => n === parsedFirstCustom.raw) ??
      parsedFirstCustom.raw;
    if (!endsWithWrap(first)) return null;
    const tokenCount = parsedFirstCustom.tokens?.length ?? 0;
    // heuristic: 2 tokens + wrap → root; >=3 tokens + wrap → childGroup
    if (tokenCount >= 3) {
      return { elementId, role: "childGroup", score: 0.72 } as const;
    }
    return { elementId, role: "componentRoot", score: 0.74 } as const;
  },
];
