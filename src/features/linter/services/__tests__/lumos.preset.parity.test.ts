import { describe, it, expect } from 'vitest';
import { createRuleRegistry } from '@/features/linter/services/rule-registry';
import { defaultRules } from '@/features/linter/rules/default-rules';
import { contextAwareRules } from '@/features/linter/rules/context-aware-rules';
import { lumosPreset } from '@/presets/lumos.preset';

describe('Lumos preset parity', () => {
  it('preset rules match legacy default + context-aware by rule id', () => {
    const legacyRegistry = createRuleRegistry();
    legacyRegistry.registerRules(defaultRules);
    legacyRegistry.registerRules(contextAwareRules);

    const presetRegistry = createRuleRegistry();
    presetRegistry.registerRules(lumosPreset.rules);

    const legacyIds = new Set(legacyRegistry.getAllRules().map(r => r.id));
    const presetIds = new Set(presetRegistry.getAllRules().map(r => r.id));

    expect(presetIds).toEqual(legacyIds);
  });
});


