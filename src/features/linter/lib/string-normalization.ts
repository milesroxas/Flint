/**
 * Shared string normalization utilities for Lumos rules
 */

/**
 * Normalizes a class name to lowercase, hyphen-separated format
 * Removes invalid characters, collapses multiple separators, and trims edges
 */
export function normalizeToHyphenFormat(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "") // Remove invalid characters
    .replace(/_+/g, "-") // Convert underscores to hyphens
    .replace(/--+/g, "-") // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Normalizes a class name to lowercase, underscore-separated format
 * Used for Lumos custom class format validation
 */
export function normalizeToUnderscoreFormat(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_") // Convert spaces to underscores
    .replace(/-/g, "_") // Convert hyphens to underscores
    .replace(/[^a-z0-9_]/g, "") // Remove invalid characters
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_+|_+$/g, ""); // Trim leading/trailing underscores
}

/**
 * Normalizes a utility class name (u-prefix) to valid format
 * @param className - The class name to normalize
 * @returns Normalized utility class name or null if invalid
 */
export function normalizeUtilityClass(className: string): string | null {
  // Remove u- prefix and any additional separators
  const withoutPrefix = className.replace(/^u[_-]?/, "");
  const normalized = normalizeToHyphenFormat(withoutPrefix);

  if (!normalized) return null;

  const candidate = `u-${normalized}`;
  return /^u-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate) ? candidate : null;
}

/**
 * Normalizes a variant class name (is-prefix) to valid format
 * @param className - The class name to normalize
 * @returns Normalized variant class name or null if invalid
 */
export function normalizeVariantClass(className: string): string | null {
  // Remove is- prefix and any additional separators
  const withoutPrefix = className.replace(/^is[_-]?/, "");
  const normalized = normalizeToHyphenFormat(withoutPrefix);

  if (!normalized) return null;

  const candidate = `is-${normalized}`;
  return /^is-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate) ? candidate : null;
}
