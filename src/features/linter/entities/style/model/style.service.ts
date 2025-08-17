// Rehomed from features/linter/services/style-service.ts (no logic changes)
import {
  getStyleServiceCache,
  setStyleServiceCache,
} from "./style-service-cache";

interface Style {
  id: string;
  getName: () => Promise<string>;
  getProperties: (options?: { breakpoint: string }) => Promise<any>;
  // Webflow Designer API: style.isComboClass(): Promise<boolean>
  // Optional at type level to allow graceful fallback in non-supporting contexts
  isComboClass?: () => Promise<boolean>;
}

export interface StyleInfo {
  id: string;
  name: string;
  properties: any;
  order: number;
  // True when Webflow marks this style as a combo class; fallback to name prefix when API unavailable
  isCombo: boolean;
  // Minimal debug: indicate whether combo detection came from the Webflow API or heuristic
  detectionSource?: "api" | "heuristic";
}

export interface ElementStyleInfo {
  elementId: string;
  styles: StyleInfo[];
}

export interface StyleWithElement extends StyleInfo {
  elementId: string;
}

const DEBUG = false;

export const createStyleService = () => {
  const getAllStylesWithProperties = (): Promise<StyleInfo[]> => {
    let cachedAllStylesPromise = getStyleServiceCache();
    if (!cachedAllStylesPromise) {
      if (DEBUG)
        console.log("Fetching ALL styles from the entire Webflow site...");
      cachedAllStylesPromise = (async () => {
        const allStyles = await webflow.getAllStyles();
        if (DEBUG)
          console.log(
            `Retrieved ${allStyles.length} styles from webflow.getAllStyles()`
          );

        if (DEBUG)
          console.log("Extracting names and properties from all styles...");
        const allStylesWithProperties = await Promise.all(
          allStyles.map(async (style, index) => {
            try {
              const name = await style.getName();
              let properties = {};
              // Prefer Webflow Designer API for combo detection; fall back to heuristic
              let isCombo = false;
              let detectionSource: "api" | "heuristic" = "heuristic";
              if (typeof style.isComboClass === "function") {
                try {
                  isCombo = await style.isComboClass();
                  detectionSource = "api";
                } catch (err) {
                  // Fallback to heuristic if API throws
                  isCombo =
                    /^(?:is[-_][A-Za-z0-9_]+|is[A-Z][A-Za-z0-9_]*)$/.test(
                      name || ""
                    );
                  detectionSource = "heuristic";
                }
              } else {
                // Heuristic fallback when API isn't available
                isCombo = /^(?:is[-_][A-Za-z0-9_]+|is[A-Z][A-Za-z0-9_]*)$/.test(
                  name || ""
                );
                detectionSource = "heuristic";
              }

              try {
                // Retrieve unique (non-inherited) properties for all classes
                // so combos/customs can be compared against utilities
                properties = await style.getProperties({ breakpoint: "main" });
              } catch (err) {
                if (DEBUG)
                  console.error(
                    `Error getting properties for style ${name}:`,
                    err
                  );
              }

              return {
                id: style.id,
                name: name?.trim() || "",
                properties,
                index,
                isCombo,
                detectionSource,
              };
            } catch (err) {
              if (DEBUG)
                console.error(
                  `Error getting name for style at index ${index}, ID ${style.id}:`,
                  err
                );
              return {
                id: style.id,
                name: "",
                properties: {},
                index,
                isCombo: false,
              };
            }
          })
        );

        const validStyles = allStylesWithProperties.filter(
          (style) => style.name
        );
        if (DEBUG)
          console.log(
            `Found ${validStyles.length} valid styles with names out of ${allStyles.length} total styles`
          );

        return validStyles.map((style, index) => ({
          ...style,
          order: index,
        }));
      })();
      setStyleServiceCache(cachedAllStylesPromise);
    }

    return cachedAllStylesPromise as Promise<StyleInfo[]>;
  };

  const getAppliedStyles = async (element: any): Promise<StyleInfo[]> => {
    if (DEBUG) console.log("Getting styles applied to the selected element...");

    if (!element || typeof element.getStyles !== "function") {
      console.error("Element does not have getStyles method", element);
      return [];
    }

    let appliedStyles: Style[] = [];
    try {
      appliedStyles = await element.getStyles();
      if (DEBUG)
        console.log(
          `Retrieved ${
            appliedStyles?.length || 0
          } styles applied to the selected element`
        );
    } catch (err) {
      console.error("Error calling element.getStyles():", err);
      return [];
    }

    if (!appliedStyles?.length) {
      return [];
    }

    const seenIds = new Set<string>();
    const uniqueStyles: StyleInfo[] = [];

    if (DEBUG) console.log("Processing applied styles...");
    for (let i = 0; i < appliedStyles.length; i++) {
      try {
        const style = appliedStyles[i];
        const id = style.id;
        const name = await style.getName();
        const trimmedName = name?.trim() || "";
        // Prefer Webflow Designer API for combo detection; fall back to heuristic
        let isCombo = false;
        let detectionSource: "api" | "heuristic" = "heuristic";
        if (typeof style.isComboClass === "function") {
          try {
            isCombo = await style.isComboClass();
            detectionSource = "api";
          } catch {
            isCombo = /^(?:is[-_][A-Za-z0-9_]+|is[A-Z][A-Za-z0-9_]*)$/.test(
              trimmedName
            );
            detectionSource = "heuristic";
          }
        } else {
          isCombo = /^(?:is[-_][A-Za-z0-9_]+|is[A-Z][A-Za-z0-9_]*)$/.test(
            trimmedName
          );
          detectionSource = "heuristic";
        }

        if (id && !seenIds.has(id)) {
          seenIds.add(id);

          let properties = {};
          try {
            // Retrieve unique (non-inherited) properties for all classes
            properties = await style.getProperties({ breakpoint: "main" });
          } catch (err) {
            console.error(
              `Error getting properties for style ${trimmedName}:`,
              err
            );
          }

          uniqueStyles.push({
            id,
            name: trimmedName,
            properties,
            order: i,
            isCombo,
            detectionSource,
          });
          if (DEBUG)
            console.log(`Added unique style: ${trimmedName} (ID: ${id})`);
        }
      } catch (err) {
        console.error(`Error processing applied style at index ${i}:`, err);
      }
    }

    return uniqueStyles;
  };

  // Lightweight helper: only fetch class names for an element (no properties)
  const getAppliedClassNames = async (element: any): Promise<string[]> => {
    if (!element || typeof element.getStyles !== "function") {
      return [];
    }
    let styles: Style[] = [];
    try {
      styles = await element.getStyles();
    } catch {
      return [];
    }
    if (!styles?.length) return [];

    const seen = new Set<string>();
    const names = await Promise.all(
      styles.map(async (s) => {
        try {
          const n = await s.getName();
          const t = n?.trim() || "";
          return t;
        } catch {
          return "";
        }
      })
    );
    const deduped: string[] = [];
    for (const n of names) {
      if (n && !seen.has(n)) {
        seen.add(n);
        deduped.push(n);
      }
    }
    return deduped;
  };

  const getAppliedStylesWithElementId = async (
    element: any
  ): Promise<StyleWithElement[]> => {
    const styles = await getAppliedStyles(element);
    return styles.map((style) => ({
      ...style,
      elementId: element.id,
    }));
  };

  const sortStylesByType = (styles: StyleInfo[]): StyleInfo[] => {
    return [...styles].sort((a, b) => {
      const aIsCombo = a.isCombo === true;
      const bIsCombo = b.isCombo === true;
      if (aIsCombo !== bIsCombo) return aIsCombo ? 1 : -1;
      return a.order - b.order;
    });
  };

  return {
    getAllStylesWithProperties,
    getAppliedStyles,
    getAppliedStylesWithElementId,
    sortStylesByType,
    getAppliedClassNames,
  } as const;
};

export type StyleService = ReturnType<typeof createStyleService>;
