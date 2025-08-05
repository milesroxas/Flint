/// <reference types="vite/client" />

// Webflow Designer API type definitions
interface AnyElement {
  styles?: {
    getStyles(): Promise<any[]>;
  };
  getStyles(): Promise<any[]>;
}

