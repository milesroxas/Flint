import type {
  RoleDetector,
  ElementSnapshot,
} from "@/features/linter/model/preset.types";
import {
  createWrapperDetector,
  classifyWrapName,
} from "@/features/linter/detectors/shared/wrapper-detection";

export const clientFirstRoleDetectors: RoleDetector[] = [
  {
    id: "client-first-main-detector",
    description: "Detects main elements using Client-First naming conventions",
    detect: (element: ElementSnapshot) => {
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
    detect: (element: ElementSnapshot) => {
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
  // WRAP suffix → componentRoot vs childGroup (using shared logic)
  createWrapperDetector({
    id: "client-first-wrapper-detector",
    description:
      "Detects component roots and child groups using Client-First wrapper naming patterns",
    classifyNaming: (firstClass: string) => {
      // For Client-First, use simplified token count heuristic
      const tokenCount = firstClass.split(/[_-]/).filter(Boolean).length;

      // If it has clear naming hints, use classifyWrapName
      const classified = classifyWrapName(firstClass);
      if (classified) return classified;

      // Fallback: simple token count rule for Client-First
      return tokenCount >= 3 ? "childGroup" : "componentRoot";
    },
  }),
];
