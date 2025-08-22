import type { Rule } from "@/features/linter/model/rule.types";
import type { Preset } from "@/features/linter/model/preset.types";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";
import { clientFirstRoleDetectors } from "@/features/linter/detectors/client-first.detectors";
import { createCFNamingClassFormatRule } from "@/features/linter/rules/client-first/naming";
import { createDuplicateOfUtilityRule, createColorVariableRule } from "@/features/linter/rules/shared/property";

export const clientFirstPreset: Preset & { rules: Rule[] } = {
  id: "client-first",
  grammar: clientFirstGrammar,
  roleDetectors: clientFirstRoleDetectors,
  roleDetectionConfig: { threshold: 0.6 },

  rules: [
    // naming
    createCFNamingClassFormatRule(),
    
    // Shared Property rules
    createDuplicateOfUtilityRule(),
    createColorVariableRule(),
  ],
};
