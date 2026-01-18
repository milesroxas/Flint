/**
 * Configuration for preset element categorization and examples
 */
export interface PresetElementsConfig {
  /** Function to get all known elements for this preset */
  getElements: () => string[];

  /** Mapping of category names to their element arrays */
  categoryMap: Record<string, string[]>;

  /** Separator used in class names for this preset */
  separator: string;

  /** Optional preset-specific metadata */
  metadata?: {
    displayName?: string;
    description?: string;
  };
}

/**
 * Represents categorized elements with examples for a preset
 */
export interface RecognizedElements {
  categories: Record<string, string[]>;
  projectElements: string[];
  presetId: string;
  examples: Array<{
    code: string;
    description: string;
  }>;
}
