import type {
  NamingRule,
  RuleConfigSchema,
  RuleResult,
  ElementAnalysisArgs,
} from "@/features/linter/model/rule.types";

export const lumosUtilitiesAfterCustomOrderingRule: NamingRule = {
  id: "lumos-utilities-after-custom-ordering",
  name: "Base class must precede variants and utilities",
  description:
    "Error when any non is-* or u-* (base custom/component) appears after a variant or utility class.",
  example: "base_custom is-* u-*",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],
  // Element-level check is performed in rule-runner; keep test permissive
  test: () => true,
  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { classes, getRuleConfig } = args;
    const cfg = getRuleConfig("lumos-utilities-after-custom-ordering");
    if (!(cfg?.enabled ?? true)) return [];
    const ordered = [...classes].sort((a, b) => a.order - b.order);

    // Use naming, not API combo flag, to decide base vs variant/utility
    let seenVariantOrUtility = false;
    for (const c of ordered) {
      const isVariantOrUtility =
        isComboLike(c.className) || c.className.startsWith("u-");
      if (isVariantOrUtility) {
        seenVariantOrUtility = true;
      } else if (seenVariantOrUtility) {
        return [
          {
            ruleId: "lumos-utilities-after-custom-ordering",
            name: "Base class must precede variants and utilities",
            message:
              "Base custom/component classes must not appear after variant (is-*) or utility (u-*) classes.",
            severity: cfg?.severity ?? "error",
            className: c.className,
            isCombo: false,
            example: "base_custom is-* u-*",
          },
        ];
      }
    }
    return [];
  },
};

const comboLimitConfig: RuleConfigSchema = {
  maxCombos: {
    label: "Maximum combo classes",
    type: "number",
    default: 2,
    description: "Maximum allowed combo classes on an element",
  },
};

export const lumosComboLimitRule: NamingRule = {
  id: "lumos-combo-class-limit",
  name: "Too many combo classes",
  description: "Limit the number of combo classes applied to an element.",
  example: "base_custom is-large is-active",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["combo"],
  config: comboLimitConfig,
  test: () => true,
  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { classes, getClassType, getRuleConfig } = args;
    const cfg = getRuleConfig("lumos-combo-class-limit");
    if (!(cfg?.enabled ?? true)) return [];
    const ordered = [...classes].sort((a, b) => a.order - b.order);
    const combos = ordered.filter(
      (c) => getClassType(c.className, c.isCombo) === "combo"
    );
    const maxCombos = Number(cfg?.customSettings?.["maxCombos"] ?? 2);
    if (combos.length <= maxCombos) return [];
    const baseCustom = ordered.find(
      (c) => getClassType(c.className, c.isCombo) === "custom"
    );
    return [
      {
        ruleId: "lumos-combo-class-limit",
        name: "Too many combo classes",
        message: `This element has ${combos.length} combo classes; limit is ${maxCombos}. Consider merging or simplifying.`,
        severity: cfg?.severity ?? "warning",
        className: combos[0]?.className ?? "",
        isCombo: true,
        // pass through comboIndex of the first offending combo if available
        comboIndex: combos[0]?.comboIndex,
        example: "base_custom is-large is-active",

        metadata: {
          combos: combos.map((c) => c.className),
          maxCombos,
          baseCustomClass: baseCustom?.className,
        },
      },
    ];
  },
};

export const lumosVariantRequiresBaseRule: NamingRule = {
  id: "lumos-variant-requires-base",
  name: "Variant should modify a base class",
  description:
    "Variant classes (is-*) should modify an existing base custom/component class (e.g., c-* or custom).",
  example: "c-card is-active",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["combo"],
  test: () => true,
  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { classes, getClassType, getRuleConfig } = args;
    const cfg = getRuleConfig("lumos-variant-requires-base");
    if (!(cfg?.enabled ?? true)) return [];
    const ordered = [...classes].sort((a, b) => a.order - b.order);
    let baseSeen = false;
    for (const c of ordered) {
      if (isComboLike(c.className)) {
        if (!baseSeen) {
          return [
            {
              ruleId: "lumos-variant-requires-base",
              name: "Variant should modify a base class",
              message:
                "Variant classes (is-*) should be used on top of a base custom/component class (not only utilities).",
              severity: cfg?.severity ?? "warning",
              className: c.className,
              isCombo: true,
              example: "c-card is-active",

              metadata: {
                combos: ordered
                  .filter(
                    (x) => getClassType(x.className, x.isCombo) === "combo"
                  )
                  .map((x) => x.className),
              },
            },
          ];
        }
        break;
      }
      if (getClassType(c.className, c.isCombo) !== "utility") baseSeen = true;
    }
    return [];
  },
};

// local helper mirrors runner's heuristic
const COMBO_LIKE_RE = /^(?:is[-_][A-Za-z0-9_]+|is[A-Z][A-Za-z0-9_]*)$/;
const isComboLike = (name: string): boolean => COMBO_LIKE_RE.test(name);
