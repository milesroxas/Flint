/// <reference types="@webflow/designer-extension-typings" />

// Use the official Webflow API types
export type WebflowElement = AnyElement;

export type ElementContext = 'componentRoot' | 'childGroup' | 'childGroupInvalid'

export interface ElementContextConfig {
  /** suffix to detect wrapper elements */
  wrapSuffix: string
  /** parent class patterns (exact string or RegExp) */
  parentClassPatterns: Array<string | RegExp>
  /** When true, a root requires its IMMEDIATE parent to match container patterns; when false, any ancestor suffices */
  requireDirectParentContainerForRoot?: boolean
  /** When true, child group must share the same type prefix as its nearest root wrap */
  childGroupRequiresSharedTypePrefix?: boolean
  /** Tokenize wrap name by this separator to extract type prefix */
  typePrefixSeparator?: string
  /** Index of the segment used as the type prefix (default 0) */
  typePrefixSegmentIndex?: number
}

export interface ElementParentMap {
  /** Maps element ID to its parent element (null for root elements) */
  [elementId: string]: WebflowElement | null;
}

export interface ElementWithClassNames {
  element: WebflowElement;
  classNames: string[];
}

export interface ElementContextClassifier {
  /** inspect a single element with provided class names and parent map context */
  classifyElement(
    element: WebflowElement, 
    classNames: string[],
    parentMap: ElementParentMap,
    elementClassNamesMap: Record<string, string[]>
  ): ElementContext[]
  
  /** batch-classify all elements with their class names */
  classifyPageElements(
    elementsWithClassNames: ElementWithClassNames[]
  ): Promise<Record<string, ElementContext[]>>
}


