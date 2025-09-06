import type {
  RoleDetector,
  ElementSnapshot,
} from "@/features/linter/model/preset.types";
import {
  createWrapperDetector,
  classifyWrapName,
} from "@/features/linter/detectors/shared/wrapper-detection";
import { SUBPART_HINTS, canBeComponentRoot, isStructuralChildGroup } from "@/features/linter/detectors/shared/wrapper-detection";

export const clientFirstRoleDetectors: RoleDetector[] = [
  {
    id: "client-first-main-detector", 
    description: "Detects main elements using Client-First naming conventions",
    detect: (element: ElementSnapshot, context) => {
      // Client-First main should be exactly "main-wrapper"
      if (!element.classes.includes("main-wrapper")) return null;

      // If we have structural context, validate parent relationship
      if (context?.graph && context?.rolesByElement) {
        const parentId = context.graph.getParentId(element.id);
        if (parentId) {
          // Check if parent is page-wrapper (or elements ending with page-wrapper)
          const parentElement = context.allElements?.find(el => el.id === parentId);
          const hasPageWrapper = parentElement?.classes.some(cls => 
            cls === "page-wrapper" || cls.endsWith("-page-wrapper")
          );
          
          if (!hasPageWrapper) {
            // Not a child of page-wrapper, lower confidence
            return { role: "main", score: 0.7 };
          }
        }
      }

      return { role: "main", score: 0.95 };
    },
  },
  {
    id: "client-first-section-detector",
    description:
      "Detects section elements using Client-First naming conventions",
    detect: (element: ElementSnapshot) => {
      // Check for utility class u-section
      if (element.classes.includes("section_")) {
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
  {
    id: "client-first-section-root-as-component-root",
    description:
      "Treats section_[root][-variant]? as component roots (variant optional)",
    detect: (element: ElementSnapshot, context) => {
      const firstClass = element.classes[0];
      if (!firstClass) return null;

      // Normalize for underscore/hyphen patterns
      const normalized = firstClass.toLowerCase();

      // Accept optional variant: section_root or section_root-variant
      const match = normalized.match(/^section(?:[_-])[a-z0-9]+(?:(?:[_-])[a-z0-9]+)?$/);
      if (!match) return null;

      // Validate structurally when graph is available
      if (context?.graph && context?.rolesByElement) {
        const can = canBeComponentRoot(element.id, context as any);
        if (!can.canBe) return null; // let other detectors classify if structure disagrees
      }

      // Strong score so it wins over the plain section detector
      return { role: "componentRoot", score: 0.93 };
    },
  },
  {
    id: "client-first-subpart-childgroup-detector",
    description:
      "Detects child groups by common subpart suffixes (_grid, -content, etc.) even without wrap/wrapper",
    detect: (element, context) => {
      const firstClass = element.classes[0];
      if (!firstClass) return null;

      // If it already ends with wrap/wrapper, let the wrapper detector handle it
      if (/(?:^|[_-])(wrap|wrapper)$/i.test(firstClass)) return null;

      // Tokenize and look at the tail segment (supports hyphen or underscore)
      const tokens = firstClass.split(/[_-]+/).filter(Boolean);
      const last = tokens[tokens.length - 1]?.toLowerCase();

      // Prefer elements that actually wrap a group (have children), but don't require it
      // since the canonical rule has grammar-based fallback validation anyway
      const hasChildren = (element.childrenIds?.length ?? 0) > 0;

      // If the tail is a known subpart hint (grid, content, media, etc.),
      // classify as childGroup so canonical rules (like childgroup-key-match)
      // can validate presence of a component root and key matching.
      if (last && SUBPART_HINTS.has(last)) {
        // For Client-First: validate structural context when available
        if (context?.graph && context?.rolesByElement) {
          const structural = isStructuralChildGroup(element.id, context as any);
          
          if (!structural.isChildGroup) {
            // Naming suggests childGroup, but structurally it doesn't fit
            // In Client-First, this might be a component root instead
            return { role: "componentRoot", score: 0.8 };
          }
        }

        // Slightly higher score if element actually has children (more confident detection)
        const score = hasChildren ? 0.85 : 0.82;
        return { role: "childGroup", score };
      }

      return null;
    },
  },
  {
    id: "client-first-page-slot-main-fallback",
    description: "Fallback detection for page slots as main elements when no main-wrapper class found",
    detect: (element: ElementSnapshot, context) => {
      // Only run this fallback if no main role has been detected yet
      if (context?.rolesByElement && Object.values(context.rolesByElement).includes("main")) {
        return null; // Main already detected, don't interfere
      }

      // Check if this is a page slot (no element type but has component+element ID)
      const elementIdObj = element.id as any;
      const isPageSlot = !element.tagName && 
                        elementIdObj?.id?.component && 
                        elementIdObj?.id?.element;
      
      if (!isPageSlot) return null;

      // Must be under page-wrapper to be considered main
      if (context?.graph && context?.allElements) {
        const parentId = context.graph.getParentId(element.id);
        if (parentId) {
          const parentElement = context.allElements.find(el => el.id === parentId);
          const isUnderPageWrapper = parentElement?.classes.some(cls => 
            cls === "page-wrapper" || cls.endsWith("-page-wrapper")
          );
          
          if (isUnderPageWrapper) {
            // Count how many page slots exist under page-wrapper
            const allPageSlots = context.allElements.filter(el => {
              const elIdObj = el.id as any;
              const isSlot = !el.tagName && elIdObj?.id?.component && elIdObj?.id?.element;
              if (!isSlot) return false;
              
              const slotParentId = context.graph!.getParentId(el.id);
              if (!slotParentId) return false;
              
              const slotParent = context.allElements!.find(p => p.id === slotParentId);
              return slotParent?.classes.some(cls => cls === "page-wrapper" || cls.endsWith("-page-wrapper"));
            });

            if (allPageSlots.length === 1) {
              // Single page slot under page-wrapper - assign main role with warning
              return { 
                role: "main", 
                score: 0.8,
                reasoning: "Single page slot under page-wrapper detected as main (configure with main-wrapper class and <main> tag)"
              };
            } else if (allPageSlots.length > 1) {
              // Multiple slots - assign main to first one found
              const isFirstSlot = allPageSlots[0].id === element.id;
              if (isFirstSlot) {
                return { 
                  role: "main", 
                  score: 0.75,
                  reasoning: "First page slot of multiple under page-wrapper detected as main (configure with main-wrapper class and <main> tag)"
                };
              }
            }
          }
        }
      }

      return null;
    },
  },
];
