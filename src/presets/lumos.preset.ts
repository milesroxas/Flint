import type { Rule } from "@/features/linter/model/rule.types";
import type { Preset } from "@/features/linter/model/linter.types";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import { lumosRoles } from "@/features/linter/roles/lumos.roles";

// Naming rules
import { lumosCustomClassFormatRule } from "@/rules/naming/lumos-custom-class-format";
import { lumosUtilityClassFormatRule } from "@/rules/naming/lumos-utility-class-format";
import { lumosComboClassFormatRule } from "@/rules/naming/lumos-combo-class-format";
import { lumosComponentClassFormatRule } from "@/rules/naming/lumos-component-class-format";
import { lumosUtilitiesAfterCustomOrderingRule, lumosCombosAfterCustomOrderingRule, lumosComboLimitRule } from "@/rules/naming/lumos-class-ordering";

// Property rules
import { lumosUtilityClassExactDuplicateRule } from "@/rules/property/lumos-utility-class-exact-duplicate";
import { lumosUtilityClassDuplicatePropertiesRule } from "@/rules/property/lumos-utility-class-duplicate-properties";

// Context-aware rules
import { componentRootSemanticNaming } from "@/rules/context-aware/component-root-semantic-naming";
import { componentRootNoDisplayUtilities } from "@/rules/context-aware/component-root-no-display-utilities";
import { componentRootRequiredStructure } from "@/rules/context-aware/component-root-required-structure";
import { lumosVariantRequiresBaseRule } from "@/rules/naming/lumos-class-ordering";
import { lumosVariantOnComponentRule } from "@/rules/naming/lumos-variant-on-component";

export const lumosPreset: Preset & { rules: Rule[] } = {
  id: "lumos",
  grammar: lumosGrammar,
  roles: lumosRoles,
  rules: [
    // naming
    lumosCustomClassFormatRule,
    lumosUtilityClassFormatRule,
    lumosComboClassFormatRule,
    lumosComponentClassFormatRule,
    // element-level ordering/limits (evaluated in runner)
    lumosUtilitiesAfterCustomOrderingRule,
    lumosCombosAfterCustomOrderingRule,
    lumosComboLimitRule,
    lumosVariantRequiresBaseRule,
    lumosVariantOnComponentRule,
    // property
    lumosUtilityClassExactDuplicateRule,
    lumosUtilityClassDuplicatePropertiesRule,
    // context-aware
    componentRootSemanticNaming,
    componentRootNoDisplayUtilities,
    componentRootRequiredStructure,
  ],
};


