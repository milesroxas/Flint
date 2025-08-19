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
      const hit = element.classes.find((n) => /^section[_-]/.test(n));
      if (hit) return { role: "section", score: 0.85 };
      return null;
    },
  },
  {
    id: "client-first-wrapper-detector",
    description:
      "Detects component roots and child groups using wrapper naming patterns",
    detect: (element: ElementSnapshot, _context: DetectionContext) => {
      // For Client-First, we'll use a simplified heuristic since we don't have parsed data
      const firstClass = element.classes[0];
      if (!firstClass || !endsWithWrap(firstClass)) return null;

      // Simple heuristic: if the class has 3+ tokens, likely childGroup, otherwise componentRoot
      const tokenCount = firstClass.split(/[_-]/).filter(Boolean).length;
      if (tokenCount >= 3) {
        return { role: "childGroup", score: 0.7 };
      }
      return { role: "componentRoot", score: 0.72 };
    },
  },
];
