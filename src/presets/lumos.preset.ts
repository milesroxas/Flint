import type { Rule } from "@/features/linter/model/rule.types";
import type { Preset } from "@/features/linter/model/linter.types";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";

// Naming rules
import { lumosCustomClassFormatRule } from "@/features/linter/rules/naming/lumos-custom-class-format";
import { lumosUtilityClassFormatRule } from "@/features/linter/rules/naming/lumos-utility-class-format";
import { lumosComboClassFormatRule } from "@/features/linter/rules/naming/lumos-combo-class-format";
import { lumosComponentClassFormatRule } from "@/features/linter/rules/naming/lumos-component-class-format";
import {
  lumosUtilitiesAfterCustomOrderingRule,
  lumosComboLimitRule,
} from "@/features/linter/rules/naming/lumos-class-ordering";

// Property rules
import { lumosUtilityClassExactDuplicateRule } from "@/features/linter/rules/property/lumos-utility-class-exact-duplicate";
import { lumosUtilityClassDuplicatePropertiesRule } from "@/features/linter/rules/property/lumos-utility-class-duplicate-properties";

// Context-aware rules (keep only those that do not duplicate canonical role rules)
import { componentRootSemanticNaming } from "@/features/linter/rules/role-aware/component-root-semantic-naming";
import { componentRootNoDisplayUtilities } from "@/features/linter/rules/role-aware/component-root-no-display-utilities";
import { lumosVariantRequiresBaseRule } from "@/features/linter/rules/naming/lumos-class-ordering";
// Removed: lumosChildGroupReferencesParentRule (replaced by canonical child-group-key-match)
import { lumosRoleDetectors } from "@/features/linter/detectors/lumos.detectors";
// Canonical element rules are registered globally in the registry

export const lumosPreset: Preset & { rules: Rule[] } = {
  id: "lumos",
  grammar: lumosGrammar,
  roleDetectors: lumosRoleDetectors,
  roleDetectionConfig: { threshold: 0.6 },
  contextConfig: {
    wrapSuffix: "_wrap",
    parentClassPatterns: ["section_contain", /^u-section/, /^c-/, /^page_main/],
    requireDirectParentContainerForRoot: true,
    childGroupRequiresSharedTypePrefix: true,
    typePrefixSeparator: "_",
    typePrefixSegmentIndex: 0,
    groupNamePattern: /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    childGroupPrefixJoiner: "_",
  },
  rules: [
    // naming
    lumosCustomClassFormatRule,
    lumosUtilityClassFormatRule,
    lumosComboClassFormatRule,
    lumosComponentClassFormatRule,
    // element-level ordering/limits (evaluated via analyzeElement)
    lumosUtilitiesAfterCustomOrderingRule,
    lumosComboLimitRule,
    lumosVariantRequiresBaseRule,
    // property
    lumosUtilityClassExactDuplicateRule,
    lumosUtilityClassDuplicatePropertiesRule,
    // context-aware (legacy but compatible)
    componentRootSemanticNaming,
    componentRootNoDisplayUtilities,
    // removed: componentRootRequiredStructure (covered by canonical component-root-structure)
  ],
};
