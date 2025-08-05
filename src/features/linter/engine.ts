
import { RuleResult, Severity } from "@/features/linter/types"
import {
  lumosCustomClassRule,
  lumosUtilityClassRule,
  lumosComboClassRule,
} from "@/features/linter/rules/lumosCustomClassRule"

// Store utility class properties for comparison
// Map of property hash -> array of class names with those properties
const utilityClassPropertiesMap = new Map<string, {name: string, properties: any}[]>()

export async function runLint(element: any): Promise<RuleResult[]> {
  const results: RuleResult[] = []

  try {
    console.log('Starting lint process...')
    
    //
    // 1. Get all styles from the entire site
    //
    console.log('Fetching ALL styles from the entire Webflow site...')
    const allStyles: Style[] = await webflow.getAllStyles()
    console.log(`Retrieved ${allStyles.length} styles from webflow.getAllStyles()`)
    
    // Get all style names and properties
    console.log('Extracting names and properties from all styles...')
    const allStylesWithProperties = await Promise.all(
      allStyles.map(async (style, index) => {
        try {
          const name = await style.getName()
          let properties = {}
          
          // Only get properties for utility classes
          if (name && name.startsWith('u-')) {
            try {
              // Get properties for this style using the main breakpoint
              properties = await style.getProperties({ breakpoint: 'main' })
            } catch (err) {
              console.error(`Error getting properties for style ${name}:`, err)
            }
          }
          
          return { 
            id: style.id, 
            name: name?.trim() || "",
            properties,
            index
          }
        } catch (err) {
          console.error(`Error getting name for style at index ${index}, ID ${style.id}:`, err)
          return { id: style.id, name: "", properties: {}, index }
        }
      })
    )
    
    // Filter out styles with empty names
    const validStyles = allStylesWithProperties.filter(style => style.name)
    console.log(`Found ${validStyles.length} valid styles with names out of ${allStyles.length} total styles`)
    
    // Build the utility class properties map
for (const style of validStyles) {
  if (style.name.startsWith('u-')) {
    // Store the utility class with its properties
    const existingClasses = utilityClassPropertiesMap.get(style.name) || []
    utilityClassPropertiesMap.set(style.name, [...existingClasses, { name: style.name, properties: style.properties }])
  }
}
    
    console.log('Utility class properties map:', utilityClassPropertiesMap)
    
    // Create a map to track utility classes by their individual properties
const propertyToClassesMap = new Map<string, Set<string>>()

// Process each utility class and its properties
utilityClassPropertiesMap.forEach((styleEntries, className) => {
  for (const entry of styleEntries) {
    // For each property in this utility class
    for (const [propName, propValue] of Object.entries(entry.properties)) {
      const propKey = `${propName}:${JSON.stringify(propValue)}`
      
      if (!propertyToClassesMap.has(propKey)) {
        propertyToClassesMap.set(propKey, new Set<string>())
      }
      
      propertyToClassesMap.get(propKey)?.add(className)
    }
  }
})

// Log duplicate property sets
console.log('Checking for utility classes with duplicate properties:')
propertyToClassesMap.forEach((classNames, propKey) => {
  if (classNames.size > 1) {
    console.log(`  Property ${propKey} is used by: ${Array.from(classNames).join(', ')}`)
  }
})

    //
    // 2. Get only the styles applied to the selected element
    //
    console.log('Getting styles applied to the selected element...')
    const appliedStyles: Style[] = await element.getStyles()
    console.log(`Retrieved ${appliedStyles?.length || 0} styles applied to the selected element`)
    
    if (!appliedStyles?.length) {
      console.log('No styles applied to the selected element, returning empty results')
      return results
    }

    //
    // 3. Collect unique styles in order of application
    //
    type StyleInfo = { id: string; name: string; properties: any; order: number }
    const seenIds = new Set<string>()
    const uniqueStyles: StyleInfo[] = []

    console.log('Processing applied styles...')
    for (let i = 0; i < appliedStyles.length; i++) {
      try {
        const style = appliedStyles[i]
        const id = style.id
        const name = await style.getName()
        const trimmedName = name?.trim() || ""
        
        if (id && !seenIds.has(id)) {
          seenIds.add(id)
          
          let properties = {}
          if (trimmedName.startsWith('u-')) {
            try {
              // Get properties for the main breakpoint
              properties = await style.getProperties({ breakpoint: 'main' })
            } catch (err) {
              console.error(`Error getting properties for style ${trimmedName}:`, err)
            }
          }
          
          uniqueStyles.push({ id, name: trimmedName, properties, order: i })
          console.log(`Added unique style: ${trimmedName} (ID: ${id})`)
        }
      } catch (err) {
        console.error(`Error processing applied style at index ${i}:`, err)
      }
    }

    console.log(`Found ${uniqueStyles.length} unique applied styles`)

    //
    // 4. Sort so combo-classes ("is-") come last, otherwise preserve source order
    //
    uniqueStyles.sort((a, b) => {
      const aIsCombo = a.name.startsWith("is-")
      const bIsCombo = b.name.startsWith("is-")
      if (aIsCombo !== bIsCombo) return aIsCombo ? 1 : -1
      return a.order - b.order
    })

    //
    // 5. Run exactly one rule per applied class
    //
    console.log('Running lint rules on applied styles...')
    for (const { id, name, properties } of uniqueStyles) {
      console.log(`Processing style - ID: ${id}, Name: ${name}`)

      // 5a. Combo-classes
      if (name.startsWith("is-")) {
        if (!lumosComboClassRule.test(name)) {
          results.push({
            ruleId: lumosComboClassRule.id,
            name: lumosComboClassRule.name,
            message: lumosComboClassRule.description,
            severity: lumosComboClassRule.severity as Severity,
            className: name,
            isCombo: true,
          })
          console.log(`  Failed combo class rule: ${name}`)
        } else {
          console.log(`  Passed combo class rule: ${name}`)
        }
        continue
      }

      // 5b. Utility-classes
if (name.startsWith("u-")) {
  if (!lumosUtilityClassRule.test(name)) {
    results.push({
      ruleId: lumosUtilityClassRule.id,
      name: lumosUtilityClassRule.name,
      message: lumosUtilityClassRule.description,
      severity: lumosUtilityClassRule.severity as Severity,
      className: name,
      isCombo: false,
    })
    console.log(`  Failed utility class format rule: ${name}`)
  } else {
    // Check for duplicate individual properties
    const duplicateProps = new Map<string, string[]>()
    const propCount = Object.keys(properties).length
    
    // For each property in this utility class
    for (const [propName, propValue] of Object.entries(properties)) {
      const propKey = `${propName}:${JSON.stringify(propValue)}`
      const classesWithThisProp = propertyToClassesMap.get(propKey)
      
      if (classesWithThisProp && classesWithThisProp.size > 1) {
        // Find other classes with this same property (excluding this one)
        const duplicates = Array.from(classesWithThisProp).filter(cls => cls !== name)
        
        if (duplicates.length > 0) {
          duplicateProps.set(propKey, duplicates)
        }
      }
    }
    
    if (duplicateProps.size > 0) {
      // Format the message to show which specific properties are duplicated
      const dupPropMessages = Array.from(duplicateProps.entries())
        .map(([prop, classes]) => `${prop} (also in: ${classes.join(', ')})`)
      
      // Check if this class has exactly one property and it's duplicated in another class
      // that also has exactly one property (exact match)
      let isExactSinglePropertyMatch = false;
      
      if (propCount === 1 && duplicateProps.size === 1) {
        // Get the first (and only) property's duplicates
        const [, duplicateClasses] = Array.from(duplicateProps.entries())[0];
        
        // Check if any of the duplicate classes also have exactly one property
        const exactMatches = duplicateClasses.filter(cls => {
          const entries = utilityClassPropertiesMap.get(cls) || [];
          if (entries.length === 0) return false;
          
          // Check if this class has exactly one property
          const otherProps = entries[0].properties;
          return Object.keys(otherProps).length === 1;
        });
        
        isExactSinglePropertyMatch = exactMatches.length > 0;
      }
      
      results.push({
        ruleId: isExactSinglePropertyMatch ? 
          "lumos-utility-class-exact-duplicate" : 
          "lumos-utility-class-duplicate-properties",
        name: isExactSinglePropertyMatch ? 
          "Exact Duplicate Utility Class" : 
          "Duplicate Utility Class Properties",
        message: isExactSinglePropertyMatch ?
          `This utility class is an exact duplicate of another single-property class: ${dupPropMessages.join('; ')}. Consolidate these classes.` :
          `This utility class has duplicate properties: ${dupPropMessages.join('; ')}. Consider consolidating.`,
        severity: isExactSinglePropertyMatch ? "error" : "suggestion" as Severity,
        className: name,
        isCombo: false,
      })
      
      if (isExactSinglePropertyMatch) {
        console.log(`  Failed utility class exact duplicate rule: ${name} (duplicate properties: ${dupPropMessages.join('; ')})`)
      } else {
        console.log(`  Suggestion for utility class: ${name} (duplicate properties: ${dupPropMessages.join('; ')})`)
      }
    } else {
      console.log(`  Passed all utility class rules: ${name}`)
    }
  }
  continue
}

      // 5c. Custom classes
      if (!lumosCustomClassRule.test(name)) {
        results.push({
          ruleId: lumosCustomClassRule.id,
          name: lumosCustomClassRule.name,
          message: lumosCustomClassRule.description,
          severity: lumosCustomClassRule.severity as Severity,
          className: name,
          isCombo: false,
        })
        console.log(`  Failed custom class rule: ${name}`)
      } else {
        console.log(`  Passed custom class rule: ${name}`)
      }
    }
    
    console.log(`Lint completed with ${results.length} violations found`)
    
  } catch (err) {
    console.error('Error in runLint:', err)
  }

  return results
}


