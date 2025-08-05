import { NamingRule } from "./types";

export const lumosCustomClassRule: NamingRule = {
  id: "lumos-custom-class-format",
  name: "Lumos Custom Class Format",
  description:
    "Lowercase only, underscores only, max 3 underscores. Follows type[_variation][_element] format (e.g. hero_secondary_title).",
  test: (className) => /^[a-z0-9]+(_[a-z0-9]+){0,3}$/.test(className),
  severity: "error",
  enabled: true,
};
