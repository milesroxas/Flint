// src/features/linter/rules/lumos/composition/combo-limit.element.ts
import type {
  ClassType,
  CompositionRule,
  ElementAnalysisArgs,
  RuleConfigSchema,
  RuleResult,
} from "@/features/linter/model/rule.types";

type ComboLimitConfig = {
  /** Maximum number of classes allowed after the base */
  maxCombos: number; // default: 2
  /** If true, utility classes DO count toward the limit */
  countUtilities: boolean; // default: true
  /** Variant prefixes to exclude from base detection */
  variantPrefixes: string[]; // default: ["is_", "is-"]
  /** If true and no clear base is found, treat the first token as base */
  assumeFirstAsBase: boolean; // default: true
};

const defaultConfig: ComboLimitConfig = {
  maxCombos: 2,
  countUtilities: true,
  variantPrefixes: ["is_", "is-"],
  assumeFirstAsBase: true,
};

export const comboLimitConfigSchema: RuleConfigSchema = {
  maxCombos: {
    type: "number",
    label: "Max classes after base",
    description: "Maximum number of class tokens allowed after the base.",
    default: 2,
  },
  countUtilities: {
    type: "boolean",
    label: "Count utilities",
    description: "If enabled, utility classes count toward the limit.",
    default: true,
  },
  variantPrefixes: {
    type: "string[]",
    label: "Variant prefixes",
    description: "Prefixes that mark a variant token.",
    default: ["is_", "is-"],
  },
  assumeFirstAsBase: {
    type: "boolean",
    label: "Assume first as base",
    description: "If no clear base is detected, treat the first token as base.",
    default: true,
  },
};

const isVariant = (name: string, prefixes: string[]) => prefixes.some((p) => name.startsWith(p));

const isUtility = (name: string, classType?: ClassType) => classType === "utility" || /^u[_-]/.test(name);

export const createLumosComboLimitRule = (): CompositionRule => ({
  id: "lumos:composition:combo-limit",
  name: "Limit classes after base",
  description: "Limit the number of classes applied after the base class on an element.",
  example: "base_custom is-large is-active",
  type: "composition",
  category: "composition",
  severity: "error",
  enabled: true,
  config: comboLimitConfigSchema,

  analyzeElement: (args: ElementAnalysisArgs): RuleResult[] => {
    const { classes, elementId, getClassType, getRuleConfig } = args;
    if (!classes?.length) return [];

    const cfg: ComboLimitConfig = (() => {
      const rc = typeof getRuleConfig === "function" ? getRuleConfig("lumos:composition:combo-limit") : undefined;
      const cs = (rc?.customSettings ?? {}) as Partial<ComboLimitConfig>;
      return {
        maxCombos: Number.isFinite(cs.maxCombos as number) ? (cs.maxCombos as number) : defaultConfig.maxCombos,
        countUtilities: typeof cs.countUtilities === "boolean" ? cs.countUtilities : defaultConfig.countUtilities,
        variantPrefixes:
          Array.isArray(cs.variantPrefixes) && cs.variantPrefixes.length > 0
            ? (cs.variantPrefixes as string[])
            : defaultConfig.variantPrefixes,
        assumeFirstAsBase:
          typeof cs.assumeFirstAsBase === "boolean" ? cs.assumeFirstAsBase : defaultConfig.assumeFirstAsBase,
      };
    })();

    // Preserve actual order from Designer
    const ordered = [...classes].sort((a, b) => a.order - b.order);

    // Find the base: first token that is not utility and not variant.
    // If none is found, optionally treat the first as base to avoid double-penalizing.
    let baseIdx = -1;
    for (let i = 0; i < ordered.length; i++) {
      const c = ordered[i];
      const t = typeof getClassType === "function" ? getClassType(c.className, c.isCombo) : undefined;
      if (!isUtility(c.className, t) && !isVariant(c.className, cfg.variantPrefixes)) {
        baseIdx = i;
        break;
      }
    }
    if (baseIdx === -1 && cfg.assumeFirstAsBase && ordered.length > 0) {
      baseIdx = 0;
    }

    const afterBase = baseIdx >= 0 ? ordered.slice(baseIdx + 1) : ordered.slice(0);

    // Count everything after base. Optionally include utilities.
    const tokensToCount = afterBase.filter((c) => {
      if (cfg.countUtilities) return true;
      const t = typeof getClassType === "function" ? getClassType(c.className, c.isCombo) : undefined;
      return !isUtility(c.className, t);
    });

    const count = tokensToCount.length;
    if (count <= cfg.maxCombos) return [];

    const excess = tokensToCount.slice(cfg.maxCombos);
    const first = excess[0];

    const message =
      excess.length === 1
        ? `This element has ${count} classes after the base; the limit is ${cfg.maxCombos}. Extra: "${first.className}".`
        : `This element has ${count} classes after the base; the limit is ${
            cfg.maxCombos
          }. Extras: "${excess.map((c) => c.className).join('", "')}".`;

    const currentOrder = ordered.map((x) => x.className);
    const result: RuleResult = {
      ruleId: "lumos:composition:combo-limit",
      name: "Limit classes after base",
      message,
      severity: "error",
      elementId,
      className: first.className,
      isCombo: Boolean(first.isCombo),
      comboIndex: first.comboIndex,
      example: "base_custom is-large is-active",
      metadata: {
        maxCombos: cfg.maxCombos,
        countAfterBase: count,
        tokensAfterBase: tokensToCount.map((c) => c.className),
        allClasses: currentOrder,
        countUtilities: cfg.countUtilities,
        baseIndex: baseIdx,
      },
    };

    return [result];
  },
});
