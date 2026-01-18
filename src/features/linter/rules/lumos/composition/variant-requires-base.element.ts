// src/features/linter/rules/lumos/composition/variant-requires-base.element.ts
import type {
  ClassType,
  CompositionRule,
  ElementAnalysisArgs,
  RuleConfigSchema,
  RuleResult,
} from "@/features/linter/model/rule.types";

type VariantRequiresBaseConfig = {
  /** Prefixes that mark a variant token */
  variantPrefixes: string[]; // default: ["is_", "is-"]
  /** Prefixes that mark a component base */
  componentPrefixes: string[]; // default: ["c-"]
  /** Treat combo classes as satisfying “base present” */
  allowComboAsBase: boolean; // default: false
  /** Treat unknown class types as base */
  allowUnknownAsBase: boolean; // default: false
};

const defaultConfig: VariantRequiresBaseConfig = {
  variantPrefixes: ["is_", "is-"],
  componentPrefixes: ["c-"],
  allowComboAsBase: false,
  allowUnknownAsBase: false,
};

const configSchema: RuleConfigSchema = {
  variantPrefixes: {
    label: "Variant prefixes",
    type: "string[]",
    description: "Class name prefixes that mark variant tokens.",
    default: defaultConfig.variantPrefixes,
  },
  componentPrefixes: {
    label: "Component prefixes",
    type: "string[]",
    description: "Prefixes that mark component base classes.",
    default: defaultConfig.componentPrefixes,
  },
  allowComboAsBase: {
    label: "Allow combo as base",
    type: "boolean",
    description: "If true, a combo class counts as a base.",
    default: defaultConfig.allowComboAsBase,
  },
  allowUnknownAsBase: {
    label: "Allow unknown as base",
    type: "boolean",
    description: "If true, an unknown class type counts as a base.",
    default: defaultConfig.allowUnknownAsBase,
  },
};

// Helpers
const hasAnyPrefix = (name: string, prefixes: string[]) => prefixes.some((p) => name.startsWith(p));

const isUtility = (name: string, classType: ClassType) =>
  classType === "utility" || name.startsWith("u_") || name.startsWith("u-");

export const createLumosVariantRequiresBaseRule = (): CompositionRule => ({
  id: "lumos:composition:variant-requires-base",
  name: "Variant requires a base class",
  description:
    "Variant classes (is-*) must modify an existing base class. Ensure a Lumos base custom or a component (c-*) is present on the element.",
  example: "c-card is-active",
  type: "composition",
  category: "composition",
  severity: "error",
  enabled: true,
  config: configSchema,

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { classes, getClassType, elementId, getRuleConfig } = args;
    if (!classes?.length || !getClassType) return [];

    const cfg = {
      ...defaultConfig,
      ...(getRuleConfig?.("lumos:composition:variant-requires-base")?.customSettings as
        | Partial<VariantRequiresBaseConfig>
        | undefined),
    };

    const ordered = [...classes].sort((a, b) => a.order - b.order);

    // Detect variants and base presence
    const variants = ordered.filter((c) => hasAnyPrefix(c.className, cfg.variantPrefixes));

    if (variants.length === 0) return [];

    let hasBase = false;

    for (const c of ordered) {
      const t = getClassType(c.className, c.isCombo);

      // Component base by prefix
      const isComponentBase = hasAnyPrefix(c.className, cfg.componentPrefixes);

      // Custom base-like: not utility, not variant, and type is custom
      const isCustomBase =
        !isUtility(c.className, t) && !hasAnyPrefix(c.className, cfg.variantPrefixes) && t === "custom";

      // Optional allowances
      const isComboBase = cfg.allowComboAsBase && t === "combo";
      const isUnknownBase = cfg.allowUnknownAsBase && t === "unknown";

      if (isComponentBase || isCustomBase || isComboBase || isUnknownBase) {
        hasBase = true;
        break;
      }
    }

    if (hasBase) return [];

    // No base present. Report one clear violation, reference the first variant, include all variants in metadata.
    const firstVariant = variants[0];

    const violation: RuleResult = {
      ruleId: "lumos:composition:variant-requires-base",
      name: "Variant requires a base class",
      message:
        `Found variant "${firstVariant.className}" but no base class on this element. ` +
        `Add a Lumos base custom class (e.g., "hero_wrap") or a component class (e.g., "c-card").`,
      severity: "error",
      className: firstVariant.className,
      elementId,
      isCombo: Boolean(firstVariant.isCombo),
      comboIndex: firstVariant.comboIndex,
      example: "c-card is-active",
      metadata: {
        variants: variants.map((v) => v.className),
        allClasses: ordered.map((x) => x.className),
        hints: {
          componentPrefixes: cfg.componentPrefixes,
          variantPrefixes: cfg.variantPrefixes,
        },
      },
      // No auto-fix: we cannot safely guess the correct base to add.
    };

    return [violation];
  },
});
