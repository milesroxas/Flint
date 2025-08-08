// features/linter/rules/default-rules.ts
import type { Rule } from "@/features/linter/model/rule.types";
import { lumosCustomClassFormatRule } from "@/rules/naming/lumos-custom-class-format";
import { lumosUtilityClassFormatRule } from "@/rules/naming/lumos-utility-class-format";
import { lumosComboClassFormatRule } from "@/rules/naming/lumos-combo-class-format";
import { lumosUtilityClassExactDuplicateRule } from "@/rules/property/lumos-utility-class-exact-duplicate";
import { lumosUtilityClassDuplicatePropertiesRule } from "@/rules/property/lumos-utility-class-duplicate-properties";

export const defaultRules: Rule[] = [
  lumosCustomClassFormatRule,
  lumosUtilityClassFormatRule,
  lumosComboClassFormatRule,
  lumosUtilityClassExactDuplicateRule,
  lumosUtilityClassDuplicatePropertiesRule,
];
