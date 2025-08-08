import { describe, it, expect } from 'vitest';
import { createRuleRegistry } from '@/features/linter/services/rule-registry';
// Legacy rule aggregations removed; parity test compares against the preset rules directly.
import { lumosPreset } from '@/presets/lumos.preset';

describe('Lumos preset parity', () => {
  it('preset rules match legacy default + context-aware by rule id', () => {
    const presetRegistry = createRuleRegistry();
    presetRegistry.registerRules(lumosPreset.rules);

    // Assert expected rule IDs are present. This ensures stability after removing legacy aggregations.
    const presetIds = new Set(presetRegistry.getAllRules().map(r => r.id));
    expect(presetIds.has('lumos-custom-class-format')).toBe(true);
    expect(presetIds.has('lumos-utility-class-format')).toBe(true);
    expect(presetIds.has('lumos-combo-class-format')).toBe(true);
    expect(presetIds.has('lumos-utility-class-exact-duplicate')).toBe(true);
    expect(presetIds.has('lumos-utility-class-duplicate-properties')).toBe(true);
    expect(presetIds.has('component-root-semantic-naming')).toBe(true);
    expect(presetIds.has('component-root-no-display-utilities')).toBe(true);
    expect(presetIds.has('component-root-required-structure')).toBe(true);
  });
});


