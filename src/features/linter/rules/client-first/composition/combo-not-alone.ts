import type { CompositionRule, ElementAnalysisArgs, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: Combo classes (is-*) must not stand alone.
 *
 * From the Client-First docs: "A combo class is a variant to a base class.
 * It inherits styles from the base class and adds more styles on top of it."
 *
 * A combo class is an add-on — it requires a base class (custom or utility)
 * on the same element. An element with only `is-active` and no base is invalid.
 */
export const createCFComboNotAloneRule = (): CompositionRule => ({
  id: "cf:composition:combo-not-alone",
  name: "Client-First: Combo class requires a base",
  description:
    "Combo classes (is-*) are variant modifiers that must be applied alongside a base class. They should not stand alone on an element.",
  example: "button is-brand, header_content is-home",
  type: "composition",
  category: "composition",
  severity: "error",
  enabled: true,

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { classes, getClassType, elementId } = args;
    if (!classes?.length || !getClassType) return [];

    const ordered = [...classes].sort((a, b) => a.order - b.order);

    // Find combo classes (is-* prefixed)
    const combos = ordered.filter((c) => c.className.startsWith("is-"));
    if (combos.length === 0) return [];

    // Check for base class presence: any non-combo, non-utility-prefix class counts as base
    let hasBase = false;
    for (const c of ordered) {
      const name = c.className;
      // Skip combo classes
      if (name.startsWith("is-")) continue;
      // A base class is any custom class (has underscore) or a non-combo, non-variant class
      // In Client-First: custom classes (folder_element) and global utility classes can serve as base
      const classType = getClassType(name, c.isCombo);
      if (classType === "custom" || classType === "utility") {
        hasBase = true;
        break;
      }
    }

    if (hasBase) return [];

    const firstCombo = combos[0];

    return [
      {
        ruleId: "cf:composition:combo-not-alone",
        name: "Client-First: Combo class requires a base",
        message:
          `Combo class "${firstCombo.className}" has no base class on this element. ` +
          `Add a base class (e.g., "button ${firstCombo.className}" or "header_content ${firstCombo.className}").`,
        severity: "error",
        className: firstCombo.className,
        elementId,
        isCombo: Boolean(firstCombo.isCombo),
        comboIndex: firstCombo.comboIndex,
        example: "button is-brand",
        metadata: {
          combos: combos.map((c) => c.className),
          allClasses: ordered.map((c) => c.className),
        },
      },
    ];
  },
});
