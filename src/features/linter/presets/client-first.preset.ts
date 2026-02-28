import { clientFirstRoleDetectors } from "@/features/linter/detectors/client-first.detectors";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";
import type { Preset } from "@/features/linter/model/preset.types";
import type { PresetElementsConfig } from "@/features/linter/model/preset-elements.types";
import type { Rule } from "@/features/linter/model/rule.types";
import {
  createCFComboNotAloneRule,
  createCFPaddingSectionRequiresGlobalRule,
} from "@/features/linter/rules/client-first/composition";
import {
  createCFComboIsPrefixRule,
  createCFNamingClassFormatRule,
  createCFNoAbbreviationsRule,
  createCFSectionFormatRule,
  createCFUtilityNoUnderscoreRule,
} from "@/features/linter/rules/client-first/naming";
import { getClientFirstKnownElements } from "@/features/linter/rules/client-first/naming/naming-class-format";
import {
  createCFPaddingGlobalHorizontalOnlyRule,
  createCFPreferRemRule,
} from "@/features/linter/rules/client-first/property";
import { createCFNavOutsideMainRule } from "@/features/linter/rules/client-first/structure";
import {
  createColorVariableRule,
  createDuplicateOfUtilityRule,
  createUtilityDuplicatePropertyRule,
} from "@/features/linter/rules/shared/property";
import { createMissingClassOnDivRule } from "@/features/linter/rules/shared/structure";

/**
 * Element configuration for Client-First preset
 */
export const clientFirstElementsConfig: PresetElementsConfig = {
  getElements: getClientFirstKnownElements,
  categoryMap: {
    layout: ["wrapper", "container", "inner", "section"],
    content: ["text", "title", "heading", "subtitle", "label"],
    components: ["card", "button", "link", "form", "nav"],
    media: ["image", "icon", "video"],
    utility: ["spacer", "divider", "overlay"],
  },
  separator: "-",
  metadata: {
    displayName: "Client-First",
    description: "Kebab-case custom class naming convention",
  },
};

export const clientFirstPreset: Preset & {
  rules: Rule[];
  elementsConfig: PresetElementsConfig;
} = {
  id: "client-first",
  grammar: clientFirstGrammar,
  roleDetectors: clientFirstRoleDetectors,
  roleDetectionConfig: { threshold: 0.6 },
  elementsConfig: clientFirstElementsConfig,

  rules: [
    // Client-First naming rules
    createCFNamingClassFormatRule(),
    createCFUtilityNoUnderscoreRule(),
    createCFComboIsPrefixRule(),
    createCFSectionFormatRule(),
    createCFNoAbbreviationsRule(),

    // Client-First composition rules
    createCFComboNotAloneRule(),
    createCFPaddingSectionRequiresGlobalRule(),

    // Client-First structure rules
    createCFNavOutsideMainRule(),

    // Client-First property rules
    createCFPaddingGlobalHorizontalOnlyRule(),
    createCFPreferRemRule(),

    // Shared property rules
    createDuplicateOfUtilityRule(),
    createColorVariableRule(),
    createUtilityDuplicatePropertyRule(),

    // Shared structure rules
    createMissingClassOnDivRule(),
  ],
};
