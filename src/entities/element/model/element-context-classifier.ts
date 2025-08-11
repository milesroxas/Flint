import type {
  ElementContext,
  ElementContextConfig,
  ElementContextClassifier,
  WebflowElement,
  ElementParentMap,
  ElementWithClassNames
} from '@/entities/element/model/element-context.types'

export function createElementContextClassifier(
  configOverride?: Partial<ElementContextConfig>
): ElementContextClassifier {
  const defaultConfig: ElementContextConfig = {
    wrapSuffix: '_wrap',
    parentClassPatterns: [
      'section_contain',
      /^u-section/,
      /^c-/,
    ],
  }
  const { wrapSuffix, parentClassPatterns } = {
    ...defaultConfig,
    ...configOverride,
  }

  const matchesPattern = (
    cls: string,
    patterns: Array<string | RegExp>
  ): boolean =>
    patterns.some((p) =>
      typeof p === 'string' ? cls === p : p.test(cls)
    )

  // Simple in-memory cache keyed by element count to avoid recomputation per selection
  let cachedParentMap: ElementParentMap | null = null;
  let cachedElementsSignature: string | null = null;

  async function buildParentMap(elements: WebflowElement[]): Promise<ElementParentMap> {
    const signature = `${elements.length}`;
    if (cachedParentMap && cachedElementsSignature === signature) {
      return cachedParentMap;
    }
    const parentMap: ElementParentMap = {};
    const processedIds = new Set<string>();

    for (const element of elements) {
      parentMap[element.id.element] = null;
    }

    async function traverseChildren(parent: WebflowElement): Promise<void> {
      if (processedIds.has(parent.id.element)) return;
      processedIds.add(parent.id.element);

      try {
        const children = (typeof (parent as any).getChildren === 'function')
          ? await (parent as any).getChildren()
          : (parent as any).children || [];

        for (const child of children) {
          parentMap[child.id.element] = parent;
          await traverseChildren(child);
        }
      } catch (err) {
        console.error(`Error getting children for element ${parent.id}:`, err);
      }
    }

    for (const element of elements) {
      if (!processedIds.has(element.id.element)) {
        await traverseChildren(element);
      }
    }

    cachedParentMap = parentMap;
    cachedElementsSignature = signature;
    return cachedParentMap;
  }

  function classifyElement(
    element: WebflowElement, 
    classNames: string[],
    parentMap: ElementParentMap,
    elementClassNamesMap: Record<string, string[]>
  ): ElementContext[] {
    const ctxs: ElementContext[] = [];

    try {
      const isWrap = classNames.some((c) => c.endsWith(wrapSuffix));

      if (isWrap) {
        let currentParent = parentMap[element.id.element];
        let hasAncestorContainer = false;
        let hasAncestorWrap = false;

        while (currentParent !== null) {
          const parentClassNames = elementClassNamesMap[currentParent.id.element] || [];
          const matchesContainer = parentClassNames.some((c) => matchesPattern(c, parentClassPatterns));
          const matchesWrap = parentClassNames.some((c) => c.endsWith(wrapSuffix));

          if (matchesContainer) hasAncestorContainer = true;
          if (matchesWrap) hasAncestorWrap = true;

          // We can stop early if we've already found both conditions
          if (hasAncestorContainer && hasAncestorWrap) break;
          currentParent = parentMap[currentParent.id.element];
        }

        // Root group: wrap with an ancestor matching container patterns
        if (hasAncestorContainer) {
          ctxs.push('componentRoot');
        }
        // Child group: wrap nested under another wrap (parent group)
        else if (hasAncestorWrap) {
          ctxs.push('childGroup');
        }
        // Otherwise, leave context empty (neither root nor child group)
      }
    } catch (err) {
      console.error('Error classifying element:', err);
    }

    return ctxs;
  }

  async function classifyPageElements(
    elementsWithClassNames: ElementWithClassNames[]
  ): Promise<Record<string, ElementContext[]>> {
    const elements = elementsWithClassNames.map(item => item.element);
    const parentMap = await buildParentMap(elements);

    const elementClassNamesMap: Record<string, string[]> = {};
    for (const { element, classNames } of elementsWithClassNames) {
      elementClassNamesMap[element.id.element] = classNames;
    }

    const result: Record<string, ElementContext[]> = {};
    for (const { element, classNames } of elementsWithClassNames) {
      const contexts = classifyElement(element, classNames, parentMap, elementClassNamesMap);
      result[element.id.element] = contexts;
    }
    return result;
  }

  return { classifyElement, classifyPageElements };
}


