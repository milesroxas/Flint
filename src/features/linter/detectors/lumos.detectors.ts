// src/features/linter/presets/lumos/lumos.role-detectors.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  RoleDetector,
  ElementSnapshot,
  DetectionContext,
} from "@/features/linter/model/preset.types";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import {
  createWrapperDetector,
  classifyWrapName,
} from "@/features/linter/detectors/shared/wrapper-detection";

export const lumosRoleDetectors: RoleDetector[] = [
  // MAIN detector
  {
    id: "lumos-main-detector",
    description: "Detects main elements using Lumos naming conventions",
    detect: (element: ElementSnapshot, _context: DetectionContext) => {
      // Strong naming signal per Lumos
      if (element.classes?.some((n) => n === "page_main")) {
        return { role: "main", score: 0.95 };
      }
      // Soft tag fallback if available
      const tag = element.tagName?.toLowerCase();
      if (tag === "main") return { role: "main", score: 0.6 };
      return null;
    },
  },

  // SECTION detector
  {
    id: "lumos-section-detector",
    description: "Detects section elements using Lumos naming conventions",
    detect: (element: ElementSnapshot, _context: DetectionContext) => {
      // Check for utility class u-section (common across frameworks)
      if (element.classes?.includes("u-section")) {
        return { role: "section", score: 0.95 };
      }

      // Tag as soft hint
      const tag = element.tagName?.toLowerCase();
      if (tag === "section") return { role: "section", score: 0.7 };

      // Lumos base naming: section_* as a custom base (do not key off utilities)
      if (element.classes?.some((n) => /^section_/.test(n))) {
        return { role: "section", score: 0.9 };
      }
      return null;
    },
  },

  // WRAP suffix → componentRoot vs childGroup (using shared logic)
  createWrapperDetector({
    id: "lumos-wrapper-detector",
    description:
      "Detects component roots and child groups using Lumos wrapper naming patterns",
    classifyNaming: (firstClass: string) => {
      // Prefer grammar awareness when possible to choose a custom base
      const parsed = lumosGrammar.parse(firstClass);
      const base =
        parsed.kind === "custom" && parsed.elementToken
          ? firstClass
          : firstClass;
      return classifyWrapName(base);
    },
  }),
];
