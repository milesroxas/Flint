import type { Rule } from "@/features/linter/model/rule.types";
import type { Preset } from "@/features/linter/model/preset.types";

import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";

import * as lumosRules from "@/features/linter/rules/lumos";

import { lumosRoleDetectors } from "@/features/linter/detectors/lumos.detectors";

export const lumosPreset: Preset & { rules: Rule[] } = {
  id: "lumos",
  grammar: lumosGrammar,
  roleDetectors: lumosRoleDetectors,
  roleDetectionConfig: { threshold: 0.6 },
  rules: [
    // Naming rules
    lumosRules.createLumosCustomClassFormatRule(),
    lumosRules.createLumosComboClassFormatRule(),

    // Structure rules
    lumosRules.createLumosClassOrderRule(),
    lumosRules.createLumosVariantRequiresBaseRule(),
    lumosRules.createLumosComboLimitRule(),
  ],
};
