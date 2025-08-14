import { describe, it, expect } from 'vitest';

import type { StyleInfo, StyleWithElement } from '@/entities/style/model/style.service';
import type { ElementContext } from '@/entities/element/model/element-context.types';
import { createRuleRegistry } from '@/features/linter/services/rule-registry';
import { createUtilityClassAnalyzer } from '@/features/linter/services/utility-class-analyzer';
import { createRuleRunner } from '@/features/linter/services/rule-runner';

import { cfNoUtilitiesOnRootRule } from '@/rules/context-aware/cf-no-utilities-on-root';
import { cfInnerWrapperRecommendedRule } from '@/rules/context-aware/cf-inner-wrapper-recommended';
import { cfContainersCleanRule } from '@/rules/context-aware/cf-containers-clean';
import { cfNoPaddingOnInnerRule } from '@/rules/context-aware/cf-no-padding-on-inner';

const COMBO_LIKE_RE = /^(?:is-[A-Za-z0-9]|is_[A-Za-z0-9]|is[A-Z]).*/;

const toAllStyles = (
  classNames: string[],
  propertiesByClass: Record<string, any> = {}
): StyleInfo[] => {
  return classNames.map((name, index) => {
    const isUtility = name.startsWith('u-');
    const properties = isUtility ? (propertiesByClass[name] ?? {}) : {};
    const isCombo = COMBO_LIKE_RE.test(name);
    return {
      id: `s-${index + 1}`,
      name,
      properties,
      order: index,
      isCombo,
      detectionSource: 'heuristic'
    };
  });
};

const toStylesWithElement = (
  elementId: string,
  classNames: string[],
  propertiesByClass: Record<string, any> = {}
): StyleWithElement[] => {
  return toAllStyles(classNames, propertiesByClass).map((s) => ({ ...s, elementId }));
};

const runRules = (
  rules: any[],
  classNames: string[],
  opts?: {
    propertiesByClass?: Record<string, any>;
    elementId?: string;
    contexts?: ElementContext[];
  }
) => {
  const elementId = opts?.elementId ?? 'el-1';
  const propertiesByClass = opts?.propertiesByClass ?? {};
  const contexts = opts?.contexts ?? [];

  const allStyles = toAllStyles(classNames, propertiesByClass);
  const stylesWithElement = toStylesWithElement(elementId, classNames, propertiesByClass);
  const elementContextsMap: Record<string, ElementContext[]> = { [elementId]: contexts };

  const registry = createRuleRegistry();
  registry.registerRules(rules as any);

  const analyzer = createUtilityClassAnalyzer();
  analyzer.buildPropertyMaps(allStyles);

  const runner = createRuleRunner(registry as any, analyzer);
  return runner.runRulesOnStylesWithContext(stylesWithElement, elementContextsMap, allStyles);
};

describe('Client-First context-aware rules', () => {
  it('cf-no-utilities-on-root warns on utilities at componentRoot', () => {
    const results = runRules(
      [cfNoUtilitiesOnRootRule],
      ['card_wrap', 'u-padding-md'],
      {
        propertiesByClass: { 'u-padding-md': { padding: '16px' } },
        contexts: ['componentRoot']
      }
    );
    expect(results.some(r => r.ruleId === 'cf-no-utilities-on-root')).toBe(true);
  });

  it('cf-containers-clean warns on spacing utilities at componentRoot', () => {
    const results = runRules(
      [cfContainersCleanRule],
      ['container-large', 'u-padding-md'],
      {
        propertiesByClass: { 'u-padding-md': { padding: '16px' } },
        contexts: ['componentRoot']
      }
    );
    expect(results.some(r => r.ruleId === 'cf-containers-clean')).toBe(true);
  });

  it('cf-no-padding-on-inner warns on padding utilities in childGroup', () => {
    const results = runRules(
      [cfNoPaddingOnInnerRule],
      ['card_content', 'u-padding-sm'],
      {
        propertiesByClass: { 'u-padding-sm': { padding: '8px' } },
        contexts: ['childGroup']
      }
    );
    expect(results.some(r => r.ruleId === 'cf-no-padding-on-inner')).toBe(true);
  });

  it('cf-inner-wrapper-recommended suggests at componentRoot', () => {
    const results = runRules(
      [cfInnerWrapperRecommendedRule],
      ['card_wrap'],
      {
        contexts: ['componentRoot']
      }
    );
    expect(results.some(r => r.ruleId === 'cf-inner-wrapper-recommended')).toBe(true);
  });
});


