// src/features/linter/utils/context-rule-helpers.ts
import type { 

    NamingRule, 
    PropertyRule, 
    ClassType, 
    RuleCategory, 
    Severity,
    RuleConfigSchema
  } from '@/features/linter/model/rule.types';
  import type { ElementContext } from '@/entities/element/model/element-context.types';
  
  interface BaseRuleOptions {
    id: string;
    name: string;
    description: string;
    example?: string;
    severity?: Severity;
    enabled?: boolean;
    category?: RuleCategory;
    targetClassTypes?: ClassType[];
    context?: ElementContext;
    config?: RuleConfigSchema;
  }
  
  interface NamingRuleOptions extends BaseRuleOptions {
    test: (className: string) => boolean;
    evaluate?: (
      className: string,
      context?: { config?: Record<string, unknown> }
    ) => import('@/features/linter/model/rule.types').RuleResult | null | undefined;
  }
  
  interface PropertyRuleOptions extends BaseRuleOptions {
    analyze: (
      className: string,
      properties: any,
      context: import('@/features/linter/model/rule.types').RuleContext & { config?: Record<string, unknown> }
    ) => import('@/features/linter/model/rule.types').RuleResult[];
  }
  
  /**
   * Create a naming rule that applies to specific element contexts
   */
  export function createContextAwareNamingRule(
    options: NamingRuleOptions
  ): NamingRule {
    return {
      type: "naming",
      severity: "error",
      enabled: true,
      category: "format",
      targetClassTypes: ["custom"],
      ...options,
    };
  }
  
  /**
   * Create a property rule that applies to specific element contexts
   */
  export function createContextAwarePropertyRule(
    options: PropertyRuleOptions
  ): PropertyRule {
    return {
      type: "property",
      severity: "error", 
      enabled: true,
      category: "format",
      targetClassTypes: ["custom"],
      ...options,
    };
  }
  
  /**
   * Create a rule that only applies to component root elements
   */
  export function createComponentRootRule(
    options: Omit<NamingRuleOptions, 'context'>
  ): NamingRule {
    return createContextAwareNamingRule({
      ...options,
      context: 'componentRoot'
    });
  }
  
  /**
   * Helper to check if a class name follows component root naming conventions
   * Example: "header_wrap", "navigation_wrap", "footer_wrap"
   */
  export function validateComponentRootNaming(className: string): boolean {
    // Must end with '_wrap' and have a semantic prefix
    if (!className.endsWith('_wrap')) return false;
    
    const prefix = className.slice(0, -5); // Remove '_wrap'
    
    // Must have a meaningful prefix (at least 2 characters)
    if (prefix.length < 2) return false;
    
    // Should not contain numbers or special chars (except hyphens)
    return /^[a-z]+(-[a-z]+)*$/.test(prefix);
  }
  
  // Example usage - Component root naming rule
  export const componentRootNamingRule = createComponentRootRule({
    id: "component-root-naming",
    name: "Component Root Naming",
    description: "Component root elements must follow the pattern: {semantic-name}_wrap",
    example: "header_wrap, navigation_wrap, footer_wrap",
    test: validateComponentRootNaming,
    category: "semantics",
    targetClassTypes: ["custom"]
  });