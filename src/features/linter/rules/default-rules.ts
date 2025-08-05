

// const getClassType = (className: string): ClassType => {
//   if (className.startsWith("is-")) return "combo"
//   if (className.startsWith("u-")) return "utility"
//   return "custom"
// }

import { Rule } from "../types/rule-types"

export const defaultRules: Rule[] = [
  {
    id: "lumos-custom-class-format",
    name: "Lumos Custom Class Format",
    description: "Custom classes must be lowercase alphanumeric, use underscores only, have at least two parts, and have at most three underscores.",
    example: "Format: type_variation[_element]",
    type: "naming",
    test: (className) => {
      // Check if it matches the basic pattern
      const basicPattern = /^[a-z0-9]+(?:_[a-z0-9]+){0,3}$/;
      // Check that it has at least one underscore (not just one word)
      const hasUnderscore = className.includes('_');
      // Check that it doesn't end with an underscore
      const noTrailingUnderscore = !className.endsWith('_');
      
      return basicPattern.test(className) && hasUnderscore && noTrailingUnderscore;
    },
    severity: "error",
    enabled: true,
    category: "format",
    targetClassTypes: ["custom"]
  },
  {
    id: "lumos-utility-class-format",
    name: "Lumos Utility Class Format", 
    description: "Utility classes must start with u-, use dashes only, and always be stacked on a custom class.",
    example: "Format: u-property-value",
    type: "naming",
    test: (className) => /^u-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
    severity: "error",
    enabled: true,
    category: "format",
    targetClassTypes: ["utility"]
  },
  {
    id: "lumos-combo-class-format",
    name: "Lumos Combo Class Format",
    description: "Combo classes must start with is-, use dashes only, and modify existing component classes.",
    example: "Format: is-state-variant",
    type: "naming", 
    test: (className) => /^is-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
    severity: "error",
    enabled: true,
    category: "format",
    targetClassTypes: ["combo"]
  },
  {
    id: "lumos-utility-class-exact-duplicate",
    name: "Exact Duplicate Utility Class",
    description: "Utility classes should not be exact duplicates of other classes.",
    type: "property",
    analyze: () => [], // Handled by UtilityClassAnalyzer
    severity: "error",
    enabled: true,
    category: "semantics",
    targetClassTypes: ["utility"]
  },
  {
    id: "lumos-utility-class-duplicate-properties", 
    name: "Duplicate Utility Class Properties",
    description: "Utility classes should avoid having duplicate properties with other classes.",
    type: "property",
    analyze: () => [], // Handled by UtilityClassAnalyzer
    severity: "suggestion",
    enabled: true,
    category: "semantics", 
    targetClassTypes: ["utility"]
  }
]