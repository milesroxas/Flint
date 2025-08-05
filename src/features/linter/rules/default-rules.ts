

// const getClassType = (className: string): ClassType => {
//   if (className.startsWith("is-")) return "combo"
//   if (className.startsWith("u-")) return "utility"
//   return "custom"
// }

import { Rule } from "../types"

export const defaultRules: Rule[] = [
  {
    id: "lumos-custom-class-format",
    name: "Lumos Custom Class Format",
    description: "Custom classes must be lowercase alphanumeric, use underscores only, and have at most three underscores. Format: type[_variation][_element].",
    type: "naming",
    test: (className) => /^[a-z0-9]+(?:_[a-z0-9]+){0,3}$/.test(className),
    severity: "error",
    enabled: true,
    category: "format",
    targetClassTypes: ["custom"]
  },
  {
    id: "lumos-utility-class-format",
    name: "Lumos Utility Class Format", 
    description: "Utility classes must start with u-, use dashes only, and always be stacked on a custom class.",
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