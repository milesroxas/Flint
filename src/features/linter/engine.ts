import { RuleResult } from "@/features/linter/types"
import { StyleService } from "./lib/style-service"
import { UtilityClassAnalyzer } from "./lib/utility-class-analyzer"
import { RuleRunner } from "./lib/rule-runner"
import { ruleRegistry, initializeRuleRegistry } from "./lib/registry"

// Initialize registry on first import
let registryInitialized = false

export async function runLint(element: any): Promise<RuleResult[]> {
  try {
    console.log('Starting lint process...')
    
    // Initialize registry once
    if (!registryInitialized) {
      initializeRuleRegistry()
      registryInitialized = true
    }
    
    // Initialize services
    const styleService = new StyleService()
    const utilityAnalyzer = new UtilityClassAnalyzer()
    const ruleRunner = new RuleRunner(ruleRegistry, utilityAnalyzer)
    
    // 1. Get all styles and build analysis maps
    const allStyles = await styleService.getAllStylesWithProperties()
    utilityAnalyzer.buildPropertyMaps(allStyles)
    
    // 2. Get styles applied to the element
    const appliedStyles = await styleService.getAppliedStyles(element)
    
    if (appliedStyles.length === 0) {
      console.log('No styles applied to the selected element, returning empty results')
      return []
    }

    // 3. Sort styles by type (combo classes last)
    const sortedStyles = styleService.sortStylesByType(appliedStyles)

    // 4. Run rules on all applied styles
    const results = ruleRunner.runRulesOnStyles(sortedStyles)
    
    console.log(`Lint completed with ${results.length} violations found`)
    return results
    
  } catch (err) {
    console.error('Error in runLint:', err)
    return []
  }
}

// Export registry for configuration UI
export { ruleRegistry, ruleConfigService } from "./lib/registry"