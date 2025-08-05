import { StyleInfo } from "../lib/style-service";

export type Severity = "suggestion" | "warning" | "error";


export interface RuleResult {
    ruleId: string
    name: string
    message: string
    severity: Severity
    className: string
    isCombo: boolean
    comboIndex?: number
    example?: string
    metadata?: Record<string, any>
  }


  export interface BaseRule {
    id: string
    name: string
    description: string
    severity: Severity
    enabled: boolean
    category: RuleCategory
    example?: string
  }
  
  export interface NamingRule extends BaseRule {
    type: "naming"
    test: (className: string) => boolean
    targetClassTypes: ClassType[]
  }
  
  export interface PropertyRule extends BaseRule {
    type: "property"
    analyze: (className: string, properties: any, context: RuleContext) => RuleViolation[]
    targetClassTypes: ClassType[]
  }
  
  export type Rule = NamingRule | PropertyRule
  
  export type RuleCategory = "format" | "semantics" | "performance" | "accessibility" | "custom"
  export type ClassType = "custom" | "utility" | "combo"
  
  export interface RuleViolation {
    ruleId: string
    name: string
    message: string
    severity: Severity
    className: string
    isCombo: boolean
    metadata?: Record<string, any>
    example?: string
  }
  
  export interface RuleContext {
    allStyles: StyleInfo[]
    utilityClassPropertiesMap: Map<string, {name: string, properties: any}[]>
    propertyToClassesMap: Map<string, Set<string>>
  }
  
  export interface RuleConfiguration {
    ruleId: string
    enabled: boolean
    severity: Severity
    customSettings?: Record<string, any>
  }
  