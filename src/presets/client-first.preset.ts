import type { Rule } from "@/features/linter/model/rule.types";
import type { Preset } from "@/features/linter/model/linter.types";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";

import { cfVariantIsPrefixRule } from "@/features/linter/rules/naming/cf-variant-is-prefix";
import { cfUnknownUtilityFamilyRule } from "@/features/linter/rules/naming/cf-unknown-utility-family";

import { cfNoUtilitiesOnRootRule } from "@/features/linter/rules/role-aware/cf-no-utilities-on-root";
import { cfContainersCleanRule } from "@/features/linter/rules/role-aware/cf-containers-clean";
import { cfNoPaddingOnInnerRule } from "@/features/linter/rules/role-aware/cf-no-padding-on-inner";
import { clientFirstRoleDetectors } from "@/features/linter/detectors/client-first.detectors";

export const clientFirstPreset: Preset & { rules: Rule[] } = {
  id: "client-first",
  grammar: clientFirstGrammar,
  roleDetectors: clientFirstRoleDetectors,
  roleDetectionConfig: { threshold: 0.6 },
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
    cfContainersCleanRule,
    cfNoPaddingOnInnerRule,
  ],
};
