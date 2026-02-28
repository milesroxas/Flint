import type { CompositionRule, ElementAnalysisArgs, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: `padding-section-*` requires `padding-global` on the same element.
 *
 * From the Client-First v2.1 update: "The padding-section-[size] utility class
 * should be used on the div block with the padding-global class applied to
 * reduce nesting elements."
 *
 * Valid:   `padding-global padding-section-medium`
 * Invalid: `padding-section-medium` (without padding-global)
 */
const PADDING_SECTION_RE = /^padding-section-/;

export const createCFPaddingSectionRequiresGlobalRule = (): CompositionRule => ({
  id: "cf:composition:padding-section-requires-global",
  name: "Client-First: padding-section requires padding-global",
  description: "The padding-section-[size] utility class should be applied on the same element as padding-global.",
  example: "padding-global padding-section-medium",
  type: "composition",
  category: "composition",
  severity: "warning",
  enabled: true,

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { classes, elementId } = args;
    if (!classes?.length) return [];

    const classNames = classes.map((c) => c.className);
    const paddingSections = classNames.filter((name) => PADDING_SECTION_RE.test(name));

    if (paddingSections.length === 0) return [];

    const hasPaddingGlobal = classNames.includes("padding-global");
    if (hasPaddingGlobal) return [];

    // Flag the first padding-section class
    const first = paddingSections[0];
    const matchingClass = classes.find((c) => c.className === first);

    return [
      {
        ruleId: "cf:composition:padding-section-requires-global",
        name: "Client-First: padding-section requires padding-global",
        message: `"${first}" should be on the same element as "padding-global". Add the padding-global class to this element.`,
        severity: "warning",
        className: first,
        elementId,
        isCombo: Boolean(matchingClass?.isCombo),
        comboIndex: matchingClass?.comboIndex,
        example: "padding-global padding-section-medium",
        fix: {
          kind: "add-class",
          className: "padding-global",
          scope: "element",
        },
      },
    ];
  },
});
