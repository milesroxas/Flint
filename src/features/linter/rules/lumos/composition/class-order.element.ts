import type {
  ElementAnalysisArgs,
  RuleResult,
  ClassType,
  StructureRule,
} from "@/features/linter/model/rule.types";

// Simple classifiers for variants and utilities
const isVariant = (name: string) => /^is[_-]/.test(name);
const isUtility = (name: string, classType: ClassType) =>
  classType === "utility" || /^u[_-]/.test(name);

export const createLumosClassOrderRule = (): StructureRule => ({
  id: "lumos:composition:class-order",
  name: "Base class must precede variants and utilities",
  description:
    "Within an element, base classes (custom/component/combo) must come before variant classes (is-*) and utility classes (u-*).",
  type: "structure", // element-scope per tests
  category: "structure", // align with tests expecting 'structure'
  severity: "error",
  enabled: true,
  example: "base_custom is-active u-hidden",

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { classes, getClassType, elementId } = args;
    if (!classes?.length || !getClassType) return [];

    // Process in actual class order
    const ordered = [...classes].sort((a, b) => a.order - b.order);

    // Buckets for potential auto-fix
    const base: string[] = [];
    const variants: string[] = [];
    const utilities: string[] = [];

    let seenVariant = false;
    let seenUtility = false;

    // Track first concrete violation so we return a single, actionable result
    let firstViolation: RuleResult | null = null;

    for (const c of ordered) {
      const type = getClassType(c.className, c.isCombo);
      const util = isUtility(c.className, type);
      const variant = !util && isVariant(c.className);
      const baseLike = !util && !variant; // custom, component, combo, unknown

      // Bucketize for fix
      if (util) utilities.push(c.className);
      else if (variant) variants.push(c.className);
      else base.push(c.className);

      // Ordering checks
      if (util) {
        seenUtility = true;
        continue;
      }
      if (variant) {
        if (seenUtility && !firstViolation) {
          firstViolation = {
            ruleId: "lumos:composition:class-order",
            name: "Base class must precede variants and utilities",
            message: `Variant class "${c.className}" appears after a utility class. Variants must come before utilities.`,
            severity: "error",
            className: c.className,
            elementId,
            isCombo: Boolean(c.isCombo),
            comboIndex: c.comboIndex,
          };
        }
        seenVariant = true;
        continue;
      }
      if (baseLike && (seenVariant || seenUtility) && !firstViolation) {
        const phase = seenUtility ? "a utility" : "a variant";
        firstViolation = {
          ruleId: "lumos:composition:class-order",
          name: "Base class must precede variants and utilities",
          message: `Base class "${c.className}" appears after ${phase} class. Base must come first.`,
          severity: "error",
          className: c.className,
          elementId,
          isCombo: Boolean(c.isCombo),
          comboIndex: c.comboIndex,
        };
      }
    }

    if (!firstViolation) return [];

    // Build canonical order, preserving relative order within each bucket
    const desiredOrder = [...base, ...variants, ...utilities];
    const currentOrder = ordered.map((x) => x.className);

    const needsFix =
      desiredOrder.length === currentOrder.length &&
      desiredOrder.some((n, i) => n !== currentOrder[i]);

    return [
      {
        ...firstViolation,
        example: "base_custom is-active u-hidden",
        metadata: {
          currentOrder,
          desiredOrder,
        },
        ...(needsFix
          ? {
              fix: {
                kind: "reorder-classes",
                order: desiredOrder,
                scope: "element",
              } as const,
            }
          : {}),
      },
    ];
  },
});
