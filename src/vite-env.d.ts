/// <reference types="vite/client" />

// Webflow Designer API type definitions
interface AnyElement {
  styles?: {
    getStyles(): Promise<any[]>;
  };
  getStyles(): Promise<any[]>;
}

declare const webflow: {
  subscribe(event: string, callback: (element: AnyElement | null) => void): () => void;
};