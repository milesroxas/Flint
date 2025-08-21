// Shared wrapper detection utilities to eliminate code duplication
import type {
  RoleDetector,
  ElementSnapshot,
  DetectionContext,
} from "@/features/linter/model/preset.types";

/** Accept underscore or hyphen suffixes for wrap */
const WRAP_SUFFIX_RE = /(?:^|[_-])(wrap|wrapper)$/i;

/** Split class name into tokens */
const splitTokens = (name: string) => name.split(/[_-]+/).filter(Boolean);

/** Check if a class name ends with wrap/wrapper */
export const endsWithWrap = (name: string) => WRAP_SUFFIX_RE.test(name);

/** Tokens that often indicate a child group wrapper rather than the component root */
export const SUBPART_HINTS = new Set([
  "inner",
  "content",
  "media",
  "image",
  "grid",
  "list",
  "item",
  "header",
  "footer",
  "title",
  "subtitle",
  "copy",
  "desc",
  "description",
  "meta",
  "actions",
  "links",
  "buttons",
  "button",
  "badge",
  "cta",
  "group", // Added: elements with "group" in name are likely child groups
]);

/** Heuristic to decide componentRoot vs childGroup based on a base name ending in wrap/wrapper */
export const classifyWrapName = (
  name: string
): "componentRoot" | "childGroup" | null => {
  if (!WRAP_SUFFIX_RE.test(name)) return null;

  const tokens = splitTokens(name);
  const last = tokens[tokens.length - 1]?.toLowerCase();
  const base =
    last === "wrap" || last === "wrapper" ? tokens.slice(0, -1) : tokens;

  // Check if any token hints at subpart
  const hasSubpartHint = base.some((token) =>
    SUBPART_HINTS.has(token.toLowerCase())
  );

  return hasSubpartHint ? "childGroup" : "componentRoot";
};

/**
 * Structural validation: is this element truly a child group?
 * - Must have children (to be a "group")
 * - Must be nested inside a componentRoot
 * - Must NOT be a componentRoot itself (component boundary)
 * - Must NOT be directly under a section (sections are component boundaries)
 */
export const isStructuralChildGroup = (
  elementId: string,
  context: DetectionContext
): { isChildGroup: boolean; reason: string; componentRootId?: string } => {
  const { rolesByElement, graph } = context;

  if (!graph) {
    return {
      isChildGroup: false,
      reason: "No graph context available for structural analysis",
    };
  }

  // 1. Must have at least one child element to be a "group"
  const children = graph.getChildrenIds(elementId);
  if (children.length === 0) {
    return {
      isChildGroup: false,
      reason: "Element has no children - cannot be a grouping wrapper",
    };
  }

  // 2. CRITICAL: Element must NOT be a componentRoot itself
  // ComponentRoots define component boundaries - they are NOT child groups
  const currentRole = rolesByElement?.[elementId];
  if (currentRole === "componentRoot") {
    return {
      isChildGroup: false,
      reason:
        "Element is already a componentRoot - component boundaries cannot be child groups",
    };
  }

  // 3. Check if element is directly under a section (component boundary)
  const parentId = graph.getParentId(elementId);
  if (parentId) {
    const parentRole = rolesByElement?.[parentId];
    if (parentRole === "section" || parentRole === "main") {
      return {
        isChildGroup: false,
        reason: `Element is direct child of ${parentRole} - section boundaries define component roots, not child groups`,
      };
    }
  }

  // 4. Must be nested inside a componentRoot (but not directly under a section)
  const ancestors = graph.getAncestorIds(elementId);
  const componentRootId = ancestors.find(
    (ancestorId) => rolesByElement?.[ancestorId] === "componentRoot"
  );

  if (!componentRootId) {
    return {
      isChildGroup: false,
      reason: "Element is not nested inside a componentRoot",
    };
  }

  return {
    isChildGroup: true,
    reason: `Structural child group: has ${children.length} children, nested in componentRoot ${componentRootId}`,
    componentRootId,
  };
};

/**
 * Create a wrapper detector with preset-specific naming logic
 */
export const createWrapperDetector = (config: {
  id: string;
  description: string;
  classifyNaming: (firstClass: string) => "componentRoot" | "childGroup" | null;
}): RoleDetector => ({
  id: config.id,
  description: config.description,
  detect: (element: ElementSnapshot, context: DetectionContext) => {
    const firstClass = element.classes[0];
    if (!firstClass || !endsWithWrap(firstClass)) return null;

    // Step 1: Get naming-based classification
    const namedRole = config.classifyNaming(firstClass);
    if (!namedRole) return null;

    // Step 2: If we have structural context, validate the classification
    if (context.rolesByElement && context.graph) {
      const structural = isStructuralChildGroup(element.id, context);

      console.log(`[DEBUG] Wrapper detection for ${element.id}:`, {
        firstClass,
        namedRole,
        structural: structural.reason,
        isStructuralChildGroup: structural.isChildGroup,
      });

      // Apply structural override logic
      if (structural.isChildGroup && namedRole === "componentRoot") {
        // Naming suggests componentRoot, but structurally it's a childGroup
        console.log(
          `[DEBUG] Structural override: ${element.id} ${namedRole} → childGroup`
        );
        return { role: "childGroup", score: 0.95 };
      } else if (!structural.isChildGroup && namedRole === "childGroup") {
        // Naming suggests childGroup, but structurally it's not (likely componentRoot)
        console.log(
          `[DEBUG] Structural override: ${element.id} ${namedRole} → componentRoot`
        );
        return { role: "componentRoot", score: 0.9 };
      }
    }

    // No override needed, use naming classification
    const score = namedRole === "componentRoot" ? 0.85 : 0.8;
    return { role: namedRole, score };
  },
});
