/**
 * Validate component root naming.
 * Requirements:
 * - Ends with `_wrap`
 * - Prefix is lowercase alphanumeric tokens separated by underscores
 *   e.g., `header_wrap`, `navigation_wrap`, `card_wrap`, `feature_card_wrap`
 */
export function validateComponentRootNaming(className: string): boolean {
  if (!className || !className.endsWith("_wrap")) return false;
  const prefix = className.slice(0, -5);
  if (prefix.length < 2) return false;
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(prefix);
}
