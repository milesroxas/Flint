import type { Rule } from "@/features/linter/model/rule.types";

// Naming rules
import { lumosCustomClassFormatRule } from "@/rules/naming/lumos-custom-class-format";
import { lumosUtilityClassFormatRule } from "@/rules/naming/lumos-utility-class-format";
import { lumosComboClassFormatRule } from "@/rules/naming/lumos-combo-class-format";
import { lumosUtilitiesAfterCustomOrderingRule, lumosCombosAfterCustomOrderingRule, lumosComboLimitRule } from "@/rules/naming/lumos-class-ordering";

// Property rules
import { lumosUtilityClassExactDuplicateRule } from "@/rules/property/lumos-utility-class-exact-duplicate";
import { lumosUtilityClassDuplicatePropertiesRule } from "@/rules/property/lumos-utility-class-duplicate-properties";

// Context-aware rules
import { componentRootSemanticNaming } from "@/rules/context-aware/component-root-semantic-naming";
import { componentRootNoDisplayUtilities } from "@/rules/context-aware/component-root-no-display-utilities";
import { componentRootRequiredStructure } from "@/rules/context-aware/component-root-required-structure";

export const lumosPreset: { id: string; rules: Rule[] } = {
  id: "lumos",
  rules: [
    // naming
    lumosCustomClassFormatRule,
    lumosUtilityClassFormatRule,
    lumosComboClassFormatRule,
    // element-level ordering/limits (evaluated in runner)
    lumosUtilitiesAfterCustomOrderingRule,
    lumosCombosAfterCustomOrderingRule,
    lumosComboLimitRule,
    // property
    lumosUtilityClassExactDuplicateRule,
    lumosUtilityClassDuplicatePropertiesRule,
    // context-aware
    componentRootSemanticNaming,
    componentRootNoDisplayUtilities,
    componentRootRequiredStructure,
  ],
};


