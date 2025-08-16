import { StyleInfo } from "@/entities/style/model/style.service";

export interface UtilityClassDuplicateInfo {
  className: string;
  duplicateProperties: Map<string, string[]>;
  isExactMatch: boolean;
  // Classes that have an identical full property set (key/value pairs)
  exactMatches?: string[];
  // Add formatted property information for better display
  formattedProperty?: {
    property: string;
    value: string;
    classes: string[];
  };
}

export const createUtilityClassAnalyzer = () => {
  const utilityClassPropertiesMap = new Map<
    string,
    { name: string; properties: any }[]
  >();
  const propertyToClassesMap = new Map<string, Set<string>>();
  const exactPropertiesToClassesMap = new Map<string, Set<string>>();
  let lastAllStylesCount = -1;
  const DEBUG = false;

  // Add these getters
  const getUtilityClassPropertiesMap = () => {
    return utilityClassPropertiesMap;
  };

  const getPropertyToClassesMap = () => {
    return propertyToClassesMap;
  };

  const getExactPropertiesToClassesMap = () => {
    return exactPropertiesToClassesMap;
  };

  const normalizeProperties = (props: any): string => {
    try {
      const sortedKeys = Object.keys(props || {}).sort();
      const normalized: Record<string, any> = {};
      for (const key of sortedKeys) {
        normalized[key] = props[key];
      }
      return JSON.stringify(normalized);
    } catch {
      return JSON.stringify(props || {});
    }
  };

  const logDuplicateProperties = (): void => {
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

  const buildPropertyMaps = (allStyles: StyleInfo[]): void => {
    // Only rebuild if input appears to have changed
    if (
      lastAllStylesCount === allStyles.length &&
      utilityClassPropertiesMap.size > 0
    ) {
      return;
    }
    lastAllStylesCount = allStyles.length;

    if (DEBUG) console.log("Building utility class properties map...");

    // Build the class properties map (all classes, not only utilities)
    utilityClassPropertiesMap.clear();
    propertyToClassesMap.clear();
    exactPropertiesToClassesMap.clear();
    for (const style of allStyles) {
      const props = style.properties ?? {};
      if (Object.keys(props).length === 0) continue; // ignore classes with no unique properties
      const existingClasses = utilityClassPropertiesMap.get(style.name) || [];
      utilityClassPropertiesMap.set(style.name, [
        ...existingClasses,
        {
          name: style.name,
          properties: props,
        },
      ]);
    }

    if (DEBUG)
      console.log("Utility class properties map:", utilityClassPropertiesMap);

    // Create property-to-classes mapping and exact properties mapping for all classes
    utilityClassPropertiesMap.forEach((styleEntries, className) => {
      for (const entry of styleEntries) {
        for (const [propName, propValue] of Object.entries(entry.properties)) {
          const propKey = `${propName}:${JSON.stringify(propValue)}`;

          if (!propertyToClassesMap.has(propKey)) {
            propertyToClassesMap.set(propKey, new Set<string>());
          }

          propertyToClassesMap.get(propKey)?.add(className);
        }

        // exact properties fingerprint
        const fingerprint = normalizeProperties(entry.properties);
        if (!exactPropertiesToClassesMap.has(fingerprint)) {
          exactPropertiesToClassesMap.set(fingerprint, new Set<string>());
        }
        exactPropertiesToClassesMap.get(fingerprint)?.add(className);
      }
    });

    if (DEBUG) logDuplicateProperties();
  };

  const analyzeDuplicates = (
    className: string,
    properties: any
  ): UtilityClassDuplicateInfo | null => {
    const duplicateProps = new Map<string, string[]>();
    const propCount = Object.keys(properties).length;
    if (propCount === 0) return null; // nothing unique to compare
    let formattedProperty:
      | { property: string; value: string; classes: string[] }
      | undefined;
    let exactMatches: string[] = [];

    // Check each property for duplicates
    for (const [propName, propValue] of Object.entries(properties)) {
      const propKey = `${propName}:${JSON.stringify(propValue)}`;
      const classesWithThisProp = propertyToClassesMap.get(propKey);

      if (classesWithThisProp && classesWithThisProp.size > 1) {
        const duplicates = Array.from(classesWithThisProp).filter(
          (cls) => cls !== className
        );

        if (duplicates.length > 0) {
          duplicateProps.set(propKey, duplicates);

          // For single property matches, store the formatted property info
          if (propCount === 1) {
            formattedProperty = {
              property: propName,
              value:
                typeof propValue === "string"
                  ? propValue
                  : JSON.stringify(propValue),
              classes: duplicates,
            };
          }
        }
      }
    }

    // Check for exact full-property duplicates (not limited to single-property classes)
    const fingerprint = normalizeProperties(properties);
    const classesWithSameFingerprint =
      exactPropertiesToClassesMap.get(fingerprint);
    if (classesWithSameFingerprint && classesWithSameFingerprint.size > 1) {
      exactMatches = Array.from(classesWithSameFingerprint).filter(
        (cls) => cls !== className
      );
    }

    if (duplicateProps.size === 0 && exactMatches.length === 0) {
      return null;
    }

    // Exact match if there are any classes with identical full property set
    const isExactMatch = exactMatches.length > 0;

    return {
      className,
      duplicateProperties: duplicateProps,
      isExactMatch,
      exactMatches: exactMatches.length > 0 ? exactMatches : undefined,
      formattedProperty,
    };
  };

  return {
    getUtilityClassPropertiesMap,
    getPropertyToClassesMap,
    getExactPropertiesToClassesMap,
    buildPropertyMaps,
    analyzeDuplicates,
  } as const;
};

export type UtilityClassAnalyzer = ReturnType<
  typeof createUtilityClassAnalyzer
>;
