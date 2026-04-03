import { isThirdPartyClass } from "@/features/linter/lib/third-party-libraries";

/**
 * Normalize user-provided class names: trim, drop empties, first occurrence wins.
 */
export function normalizeIgnoredClassList(classes: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of classes) {
    const t = typeof c === "string" ? c.trim() : "";
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Split pasted text (commas, newlines, whitespace) into raw tokens before normalization. */
export function parseIgnoredClassesInput(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[\s,]+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildMergedIgnoredClassSet(params: {
  globalIgnored: readonly string[];
  presetBuiltinIgnored: readonly string[] | undefined;
  presetUserIgnored: readonly string[] | undefined;
}): Set<string> {
  const merged = normalizeIgnoredClassList([
    ...params.globalIgnored,
    ...(params.presetBuiltinIgnored ?? []),
    ...(params.presetUserIgnored ?? []),
  ]);
  return new Set(merged);
}

/**
 * Returns a filter that keeps class names that should be linted (true = run rules on this class).
 * Returns undefined when every class should be linted (no filtering).
 */
export function buildClassLintFilter(params: {
  ignoreThirdPartyClasses: boolean;
  mergedIgnoredSet: Set<string>;
}): ((name: string) => boolean) | undefined {
  const { ignoreThirdPartyClasses, mergedIgnoredSet } = params;
  const useThirdParty = ignoreThirdPartyClasses;
  const hasCustom = mergedIgnoredSet.size > 0;
  if (!useThirdParty && !hasCustom) return undefined;

  return (name: string) => {
    if (useThirdParty && isThirdPartyClass(name)) return false;
    if (mergedIgnoredSet.has(name)) return false;
    return true;
  };
}
