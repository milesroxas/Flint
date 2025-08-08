import { StyleInfo } from "@/entities/style/model/style.service";

export interface UtilityClassDuplicateInfo {
  className: string;
  duplicateProperties: Map<string, string[]>;
  isExactMatch: boolean;
  // Add formatted property information for better display
  formattedProperty?: {
    property: string;
    value: string;
    classes: string[];
  };
}

export const createUtilityClassAnalyzer = () => {
  const utilityClassPropertiesMap = new Map<string, {name: string, properties: any}[]>();
  const propertyToClassesMap = new Map<string, Set<string>>();
  let lastAllStylesCount = -1;
  const DEBUG = false;
  
  // Add these getters
  const getUtilityClassPropertiesMap = () => {
    return utilityClassPropertiesMap;
  };
  
  const getPropertyToClassesMap = () => {
    return propertyToClassesMap;
  };

  const logDuplicateProperties = (): void => {
    console.log('Checking for utility classes with duplicate properties:');
    propertyToClassesMap.forEach((classNames, propKey) => {
      if (classNames.size > 1) {
        console.log(`  Property ${propKey} is used by: ${Array.from(classNames).join(', ')}`);
      }
    });
  };

  const buildPropertyMaps = (allStyles: StyleInfo[]): void => {
    // Only rebuild if input appears to have changed
    if (lastAllStylesCount === allStyles.length && utilityClassPropertiesMap.size > 0) {
      return;
    }
    lastAllStylesCount = allStyles.length;

    if (DEBUG) console.log('Building utility class properties map...');
    
    // Build the utility class properties map
    utilityClassPropertiesMap.clear();
    propertyToClassesMap.clear();
    for (const style of allStyles) {
      if (style.name.startsWith('u-')) {
        const existingClasses = utilityClassPropertiesMap.get(style.name) || [];
        utilityClassPropertiesMap.set(style.name, [...existingClasses, { 
          name: style.name, 
          properties: style.properties 
        }]);
      }
    }
    
    if (DEBUG) console.log('Utility class properties map:', utilityClassPropertiesMap);
    
    // Create property-to-classes mapping
    utilityClassPropertiesMap.forEach((styleEntries, className) => {
      for (const entry of styleEntries) {
        for (const [propName, propValue] of Object.entries(entry.properties)) {
          const propKey = `${propName}:${JSON.stringify(propValue)}`;
          
          if (!propertyToClassesMap.has(propKey)) {
            propertyToClassesMap.set(propKey, new Set<string>());
          }
          
          propertyToClassesMap.get(propKey)?.add(className);
        }
      }
    });

    if (DEBUG) logDuplicateProperties();
  };

  const analyzeDuplicates = (className: string, properties: any): UtilityClassDuplicateInfo | null => {
    const duplicateProps = new Map<string, string[]>();
    const propCount = Object.keys(properties).length;
    let formattedProperty: { property: string; value: string; classes: string[] } | undefined;
    
    // Check each property for duplicates
    for (const [propName, propValue] of Object.entries(properties)) {
      const propKey = `${propName}:${JSON.stringify(propValue)}`;
      const classesWithThisProp = propertyToClassesMap.get(propKey);
      
      if (classesWithThisProp && classesWithThisProp.size > 1) {
        const duplicates = Array.from(classesWithThisProp).filter(cls => cls !== className);
        
        if (duplicates.length > 0) {
          duplicateProps.set(propKey, duplicates);
          
          // For single property matches, store the formatted property info
          if (propCount === 1) {
            formattedProperty = {
              property: propName,
              value: typeof propValue === 'string' ? propValue : JSON.stringify(propValue),
              classes: duplicates
            };
          }
        }
      }
    }
    
    if (duplicateProps.size === 0) {
      return null;
    }

    // Check for exact single-property matches
    let isExactMatch = false;
    if (propCount === 1 && duplicateProps.size === 1) {
      const [, duplicateClasses] = Array.from(duplicateProps.entries())[0];
      
      const exactMatches = duplicateClasses.filter(cls => {
        const entries = utilityClassPropertiesMap.get(cls) || [];
        if (entries.length === 0) return false;
        
        const otherProps = entries[0].properties;
        return Object.keys(otherProps).length === 1;
      });
      
      isExactMatch = exactMatches.length > 0;
    }

    return {
      className,
      duplicateProperties: duplicateProps,
      isExactMatch,
      formattedProperty
    };
  };

  return {
    getUtilityClassPropertiesMap,
    getPropertyToClassesMap,
    buildPropertyMaps,
    analyzeDuplicates
  } as const;
};

export type UtilityClassAnalyzer = ReturnType<typeof createUtilityClassAnalyzer>;