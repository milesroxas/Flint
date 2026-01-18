import { lumosRoleDetectors } from "@/features/linter/detectors/lumos.detectors";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import type { Preset } from "@/features/linter/model/preset.types";
import type { PresetElementsConfig } from "@/features/linter/model/preset-elements.types";
import type { Rule } from "@/features/linter/model/rule.types";
import * as lumosRules from "@/features/linter/rules/lumos";
import { getLumosKnownElements } from "@/features/linter/rules/lumos/naming/naming-class-format";
import {
  createColorVariableRule,
  createDuplicateOfUtilityRule,
  createUtilityDuplicatePropertyRule,
} from "@/features/linter/rules/shared/property";
import { createMissingClassOnDivRule } from "@/features/linter/rules/shared/structure";

/**
 * Element configuration for Lumos preset
 */
export const lumosElementsConfig: PresetElementsConfig = {
  getElements: getLumosKnownElements,
  categoryMap: {
    layout: ["wrap", "main", "contain", "container", "layout", "inner", "content", "section"],
    content: ["text", "title", "heading", "eyebrow", "label", "marker"],
    media: ["icon", "img", "image"],
    interactive: ["button", "link", "field"],
    structure: ["group", "item", "list", "card"],
    testing: ["x", "y", "z"],
  },
  separator: "_",
  metadata: {
    displayName: "Lumos",
    description: "Underscore-separated custom class naming convention",
  },
};

export const lumosPreset: Preset & {
  rules: Rule[];
  elementsConfig: PresetElementsConfig;
} = {
  id: "lumos",
  grammar: lumosGrammar,
  roleDetectors: lumosRoleDetectors,
  roleDetectionConfig: { threshold: 0.6 },
  elementsConfig: lumosElementsConfig,
  rules: [
    // Naming rules
    lumosRules.createLumosCustomClassFormatRule(),
    lumosRules.createLumosComboClassFormatRule(),

    // Structure rules
    lumosRules.createLumosClassOrderRule(),
    lumosRules.createLumosVariantRequiresBaseRule(),
    lumosRules.createLumosComboLimitRule(),

    // Shared Property rules
    createDuplicateOfUtilityRule(),
    createColorVariableRule(),
    createUtilityDuplicatePropertyRule(),

    // Shared Structure rules
    createMissingClassOnDivRule(),
  ],
};
