// src/features/linter/presets/lumos/lumos.role-detectors.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  RoleDetector,
  ElementSnapshot,
  DetectionContext,
} from "@/features/linter/model/preset.types";

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
      // Check for utility classes that indicate sections
      const sectionUtilities = [
        "u-section", // Standard section utility
        "u-hero", // Hero sections
        "u-footer", // Footer sections
        "u-header", // Header sections
        "u-nav", // Navigation sections
        "u-cta", // Call-to-action sections
        "u-testimonial", // Testimonial sections
        "u-features", // Features sections
        "u-pricing", // Pricing sections
        "u-about", // About sections
        "u-contact", // Contact sections
        "u-banner", // Banner sections
      ];

      if (element.classes?.some((cls) => sectionUtilities.includes(cls))) {
        return { role: "section", score: 0.95 };
      }

      // Tag as soft hint
      const tag = element.tagName?.toLowerCase();
      if (tag === "section") return { role: "section", score: 0.7 };

      // Lumos base naming patterns for sections
      const sectionPatterns = [
        /^section_/, // section_primary, section_hero, etc.
        /^hero_/, // hero_primary, hero_main, etc.
        /^footer_/, // footer_primary, footer_main, etc.
        /^header_/, // header_primary, header_main, etc.
        /^nav_/, // nav_primary, nav_main, etc.
        /^cta_/, // cta_primary, cta_main, etc.
        /^testimonial_/, // testimonial_primary, etc.
        /^features_/, // features_primary, etc.
        /^pricing_/, // pricing_primary, etc.
        /^about_/, // about_primary, etc.
        /^contact_/, // contact_primary, etc.
        /^banner_/, // banner_primary, etc.
      ];

      if (
        element.classes?.some((cls) =>
          sectionPatterns.some((pattern) => pattern.test(cls))
        )
      ) {
        return { role: "section", score: 0.9 };
      }
      return null;
    },
  },

  // WRAP suffix → componentRoot vs childGroup (preset-aware grammar-based detection)
  createWrapperDetector({
    id: "lumos-wrapper-detector",
    description:
      "Detects component roots and child groups using Lumos wrapper naming patterns",
    classifyNaming: (firstClass: string) => {
      // Define component boundaries using Lumos grammar patterns
      const componentRootPattern = /^([a-z0-9]+)_(\w+)_wrap$/i;
      const childGroupPattern = /^([a-z0-9]+)_(\w+)_([a-z0-9]+)_wrap$/i;

      // Score patterns and assign roles based on best match
      const rootMatch = componentRootPattern.test(firstClass);
      const childMatch = childGroupPattern.test(firstClass);

      // DEBUG: Log pattern matching for wrapper classes
      if (firstClass.includes("rule_sample_wrap")) {
        console.log(`[DEBUG] Lumos naming classification for ${firstClass}:`, {
          componentRootPattern: componentRootPattern.toString(),
          childGroupPattern: childGroupPattern.toString(),
          rootMatch,
          childMatch,
          finalDecision: childMatch
            ? "childGroup"
            : rootMatch
            ? "componentRoot"
            : "fallback",
        });
      }

      if (childMatch) {
        // Child groups have more segments: name_variant_element_wrap
        return "childGroup";
      } else if (rootMatch) {
        // Component roots have fewer segments: name_variant_wrap
        return "componentRoot";
      }

      // Fall back to shared heuristic for edge cases
      return classifyWrapName(firstClass);
    },
  }),
];
