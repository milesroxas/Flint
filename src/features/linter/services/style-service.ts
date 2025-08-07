interface Style {
  id: string;
  getName: () => Promise<string>;
  getProperties: (options?: { breakpoint: string }) => Promise<any>;
}

export interface StyleInfo {
  id: string;
  name: string;
  properties: any;
  order: number;
}

export const createStyleService = () => {
  const getAllStylesWithProperties = async (): Promise<StyleInfo[]> => {
    console.log('Fetching ALL styles from the entire Webflow site...');
    const allStyles = await webflow.getAllStyles();
    console.log(`Retrieved ${allStyles.length} styles from webflow.getAllStyles()`);
    
    console.log('Extracting names and properties from all styles...');
    const allStylesWithProperties = await Promise.all(
      allStyles.map(async (style, index) => {
        try {
          const name = await style.getName();
          let properties = {};
          
          if (name && name.startsWith('u-')) {
            try {
              properties = await style.getProperties({ breakpoint: 'main' });
            } catch (err) {
              console.error(`Error getting properties for style ${name}:`, err);
            }
          }
          
          return { 
            id: style.id, 
            name: name?.trim() || "",
            properties,
            index
          };
        } catch (err) {
          console.error(`Error getting name for style at index ${index}, ID ${style.id}:`, err);
          return { id: style.id, name: "", properties: {}, index };
        }
      })
    );
    
    const validStyles = allStylesWithProperties.filter(style => style.name);
    console.log(`Found ${validStyles.length} valid styles with names out of ${allStyles.length} total styles`);
    
    return validStyles.map((style, index) => ({
      ...style,
      order: index
    }));
  };

  const getAppliedStyles = async (element: any): Promise<StyleInfo[]> => {
    console.log('Getting styles applied to the selected element...');
    
    // Check if element has getStyles method
    if (!element || typeof element.getStyles !== 'function') {
      console.error('Element does not have getStyles method', element);
      return [];
    }
    
    let appliedStyles: Style[] = [];
    try {
      appliedStyles = await element.getStyles();
      console.log(`Retrieved ${appliedStyles?.length || 0} styles applied to the selected element`);
    } catch (err) {
      console.error('Error calling element.getStyles():', err);
      return [];
    }
    
    if (!appliedStyles?.length) {
      return [];
    }

    const seenIds = new Set<string>();
    const uniqueStyles: StyleInfo[] = [];

    console.log('Processing applied styles...');
    for (let i = 0; i < appliedStyles.length; i++) {
      try {
        const style = appliedStyles[i];
        const id = style.id;
        const name = await style.getName();
        const trimmedName = name?.trim() || "";
        
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          
          let properties = {};
          if (trimmedName.startsWith('u-')) {
            try {
              properties = await style.getProperties({ breakpoint: 'main' });
            } catch (err) {
              console.error(`Error getting properties for style ${trimmedName}:`, err);
            }
          }
          
          uniqueStyles.push({ id, name: trimmedName, properties, order: i });
          console.log(`Added unique style: ${trimmedName} (ID: ${id})`);
        }
      } catch (err) {
        console.error(`Error processing applied style at index ${i}:`, err);
      }
    }

    return uniqueStyles;
  };

  const sortStylesByType = (styles: StyleInfo[]): StyleInfo[] => {
    return [...styles].sort((a, b) => {
      const aIsCombo = a.name.startsWith("is-");
      const bIsCombo = b.name.startsWith("is-");
      if (aIsCombo !== bIsCombo) return aIsCombo ? 1 : -1;
      return a.order - b.order;
    });
  };

  return {
    getAllStylesWithProperties,
    getAppliedStyles,
    sortStylesByType
  } as const;
};

export type StyleService = ReturnType<typeof createStyleService>;