import { NamingRule, RuleResult } from "@/features/linter/model/rule.types";

export const createLumosCustomClassFormatRule = (): NamingRule => ({
  id: "lumos:naming:class-format",
  name: "Lumos Custom Class Format",
  description:
    "Custom classes must be lowercase and underscore-separated with at least 2 segments: type_element or type_variant_element. Child group roots may include additional group segments before the final element (e.g., type[_variant]_[group]_wrap). The final segment should describe the element (e.g. wrap, text, icon).",
  example: "footer_wrap, footer_link_wrap, hero_secondary_content_wrap",
  type: "naming",
  severity: "error",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],
  test: (): boolean => true,
  evaluate: (): RuleResult | null => null,
});
