import { NamingRule } from "./types";

/**
 * Lumos V2 custom-class naming rule:
 * - lowercase
 * - underscores only
 * - 1 to 3 segments (type[_variation][_element])
 */
export const lumosCustomClassRule: NamingRule = {
    id: "lumos-custom-class-format",
    description:
      "First class must follow Lumos format: type[_variation][_element] (lowercase, underscores, max 3 segments).",
    test: (className) => /^[a-z0-9]+(_[a-z0-9]+){0,2}$/.test(className),
    severity: "error",
    enabled: true,
  };