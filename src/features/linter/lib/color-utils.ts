/**
 * Converts various color formats to hex format for display purposes.
 * This is a simplified conversion that handles common cases.
 */
export const convertColorToHex = (colorValue: string): string => {
  // If it's already hex, return as is
  if (colorValue.startsWith("#")) {
    return colorValue;
  }

  // For named colors, return as is (no conversion needed)
  if (/^[a-z]+$/i.test(colorValue)) {
    return colorValue;
  }

  // For HSL/HSLA, RGB/RGBA - create a temporary element to convert
  try {
    const tempElement = document.createElement("div");
    tempElement.style.color = colorValue;
    document.body.appendChild(tempElement);
    const computedColor = getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);

    // Convert RGB to hex
    const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
  } catch (error) {
    // If conversion fails, return original value
    console.warn(`Failed to convert color "${colorValue}" to hex:`, error);
  }

  // Fallback to original value if conversion fails
  return colorValue;
};
