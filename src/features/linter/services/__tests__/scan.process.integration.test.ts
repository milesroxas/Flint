import { describe, it, expect, beforeEach } from 'vitest';
import { scanSelectedElement } from '@/processes/scan/scan-selected-element';
import { scanCurrentPage } from '@/processes/scan/scan-current-page';

type MockStyle = {
  id: string;
  getName: () => Promise<string>;
  getProperties: (opts?: { breakpoint: string }) => Promise<any>;
};

function createMockStyle(id: string, name: string, props?: any): MockStyle {
  return {
    id,
  getName: async () => await Promise.resolve(name),
  getProperties: async () => await Promise.resolve(props ?? {}),
  };
}

function createMockElement(id: string, styles: MockStyle[]) {
  return {
    id: { element: id },
    getStyles: async () => await Promise.resolve(styles),
  } as any;
}

describe('Scan processes integration', () => {
  beforeEach(() => {
    (globalThis as any).webflow = {
      // Used by style.service
      getAllStyles: async () => await Promise.resolve([]),
      // Used by element-lint-service
      getAllElements: async () => await Promise.resolve([]),
    };
  });

  it('scanSelectedElement returns naming violations for invalid custom class', async () => {
    const badCustom = createMockStyle('s1', 'foo'); // invalid: only 1 segment
    const el = createMockElement('el1', [badCustom]);
  (globalThis as any).webflow.getAllElements = async () => await Promise.resolve([el]);

    const results = await scanSelectedElement(el);
    expect(results.some(r => r.ruleId === 'lumos-custom-class-format')).toBe(true);
  });

  it('scanCurrentPage returns violations for invalid custom class', async () => {
    const badCustom = createMockStyle('s2', 'foo');
    const el = createMockElement('el2', [badCustom]);
    const results = await scanCurrentPage([el]);
    expect(results.some(r => r.ruleId === 'lumos-custom-class-format')).toBe(true);
  });
});


