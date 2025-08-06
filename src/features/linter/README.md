# Webflow Designer Extension Linter

A comprehensive linting system for Webflow Designer that helps maintain consistent class naming conventions and identifies potential issues with your CSS classes. This extension analyzes your Webflow elements in real-time and provides actionable feedback to improve your design system.

## Features

- **Real-time Analysis** - Automatically lints selected elements as you work
- **Class Type Detection** - Intelligently categorizes classes as custom, utility, or combo classes
- **Duplicate Detection** - Identifies utility classes with overlapping or identical properties
- **Configurable Rules** - Enable/disable rules and adjust severity levels
- **Extensible Architecture** - Easy to add custom rules for your specific needs

## Supported Class Types

### Custom Classes

**Format:** `type[_variation][_element]`

- Use underscores only
- Lowercase alphanumeric characters
- Maximum 3 underscores
- **Note:** Custom classes must have 2 or 3 segments (e.g., `type_element` or `type_variant_element`). Single-segment classes like `hero` are **not** valid per the current linter rules.
- Examples: `hero_primary`, `hero_primary_button`

### Utility Classes

**Format:** `u-[property-description]`

- Must start with `u-`
- Use dashes only (no underscores)
- Should be stacked on custom classes (convention only; not enforced by the linter)
- Examples: `u-margin-top-lg`, `u-text-center`, `u-display-none`

### Combo Classes

**Format:** `is-[state-description]`

- Must start with `is-`
- Use dashes only (no underscores)
- Modify existing component classes (convention only; not enforced by the linter)
- Examples: `is-active`, `is-hidden`, `is-loading`

## Architecture

### Core Components

#### Rule Registry (`features/linter/lib/rule-registry.ts`)

Manages rule registration and configuration:

- Registers default and custom rules, seeding default config from each rule's schema
- Handles user configuration overrides, merging nested custom settings
- Provides rule filtering by type and category
- Supports import/export of rule configurations, merging with defaults and validating schemas

#### Rule Runner (`features/linter/lib/rule-runner.ts`)

Executes rules against styles:

- Runs naming rules for format validation and property rules for semantic analysis
- Handles utility class duplicate detection with detailed messages and metadata
- Uses effective severity and enabled state from the registry/config

#### Utility Class Analyzer (`features/linter/lib/utility-class-analyzer.ts`)

Specialized analysis for utility classes:

- Builds property maps for duplicate detection, accessible via getters
- Identifies exact duplicates vs partial overlaps, providing formatted property info for UI
- Logs duplicate properties for debugging

#### Rule Configuration Service (`features/linter/lib/rule-configuration-service.ts`)

Handles persistence and loading of rule configurations:

- Saves and loads configs from localStorage (or other adapters)
- Merges user configs with defaults, validates against rule schemas
- Supports import/export for sharing configurations

#### Registry Initialization (`features/linter/lib/registry.ts`)

- Exports a global `ruleRegistry` and `ruleConfigService`
- `initializeRuleRegistry()` registers built-in rules and applies user configs at startup
- `addCustomRule()` allows dynamic rule registration

## Default Rules

### Format Rules

| Rule ID                      | Name                 | Severity | Description                               |
| ---------------------------- | -------------------- | -------- | ----------------------------------------- |
| `lumos-custom-class-format`  | Custom Class Format  | Error    | Validates custom class naming convention  |
| `lumos-utility-class-format` | Utility Class Format | Error    | Validates utility class naming convention |
| `lumos-combo-class-format`   | Combo Class Format   | Error    | Validates combo class naming convention   |

### Semantic Rules

| Rule ID                                    | Name                               | Severity   | Description                       |
| ------------------------------------------ | ---------------------------------- | ---------- | --------------------------------- |
| `lumos-utility-class-exact-duplicate`      | Exact Duplicate Utility Class      | Error      | Flags identical utility classes   |
| `lumos-utility-class-duplicate-properties` | Duplicate Utility Class Properties | Suggestion | Identifies overlapping properties |

## Usage

### Basic Integration

1. **Import the linter in your component:**

```typescript
import { runLint } from "@/features/linter/engine";
import { RuleResult } from "@/features/linter/types";
```

2. **Run linting on element selection:**

```typescript
const results = await runLint(selectedElement);
setViolations(results);
```

3. **Display results:**

```typescript
{
  violations.map((violation) => (
    <div key={violation.ruleId}>
      <span className={severityClass[violation.severity]}>
        {violation.name}
      </span>
      <p>{violation.message}</p>
    </div>
  ));
}
```

### Advanced Configuration

#### Configure Rules Programmatically

```typescript
import { ruleRegistry } from "@/features/linter/rules/registry";

// Disable a rule
ruleRegistry.updateRuleConfiguration("lumos-custom-class-format", {
  enabled: false,
});

// Change severity
ruleRegistry.updateRuleConfiguration(
  "lumos-utility-class-duplicate-properties",
  {
    severity: "error",
  }
);
```

#### Export/Import Configuration

```typescript
// Export all rule configurations as JSON
const configJson = ruleRegistry.exportConfiguration();

// Import and merge configurations from JSON
ruleRegistry.importConfiguration(configJson);
```

## Extending the Linter

### Adding Custom Rules

#### Naming Rules

For simple format validation:

```typescript
import { addCustomRule } from "@/features/linter/rules/registry";

const customNamingRule: Rule = {
  id: "my-custom-naming-rule",
  name: "Custom Naming Rule",
  description: "Description of what this rule checks",
  type: "naming",
  test: (className) => {
    // Return true if className passes, false if it violates the rule
    return /^my-pattern$/.test(className);
  },
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"], // or ["utility", "combo"]
};

addCustomRule(customNamingRule);
```

#### Property Rules

For analyzing CSS properties:

```typescript
const customPropertyRule: Rule = {
  id: "my-property-rule",
  name: "Custom Property Rule",
  description: "Analyzes CSS properties for issues",
  type: "property",
  analyze: (className, properties, context) => {
    const violations: RuleViolation[] = [];

    // Your analysis logic here
    if (properties.color === "#ff0000") {
      violations.push({
        ruleId: "my-property-rule",
        name: "Avoid Pure Red",
        message: "Pure red (#ff0000) may cause accessibility issues",
        severity: "warning",
        className,
        isCombo: className.startsWith("is-"),
      });
    }

    return violations;
  },
  severity: "warning",
  enabled: true,
  category: "accessibility",
  targetClassTypes: ["custom", "utility"],
};

addCustomRule(customPropertyRule);
```

### Rule Categories

Organize rules by category for better management:

- **`format`** - Naming conventions and structure
- **`semantics`** - Meaning and purpose of classes
- **`performance`** - Impact on loading and rendering
- **`accessibility`** - WCAG compliance and usability
- **`custom`** - Project-specific requirements

### Advanced Rule Context

Property rules receive a `RuleContext` object with access to:

```typescript
interface RuleContext {
  allStyles: StyleInfo[]; // All site styles
  utilityClassPropertiesMap: Map<string, StyleEntry[]>; // Utility class properties
  propertyToClassesMap: Map<string, Set<string>>; // Property-to-classes mapping
}
```

## API Reference

### Core Types

```typescript
export interface RuleResult {
  ruleId: string;
  name: string;
  message: string;
  severity: Severity;
  className: string;
  isCombo: boolean;
  comboIndex?: number;
  example?: string;
  metadata?: Record<string, any>;
}

export type Severity = "error" | "warning" | "suggestion";
export type ClassType = "custom" | "utility" | "combo";
export type RuleCategory =
  | "format"
  | "semantics"
  | "performance"
  | "accessibility"
  | "custom";
export type RuleType = "naming" | "property";

export interface RuleConfigField {
  label: string;
  type: "string" | "string[]" | "number" | "boolean" | "enum";
  description?: string;
  default: unknown;
  options?: string[];
}

export type RuleConfigSchema = Record<string, RuleConfigField>;

export interface RuleContext {
  allStyles: StyleInfo[];
  utilityClassPropertiesMap: Map<string, { name: string; properties: any }[]>;
  propertyToClassesMap: Map<string, Set<string>>;
}
```

### Main Functions

- `runLint(element: any): Promise<RuleResult[]>` — Runs all enabled rules against the selected element's styles.
- `ruleRegistry.updateRuleConfiguration(ruleId: string, config: Partial<RuleConfiguration>): void` — Updates configuration for a specific rule, merging custom settings.
- `addCustomRule(rule: Rule): void` — Registers a new custom rule.
- `ruleRegistry.exportConfiguration(): string` — Exports all rule configurations as JSON.
- `ruleRegistry.importConfiguration(json: string): void` — Imports and merges rule configurations from JSON.

## Performance Considerations

- **Lazy Loading** - Rule registry initializes only when first needed
- **Efficient Caching** - Property maps are built once per lint run
- **Minimal API Calls** - Batches style property requests
- **Smart Filtering** - Only processes enabled rules

## Development

### File Structure

```
features/linter/
├── engine.ts                     # Main linting orchestrator
├── types/
│   └── rule-types.ts             # Type definitions (updated for config schemas, context, etc.)
├── lib/
│   ├── style-service.ts          # Webflow API interactions
│   ├── rule-registry.ts          # Rule management (now with config merging)
│   ├── rule-runner.ts            # Rule execution (now with richer context)
│   ├── utility-class-analyzer.ts # Utility class analysis (now with formatted property info)
│   ├── rule-configuration-service.ts # Configuration persistence (now with schema validation)
│   └── registry.ts               # Global registry, config service, and initialization
├── rules/
│   ├── default-rules.ts          # Built-in rules (now with config schemas)
└── components/
    └── LintPanel.tsx             # UI component
```

### Adding New Rule Categories

1. Update the `RuleCategory` type in `rule-types.ts`
2. Create rules with the new category
3. Update UI components to handle the new category

### Testing Rules

```typescript
import { RuleRunner } from "@/features/linter/lib/rule-runner";
import { RuleRegistry } from "@/features/linter/lib/rule-registry";

const registry = new RuleRegistry();
registry.registerRule(myCustomRule);

const runner = new RuleRunner(registry, utilityAnalyzer);
const results = runner.runRulesOnStyles([mockStyleInfo]);
```

## Error Handling

The linter gracefully handles:

- **API Failures** - Continues processing other styles if one fails
- **Invalid Styles** - Skips styles without valid names or properties
- **Rule Errors** - Logs rule execution errors without stopping the process
- **Configuration Issues** - Falls back to default settings for invalid configurations

## Contributing

### Adding Built-in Rules

1. Define your rule in `features/linter/rules/default-rules.ts`
2. Add appropriate types to `rule-types.ts` if needed
3. Test with various Webflow elements
4. Update this README

### Rule Best Practices

- **Clear IDs** - Use descriptive, kebab-case rule IDs
- **Helpful Messages** - Provide actionable feedback to users
- **Appropriate Severity** - Use `error` for critical issues, `warning` for problems, `suggestion` for improvements
- **Targeted Scope** - Only target relevant class types
- **Performance** - Avoid expensive operations in rule logic
