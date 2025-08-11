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
      /^page_main/,
    ],
    requireDirectParentContainerForRoot: true,
    childGroupRequiresSharedTypePrefix: true,
    typePrefixSeparator: '_',
    typePrefixSegmentIndex: 0,
    groupNamePattern: /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    childGroupPrefixJoiner: '_',
  }
  const { wrapSuffix, parentClassPatterns, requireDirectParentContainerForRoot, childGroupRequiresSharedTypePrefix, typePrefixSeparator, typePrefixSegmentIndex, groupNamePattern, childGroupPrefixJoiner } = {
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
        // Determine if this wrap is a component root: immediate parent must match container patterns
        const directParent = parentMap[element.id.element];
        const directParentClassNames = directParent ? (elementClassNamesMap[directParent.id.element] || []) : [];
        const isImmediateParentContainer = directParentClassNames.some((c) => matchesPattern(c, parentClassPatterns));

        let isRoot = false;
        if (requireDirectParentContainerForRoot) {
          isRoot = isImmediateParentContainer;
        } else {
          // Any ancestor container qualifies
          let cursor = directParent;
          while (cursor !== null && !isRoot) {
            const names = elementClassNamesMap[cursor.id.element] || [];
            if (names.some((c) => matchesPattern(c, parentClassPatterns))) isRoot = true;
            cursor = parentMap[cursor.id.element];
          }
        }

        if (isRoot) {
          ctxs.push('componentRoot');
        } else {
          // Determine childGroup: nearest ancestor that has a *_wrap class and shares the same type prefix
          let nearestWrapElement: WebflowElement | null = null;
          let nearestWrapClassName: string | null = null;
          let cursor = directParent;
          while (cursor !== null) {
            const names = elementClassNamesMap[cursor.id.element] || [];
            const wrapName = names.find((n) => n.endsWith(wrapSuffix));
            if (wrapName) {
              nearestWrapElement = cursor;
              nearestWrapClassName = wrapName;
              break;
            }
            cursor = parentMap[cursor.id.element];
          }

          if (nearestWrapElement && nearestWrapClassName) {
            // Ensure the nearest wrap is a root by checking its immediate parent is a container
            const parentOfNearest = parentMap[nearestWrapElement.id.element];
            const parentOfNearestNames = parentOfNearest ? (elementClassNamesMap[parentOfNearest.id.element] || []) : [];
            const nearestIsRoot = parentOfNearestNames.some((c) => matchesPattern(c, parentClassPatterns));

            if (nearestIsRoot) {
              const thisWrapName = (classNames.find((n) => n.endsWith(wrapSuffix)) || "");
              // Full parent prefix derived via configured separator and index if possible
              const parentCore = nearestWrapClassName.slice(0, -wrapSuffix.length);
              const parentSegments = parentCore.split(typePrefixSeparator as string).filter(Boolean);
              const selectedIndex = Math.max(0, Math.min(parentSegments.length - 1, typePrefixSegmentIndex as number));
              const typePrefix = parentSegments[selectedIndex] ?? parentCore;
              const parentPrefix = typePrefix;

              if (!childGroupRequiresSharedTypePrefix) {
                ctxs.push('childGroup');
              } else {
                // Must begin with parentPrefix + joiner and include a non-empty groupName segment before trailing wrap
                const endsWithWrap = thisWrapName.endsWith(wrapSuffix);
                const childCore = thisWrapName.slice(0, -wrapSuffix.length);
                const joiner = childGroupPrefixJoiner as string;
                const expectedPrefix = `${parentPrefix}${joiner}`;
                const hasPrefix = childCore.startsWith(expectedPrefix);
                const groupSegment = hasPrefix ? childCore.slice(expectedPrefix.length) : "";
                const namePattern = groupNamePattern as RegExp;
                const validGroup = groupSegment.length > 0 && namePattern.test(groupSegment);

                if (endsWithWrap && hasPrefix && validGroup) {
                  ctxs.push('childGroup');
                } else {
                  ctxs.push('childGroupInvalid');
                }
              }
            }
          }
        }
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


