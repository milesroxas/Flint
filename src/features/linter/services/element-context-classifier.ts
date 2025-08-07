// src/features/linter/services/element-context-classifier.ts
import type {
    ElementContext,
    ElementContextConfig,
    ElementContextClassifier,
    WebflowElement,
    ElementParentMap,
    ElementWithClassNames
  } from '@/features/linter/types/element-context'
  
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
  
    /**
     * Build a parent-child relationship map using getChildren() traversal
     * Since Webflow API only provides getChildren(), we traverse from roots down
     */
    async function buildParentMap(elements: WebflowElement[]): Promise<ElementParentMap> {
      const parentMap: ElementParentMap = {};
      const processedIds = new Set<string>();
  
      // Initialize all elements as having no parent
      for (const element of elements) {
        parentMap[element.id.element] = null;
      }
  
      /**
       * Recursively traverse element tree using getChildren()
       */
      async function traverseChildren(parent: WebflowElement): Promise<void> {
        if (processedIds.has(parent.id.element)) return;
        processedIds.add(parent.id.element);
  
        try {
          const children = (typeof (parent as any).getChildren === 'function')
            ? await (parent as any).getChildren()
            : (parent as any).children || [];

          for (const child of children) {
            // Record this child's parent
            parentMap[child.id.element] = parent;
            
            // Recursively process this child's children
            await traverseChildren(child);
          }
        } catch (err) {
          console.error(`Error getting children for element ${parent.id}:`, err);
        }
      }
  
      console.log('[ElementContextClassifier] Building parent-child relationships...');
      
      // Start traversal from all elements - getChildren() will naturally build the tree
      for (const element of elements) {
        if (!processedIds.has(element.id.element)) {
          await traverseChildren(element);
        }
      }
  
      console.log(`[ElementContextClassifier] Built parent map for ${Object.keys(parentMap).length} elements`);
      return parentMap;
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
          // Traverse up the tree to find the first matching parent
          let currentParent = parentMap[element.id.element];
          let parentMatches = false;
          let matchingParentId = null;
          
          while (currentParent !== null) {
            const parentClassNames = elementClassNamesMap[currentParent.id.element] || [];
            const hasMatchingParent = parentClassNames.some((c) => 
              matchesPattern(c, parentClassPatterns)
            );
            
            if (hasMatchingParent) {
              parentMatches = true;
              matchingParentId = currentParent.id.element;
              break; // Stop at first matching parent
            }
            
            // Move up to the next parent
            currentParent = parentMap[currentParent.id.element];
          }
          
          if (parentMatches) {
            ctxs.push('componentRoot');
          }
          
          // Debug logging
          console.log(`[ElementContextClassifier] Element ${element.id} has wrap class:`, {
            classNames,
            parentMatches,
            matchingParentId,
            contexts: ctxs
          });
        }
      } catch (err) {
        console.error('Error classifying element:', err);
      }
      
      return ctxs;
    }
  
    async function classifyPageElements(
      elementsWithClassNames: ElementWithClassNames[]
    ): Promise<Record<string, ElementContext[]>> {
      console.log(`[ElementContextClassifier] Starting classification for ${elementsWithClassNames.length} elements...`);
      
      // Extract just the elements for parent mapping
      const elements = elementsWithClassNames.map(item => item.element);
      
      // Build parent-child relationship map
      const parentMap = await buildParentMap(elements);
      
      // Create class names map for efficient lookup
      const elementClassNamesMap: Record<string, string[]> = {};
      for (const { element, classNames } of elementsWithClassNames) {
        elementClassNamesMap[element.id.element] = classNames;
      }
      
      const result: Record<string, ElementContext[]> = {};
      
      // Process elements in batches to avoid overwhelming operations
      const batchSize = 20; // Can be higher since we're not making API calls
      for (let i = 0; i < elementsWithClassNames.length; i += batchSize) {
        const batch = elementsWithClassNames.slice(i, i + batchSize);
        
        for (const { element, classNames } of batch) {
          const contexts = classifyElement(element, classNames, parentMap, elementClassNamesMap);
          result[element.id.element] = contexts;
        }
      }
  
      const totalContexts = Object.values(result).reduce((sum, contexts) => sum + contexts.length, 0);
      console.log(`[ElementContextClassifier] Classification complete. Found ${totalContexts} total contexts.`);
      
      return result;
    }
  
    return {
      classifyElement,
      classifyPageElements,
    }
  }