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
    detect: (element: ElementSnapshot, context: DetectionContext) => {
      // Lumos main should be exactly "page_main"
      if (!element.classes?.some((n) => n === "page_main")) {
        // Remove soft tag fallback since Webflow doesn't expose native HTML tags reliably
        return null;
      }

      // If we have structural context, validate parent relationship
      if (context?.graph && context?.rolesByElement) {
        const parentId = context.graph.getParentId(element.id);
        if (parentId) {
          // Check if parent is page_wrap (or elements ending with page_wrap)
          const parentElement = context.allElements?.find(el => el.id === parentId);
          const hasPageWrap = parentElement?.classes.some(cls => 
            cls === "page_wrap" || cls.endsWith("_page_wrap")
          );
          
          if (!hasPageWrap) {
            // Not a child of page_wrap, lower confidence
            return { role: "main", score: 0.7 };
          }
        }
      }

      return { role: "main", score: 0.95 };
    },
  },

  // SECTION detector
  {
    id: "lumos-section-detector",
    description: "Detects section elements using Lumos naming conventions",
    detect: (element: ElementSnapshot) => {
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

  // Fallback: detect page slots as main when no proper main class found
  {
    id: "lumos-page-slot-main-fallback",
    description: "Fallback detection for page slots as main elements when no page_main class found",
    detect: (element: ElementSnapshot, context: DetectionContext) => {
      // Only run this fallback if no main role has been detected yet
      if (context?.rolesByElement && Object.values(context.rolesByElement).includes("main")) {
        return null; // Main already detected, don't interfere
      }

      // First, check if this element is under page_wrap (page slots are children of page_wrap)
      if (!context?.graph) return null;
      
      const parentId = context.graph.getParentId(element.id);
      if (!parentId) return null;
      
      const parentElement = context.allElements?.find(el => el.id === parentId);
      const isUnderPageWrap = parentElement?.classes.some(cls => 
        cls === "page_wrap" || cls.endsWith("_page_wrap")
      );
      
      if (!isUnderPageWrap) return null; // Not a child of page_wrap
      
      // Page slots are children of page_wrap that have:
      // 1. Minimal/no classes (they're structural containers)
      // 2. No semantic class names (no page_, section_, component_ patterns)
      const hasMinimalClasses = element.classes.length <= 1;
      const hasNoSemanticClasses = !element.classes.some(cls => 
        cls.includes('page_') || cls.includes('section_') || cls.includes('component_')
      );
      
      const isLikelyPageSlot = hasMinimalClasses && hasNoSemanticClasses;
      
      if (!isLikelyPageSlot) return null;
      return { 
        role: "main", 
        score: 0.8,
        reasoning: "Page slot under page_wrap detected as main (configure with page_main class and <main> tag)"
      };
    },
  },
];
