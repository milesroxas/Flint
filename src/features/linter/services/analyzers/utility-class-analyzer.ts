import type { StyleInfo } from "@/entities/style/model/style.types";
import { stableStringify } from "@/shared/lib";

// Narrow, explicit CSS property dictionary type
export type CSSScalar = string | number | boolean | null;
export type CSSPropertiesDict = Record<string, CSSScalar>;

export interface UtilityClassDuplicateInfo {
  className: string;
  // key = "propName:JSON(value)" -> class names sharing that exact property:value
  duplicateProperties: Map<string, string[]>;
  isExactMatch: boolean;
  exactMatches?: string[];
  formattedProperty?: {
    property: string;
    value: string;
    classes: string[];
  };
}

export type UtilityAnalyzerOptions = {
  /**
   * Optional classifier that tells the analyzer which class names should be
   * considered "utilities" for indexing. If omitted, all classes are indexed.
   * Pass a grammar-aware predicate from the active preset to align with the PRD.
   */
  isUtilityName?: (className: string) => boolean;
  debug?: boolean;
};

export const createUtilityClassAnalyzer = (
  opts: UtilityAnalyzerOptions = {}
) => {
  const { isUtilityName, debug = false } = opts;

  const utilityClassPropertiesMap = new Map<
    string,
    { name: string; properties: CSSPropertiesDict }[]
  >();

  const propertyToClassesMap = new Map<string, Set<string>>();
  const exactPropertiesToClassesMap = new Map<string, Set<string>>();

  // Stable cache keyed by a hash of allStyles
  let lastBuildHash: string | null = null;

  const getUtilityClassPropertiesMap = () => utilityClassPropertiesMap;
  const getPropertyToClassesMap = () => propertyToClassesMap;
  const getExactPropertiesToClassesMap = () => exactPropertiesToClassesMap;

  // Enhanced getPropertyToClassesMap that returns structured data for property/value analysis
  const getPropertyToClassesStructuredMap = (): Map<
    string,
    Map<string, Set<string>>
  > => {
    const structuredMap = new Map<string, Map<string, Set<string>>>();

    propertyToClassesMap.forEach((classSet, propKey) => {
      const [property, valueJson] = propKey.split(":", 2);
      if (!property || valueJson === undefined) return;

      if (!structuredMap.has(property)) {
        structuredMap.set(property, new Map<string, Set<string>>());
      }

      const propertyMap = structuredMap.get(property)!;
      if (!propertyMap.has(valueJson)) {
        propertyMap.set(valueJson, new Set<string>());
      }

      // Copy all classes from the original set
      classSet.forEach((className) => {
        propertyMap.get(valueJson)!.add(className);
      });
    });

    return structuredMap;
  };

  // Helper to get formatted single property info for utility classes
  const getFormattedSinglePropertyInfo = (
    className: string
  ): { property: string; value: string } | null => {
    const entries = utilityClassPropertiesMap.get(className);
    if (!entries || entries.length === 0) return null;

    // Get the first entry (should only be one for utility classes)
    const entry = entries[0];
    const propEntries = Object.entries(entry.properties ?? {});

    // Only return info if this is a single-property utility
    if (propEntries.length !== 1) return null;

    const [property, value] = propEntries[0];
    return {
      property,
      value: typeof value === "string" ? value : stableStringify(value),
    };
  };

  const computeStylesHash = (styles: StyleInfo[]): string => {
    // Only include data that affects mappings
    const payload = styles.map((s) => ({
      name: s.name,
      properties: s.properties ?? {},
    }));
    return stableStringify(payload);
  };

  const normalizeProperties = (props: CSSPropertiesDict): string =>
    stableStringify(props || {});

  const logDuplicateProperties = (): void => {
    if (!debug) return;
    console.log("Checking for utility classes with duplicate properties:");
    propertyToClassesMap.forEach((classNames, propKey) => {
      if (classNames.size > 1) {
        console.log(
          `  Property ${propKey} is used by: ${Array.from(classNames).join(
            ", "
          )}`
        );
      }
    });
  };

  const reset = (): void => {
    lastBuildHash = null;
    utilityClassPropertiesMap.clear();
    propertyToClassesMap.clear();
    exactPropertiesToClassesMap.clear();
  };

  const buildPropertyMaps = (allStyles: StyleInfo[]): void => {
    const nextHash = computeStylesHash(allStyles);
    if (lastBuildHash === nextHash && utilityClassPropertiesMap.size > 0) {
      return; // cache hit
    }
    lastBuildHash = nextHash;

    reset(); // clear maps before rebuild

    // Index styles
    for (const style of allStyles) {
      const props = (style.properties ?? {}) as CSSPropertiesDict;
      if (Object.keys(props).length === 0) continue;

      // If a classifier is provided, skip non-utility classes
      if (isUtilityName && !isUtilityName(style.name)) continue;

      const existing = utilityClassPropertiesMap.get(style.name) ?? [];
      utilityClassPropertiesMap.set(style.name, [
        ...existing,
        { name: style.name, properties: props },
      ]);
    }

    // Build property:value -> classes and exact fingerprint -> classes maps
    utilityClassPropertiesMap.forEach((styleEntries, className) => {
      for (const entry of styleEntries) {
        for (const [propName, propValue] of Object.entries(entry.properties)) {
          const propKey = `${propName}:${stableStringify(propValue)}`;
          if (!propertyToClassesMap.has(propKey)) {
            propertyToClassesMap.set(propKey, new Set<string>());
          }
          propertyToClassesMap.get(propKey)!.add(className);
        }
        const fingerprint = normalizeProperties(entry.properties);
        if (!exactPropertiesToClassesMap.has(fingerprint)) {
          exactPropertiesToClassesMap.set(fingerprint, new Set<string>());
        }
        exactPropertiesToClassesMap.get(fingerprint)!.add(className);
      }
    });

    logDuplicateProperties();
  };

  const ensureBuilt = (allStyles: StyleInfo[]): void => {
    if (utilityClassPropertiesMap.size === 0) buildPropertyMaps(allStyles);
    else {
      const nextHash = computeStylesHash(allStyles);
      if (lastBuildHash !== nextHash) buildPropertyMaps(allStyles);
    }
  };

  const analyzeDuplicates = (
    className: string,
    properties: CSSPropertiesDict
  ): UtilityClassDuplicateInfo | null => {
    const propEntries = Object.entries(properties ?? {});
    if (propEntries.length === 0) return null;

    const duplicateProps = new Map<string, string[]>();
    let formattedProperty:
      | { property: string; value: string; classes: string[] }
      | undefined;
    let exactMatches: string[] = [];

    for (const [propName, propValue] of propEntries) {
      const propKey = `${propName}:${stableStringify(propValue)}`;
      const classesWithThisProp = propertyToClassesMap.get(propKey);

      if (classesWithThisProp && classesWithThisProp.size > 1) {
        const duplicates = Array.from(classesWithThisProp).filter(
          (cls) => cls !== className
        );
        if (duplicates.length > 0) {
          duplicateProps.set(propKey, duplicates);
          if (propEntries.length === 1) {
            formattedProperty = {
              property: propName,
              value:
                typeof propValue === "string"
                  ? propValue
                  : stableStringify(propValue),
              classes: duplicates,
            };
          }
        }
      }
    }

    // Full-property duplicate check
    const fingerprint = normalizeProperties(properties);
    const classesWithSameFingerprint =
      exactPropertiesToClassesMap.get(fingerprint);
    if (classesWithSameFingerprint && classesWithSameFingerprint.size > 1) {
      exactMatches = Array.from(classesWithSameFingerprint).filter(
        (cls) => cls !== className
      );
    }

    if (duplicateProps.size === 0 && exactMatches.length === 0) return null;

    return {
      className,
      duplicateProperties: duplicateProps,
      isExactMatch: exactMatches.length > 0,
      exactMatches: exactMatches.length ? exactMatches : undefined,
      formattedProperty,
    };
  };

  return {
    // data
    getUtilityClassPropertiesMap,
    getPropertyToClassesMap,
    getExactPropertiesToClassesMap,
    getPropertyToClassesStructuredMap,

    // lifecycle
    buildPropertyMaps,
    ensureBuilt,
    reset,

    // analysis
    analyzeDuplicates,
    getFormattedSinglePropertyInfo,
  } as const;
};

export type UtilityClassAnalyzer = ReturnType<
  typeof createUtilityClassAnalyzer
>;
