// src/features/linter/utils/id-utils.ts
export function toElementKey(el: unknown): string {
  const anyEl = el as any;
  return String(
    (anyEl?.id && anyEl.id.element) ?? anyEl?.id ?? anyEl?.nodeId ?? ""
  );
}

/**
 * Gets the HTML tag name for a Webflow element following official API pattern
 * @param element - The Webflow element
 * @returns Promise<string | null> - The tag name or null if unable to determine
 */
export async function getElementTag(element: unknown): Promise<string | null> {
  try {
    const anyElement = element as any;

    // Check if element has getTag method regardless of type
    // The docs show that DOM elements should have this method
    if (typeof anyElement?.getTag === "function") {
      const tag = await anyElement.getTag();
      return tag || null;
    }

    // Element doesn't have getTag method
    return null;
  } catch (error) {
    console.warn("Failed to get element tag:", error);
    return null;
  }
}
