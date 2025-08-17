/// <reference types="@webflow/designer-extension-typings" />

// Minimal element types used by services and detectors in the canonical roles/graph architecture

// Use the official Webflow API types
export type WebflowElement = AnyElement;

export interface ElementWithClassNames {
  element: WebflowElement;
  classNames: string[];
}
