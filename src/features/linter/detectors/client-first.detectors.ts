/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  RoleDetector,
  ElementSnapshot,
  DetectionContext,
} from "@/features/linter/model/preset.types";

const endsWithWrap = (name: string) => /(?:^|[_-])(wrap|wrapper)$/.test(name);

export const clientFirstRoleDetectors: RoleDetector[] = [
  {
    id: "client-first-main-detector",
    description: "Detects main elements using Client-First naming conventions",
    detect: (element: ElementSnapshot, _context: DetectionContext) => {
      const hit = element.classes.find(
        (n) => n === "main-wrapper" || /^main_/.test(n)
      );
      if (hit) return { role: "main", score: 0.95 };
      return null;
    },
  },
  {
    id: "client-first-section-detector",
    description:
      "Detects section elements using Client-First naming conventions",
    detect: (element: ElementSnapshot, _context: DetectionContext) => {
      // Check for utility class u-section
      if (element.classes.includes("u-section")) {
        return { role: "section", score: 0.9 };
      }

      // Check for traditional section_* or section-* patterns
      const hit = element.classes.find((n) => /^section[_-]/.test(n));
      if (hit) return { role: "section", score: 0.85 };

      return null;
    },
  },
  {
    id: "client-first-wrapper-detector",
    description:
      "Detects component roots and child groups using wrapper naming patterns",
    detect: (element: ElementSnapshot, context: DetectionContext) => {
      // For Client-First, we'll use a simplified heuristic since we don't have parsed data
      const firstClass = element.classes[0];
      if (!firstClass || !endsWithWrap(firstClass)) return null;

      // Simple heuristic: if the class has 3+ tokens, likely childGroup, otherwise componentRoot
      const tokenCount = firstClass.split(/[_-]/).filter(Boolean).length;
      const role = tokenCount >= 3 ? "childGroup" : "componentRoot";

      // Context-aware scoring: promote if under a section, similar to Lumos pattern
      const ancestors: readonly ElementSnapshot[] = (() => {
        try {
          const out: ElementSnapshot[] = [];
          const byId = new Map(
            context.allElements.map((e) => [e.id, e] as const)
          );
          let current: ElementSnapshot | undefined =
            byId.get(element.parentId ?? "") ?? undefined;
          while (current !== undefined) {
            out.push(current);
            current = current.parentId
              ? byId.get(current.parentId) ?? undefined
              : undefined;
          }
          return out;
        } catch {
          return [] as ElementSnapshot[];
        }
      })();

      const ancestorHasSection = ancestors.some((a) => {
        const tag = (a.tagName ?? "").toLowerCase();
        if (tag === "section") return true;
        // Client-First section pattern: section_* or section-*
        return (a.classes ?? []).some((c) => /^section[_-]/.test(c));
      });

      // Base scores with context adjustment
      let score = role === "componentRoot" ? 0.72 : 0.7;
      if (role === "componentRoot") {
        score = ancestorHasSection
          ? Math.min(1, score + 0.05)
          : Math.max(0.55, score - 0.15);
      } else {
        // childGroup is more plausible when nested appropriately
        score = ancestorHasSection ? Math.min(1, score + 0.02) : score;
      }

      return { role, score };
    },
  },
];
