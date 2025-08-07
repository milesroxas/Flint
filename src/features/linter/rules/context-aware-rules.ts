// src/features/linter/rules/context-aware-rules.ts
import { 
    createComponentRootRule,
    createContextAwarePropertyRule,
    validateComponentRootNaming 
  } from '@/features/linter/utils/context-rule-helpers';
  import type { Rule, RuleResult } from '@/features/linter/types/rule-types';
  
  /**
   * Rule: Component roots must follow semantic naming pattern
   * Only applies to elements classified as 'componentRoot' context
   */
  export const componentRootSemanticNaming = createComponentRootRule({
    id: "component-root-semantic-naming",
    name: "Component Root Semantic Naming", 
    description: "Component root elements must use semantic names ending with '_wrap'",
    example: "header_wrap, navigation_wrap, card_wrap",
    test: validateComponentRootNaming,
    category: "semantics",
    severity: "error"
  });
  
  /**
   * Rule: Component roots should not have display utilities
   * Only applies to 'componentRoot' context elements
   */
  export const componentRootNoDisplayUtilities = createContextAwarePropertyRule({
    id: "component-root-no-display-utilities",
    name: "No Display Utilities on Component Roots",
    description: "Component root elements should not use display utility classes",
    example: "Avoid: u-flex, u-block, u-none on component roots",
    context: 'componentRoot',
    category: "performance",
    severity: "warning",
    targetClassTypes: ["utility"],
    analyze: (className, properties) => {
      const results: RuleResult[] = [];
      
      // Check if this is a display utility
      if (className.startsWith('u-') && properties.display) {
        results.push({
          ruleId: "component-root-no-display-utilities",
          name: "No Display Utilities on Component Roots",
          message: `Component root element should not use display utility '${className}'. Consider using custom CSS or applying to child elements.`,
          severity: "warning",
          className,
          isCombo: false,
          example: "Move display utilities to child elements"
        });
      }
      
      return results;
    }
  });
  
  /**
   * Rule: Component roots should have specific structure classes
   */
  export const componentRootRequiredStructure = createComponentRootRule({
    id: "component-root-required-structure", 
    name: "Component Root Required Structure",
    description: "Component root elements must follow structural conventions",
    example: "component_wrap with proper container structure",
    category: "semantics",
    severity: "suggestion",
    test: (className) => {
      // Allow any semantic name ending with _wrap and not containing double underscores
      return className.endsWith('_wrap') && !className.includes('__');
    },
    // Remove the redundant evaluate function since the test function already handles the check
  });
  
  // Export all context-aware rules
  export const contextAwareRules: Rule[] = [
    componentRootSemanticNaming,
    componentRootNoDisplayUtilities,
    componentRootRequiredStructure
  ];