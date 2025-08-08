import type { Rule } from "@/features/linter/model/rule.types";

import { cfCustomKebabCaseRule } from "@/rules/naming/cf-custom-kebab-case";
import { cfVariantIsPrefixRule } from "@/rules/naming/cf-variant-is-prefix";
import { cfUnknownUtilityFamilyRule } from "@/rules/naming/cf-unknown-utility-family";

import { cfNoUtilitiesOnRootRule } from "@/rules/context-aware/cf-no-utilities-on-root";
import { cfInnerWrapperRecommendedRule } from "@/rules/context-aware/cf-inner-wrapper-recommended";
import { cfContainersCleanRule } from "@/rules/context-aware/cf-containers-clean";

export const clientFirstPreset: { id: string; rules: Rule[] } = {
  id: "client-first",
  rules: [
    // naming
    cfCustomKebabCaseRule,
    cfVariantIsPrefixRule,
    cfUnknownUtilityFamilyRule,
    // structure/context-aware (placeholders for future enrichment)
    cfNoUtilitiesOnRootRule,
    cfInnerWrapperRecommendedRule,
    cfContainersCleanRule,
  ],
};


