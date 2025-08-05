import { NamingRule } from "./types";

/** 1. Custom classes (type[_variation][_element], underscores only, max 3) */
export const lumosCustomClassRule: NamingRule = {
  id: "lumos-custom-class-format",
  name: "Lumos Custom Class Format",
  description:
    "Custom classes must be lowercase alphanumeric, use underscores only, and have at most three underscores. Format: type[_variation][_element].",
  test: (className) =>
    /^[a-z0-9]+(?:_[a-z0-9]+){0,3}$/.test(className),
  severity: "error",
  enabled: true,
  isCombo: false,
};

/** 2. Utility classes (start with u-, dashes only) */
export const lumosUtilityClassRule: NamingRule = {
  id: "lumos-utility-class-format",
  name: "Lumos Utility Class Format",
  description:
    "Utility classes must start with u-, use dashes only, and always be stacked on a custom class.",
  test: (className) =>
    /^u-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
  severity: "error",
  enabled: true,
};

/** 4. Combo classes (start with is-, dashes only) */
export const lumosComboClassRule: NamingRule = {
  id: "lumos-combo-class-format",
  name: "Lumos Combo Class Format",
  description:
    "Combo classes must start with is-, use dashes only, and modify existing component classes.",
  test: (className) =>
    /^is-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
  severity: "error",
  enabled: true,
  isCombo: true,
};
