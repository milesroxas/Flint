import type { RecognizedElements } from "@/features/linter/model/preset-elements.types";
import { getAllPresets } from "@/features/linter/presets";

/**
 * Service for extracting recognized elements from preset configurations
 */
export type PresetElementsService = ReturnType<
  typeof createPresetElementsService
>;

export function createPresetElementsService() {
  // Simple cache for computed results
  let cache: Record<string, RecognizedElements> = {};

  function clearCache(): void {
    cache = {};
  }

  function getForPreset(presetId: string): RecognizedElements {
    // Check cache first
    if (cache[presetId]) {
      return cache[presetId];
    }

    const result = buildRecognizedElements(presetId);
    cache[presetId] = result;
    return result;
  }

  function buildRecognizedElements(presetId: string): RecognizedElements {
    // Discover preset configuration dynamically
    const presets = getAllPresets();
    const preset = presets.find((p) => p.id === presetId);

    if (!preset || !("elementsConfig" in preset)) {
      // Fallback to lumos for unknown presets
      return presetId !== "lumos"
        ? buildRecognizedElements("lumos")
        : {
            categories: {},
            projectElements: [],
            presetId,
            examples: [],
          };
    }

    const config = (preset as any).elementsConfig;
    const elements = config.getElements();
    const categories = categorizeByMap(elements, config.categoryMap);

    return {
      categories,
      projectElements: [], // TODO: Get from configuration
      presetId,
      examples: generateExamples(presetId, categories, config.separator),
    };
  }

  function categorizeByMap(
    elements: string[],
    categoryMap: Record<string, string[]>
  ): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    // Initialize categories
    Object.keys(categoryMap).forEach((category) => {
      result[category] = [];
    });

    // Categorize elements
    elements.forEach((element) => {
      for (const [category, categoryElements] of Object.entries(categoryMap)) {
        if (categoryElements.includes(element)) {
          result[category].push(element);
          break; // Element can only belong to one category
        }
      }
    });

    return result;
  }

  function generateExamples(
    _presetId: string,
    categories: Record<string, string[]>,
    separator: string
  ): Array<{
    code: string;
    description: string;
  }> {
    const layoutElement = categories.layout?.[0] || "wrap";
    const contentElement = categories.content?.[0] || "text";
    const interactiveElement =
      categories.interactive?.[0] || categories.components?.[0] || "button";

    return [
      {
        code: `hero${separator}${layoutElement}`,
        description: "Layout element",
      },
      {
        code: `nav${separator}link${separator}${contentElement}`,
        description: "Navigation content",
      },
      {
        code: `card${separator}primary${separator}${interactiveElement}`,
        description: "Interactive element",
      },
    ];
  }

  return {
    getForPreset,
    clearCache,
  } as const;
}
