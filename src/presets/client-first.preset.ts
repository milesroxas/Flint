import type { Rule } from "@/features/linter/model/rule.types";
import type { Preset } from "@/features/linter/model/linter.types";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";
import { clientFirstRoles } from "@/features/linter/roles/client-first.roles";

import { cfVariantIsPrefixRule } from "@/rules/naming/cf-variant-is-prefix";
import { cfUnknownUtilityFamilyRule } from "@/rules/naming/cf-unknown-utility-family";

import { cfNoUtilitiesOnRootRule } from "@/rules/context-aware/cf-no-utilities-on-root";
import { cfInnerWrapperRecommendedRule } from "@/rules/context-aware/cf-inner-wrapper-recommended";
import { cfContainersCleanRule } from "@/rules/context-aware/cf-containers-clean";
import { cfNoPaddingOnInnerRule } from "@/rules/context-aware/cf-no-padding-on-inner";

export const clientFirstPreset: Preset & { rules: Rule[] } = {
  id: "client-first",
  grammar: clientFirstGrammar,
  roles: clientFirstRoles,
  contextConfig: {
    wrapSuffix: "_wrap",
    parentClassPatterns: [
      "section_contain",
      /^u-section/,
      /^c-/,
      /^page_/,
      /^main_/,
      /^section_/,
      /^container-/,
      /^padding-/,
    ],
    requireDirectParentContainerForRoot: true,
    childGroupRequiresSharedTypePrefix: true,
    typePrefixSeparator: "_",
    typePrefixSegmentIndex: 0,
    groupNamePattern: /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    childGroupPrefixJoiner: "_",
  },
  rules: [
    // naming
    cfVariantIsPrefixRule,
    cfUnknownUtilityFamilyRule,
    // structure/context-aware (placeholders for future enrichment)
    cfNoUtilitiesOnRootRule,
    cfInnerWrapperRecommendedRule,
    cfContainersCleanRule,
    cfNoPaddingOnInnerRule,
  ],
};


