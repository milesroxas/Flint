// src/features/linter/rules/context-aware-rules.ts
  import type { Rule } from '@/features/linter/model/rule.types';
  import { componentRootSemanticNaming } from '@/rules/context-aware/component-root-semantic-naming';
  import { componentRootNoDisplayUtilities } from '@/rules/context-aware/component-root-no-display-utilities';
  import { componentRootRequiredStructure } from '@/rules/context-aware/component-root-required-structure';

  export const contextAwareRules: Rule[] = [
    componentRootSemanticNaming,
    componentRootNoDisplayUtilities,
    componentRootRequiredStructure,
  ];