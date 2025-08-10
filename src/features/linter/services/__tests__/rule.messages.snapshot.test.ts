import { describe, it, expect } from 'vitest';
import { lumosPreset } from '@/presets/lumos.preset';

describe('Rule messages snapshot (shape only)', () => {
  it('rules have stable ids and names', () => {
    const snapshot = lumosPreset.rules.map((r: any) => ({ id: r.id, name: r.name }));
    expect(snapshot).toMatchInlineSnapshot(`
      [
        {
          "id": "lumos-custom-class-format",
          "name": "Lumos Custom Class Format",
        },
        {
          "id": "lumos-utility-class-format",
          "name": "Lumos Utility Class Format",
        },
        {
          "id": "lumos-combo-class-format",
          "name": "Lumos Combo Class Format",
        },
        {
          "id": "lumos-utility-class-exact-duplicate",
          "name": "Exact Duplicate Utility Class",
        },
        {
          "id": "lumos-utility-class-duplicate-properties",
          "name": "Duplicate Utility Class Properties",
        },
        {
          "id": "component-root-semantic-naming",
          "name": "Component Root Semantic Naming",
        },
        {
          "id": "component-root-no-display-utilities",
          "name": "No Display Utilities on Component Roots",
        },
        {
          "id": "component-root-required-structure",
          "name": "Component Root Required Structure",
        },
      ]
    `);
  });
});


