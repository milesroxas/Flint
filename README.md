# Designer Extension: Audit Tool

A comprehensive linting system for Webflow Designer that helps maintain consistent class naming conventions and identifies potential issues with your CSS classes. This extension analyzes your Webflow elements in real-time and provides actionable feedback to improve your design system.

## Features

- **Element Linting** - Automatically lints selected elements as you work
- **Page Linting** - Analyze all elements on the current page with a single click
- **Class Type Detection** - Intelligently categorizes classes as custom, utility, or combo classes
- **Duplicate Detection** - Identifies utility classes with overlapping or identical properties
- **Configurable Rules** - Enable/disable rules and adjust severity levels
- **Extensible Architecture** - Easy to add custom rules for your specific needs

## Local Development

```bash
npm run dev
```

This command installs dependencies, starts the Vite development server, and serves your extension files. Use the displayed URL as the "Development URL" in Webflow Designer's Apps panel to launch your extension.

## Build for Distribution

```bash
npm run build
```

This command builds your React application with Vite, copies the build files to the public directory, and prepares a bundle.zip file for distribution. Upload this bundle.zip file for distributing the App inside of your workspace or via the Marketplace.

## Linter Architecture

### Core Components

#### Linting Services

- **ElementLintService** - Lints individual elements when selected in the Designer
- **PageLintService** - Lints all elements on the current page at once
- **StyleService** - Handles interaction with Webflow's style API
- **RuleRunner** - Executes rules against styles
- **UtilityClassAnalyzer** - Specialized analysis for utility classes

#### React Hooks

- **useElementLint** - Subscribes to element selection events and provides real-time linting
- **usePageLint** - Provides functionality to lint the entire page on demand

#### UI Components

- **LintPanel** - Displays linting results for selected elements
- **LintPageButton** - Button component to trigger page-wide linting
- **ViolationsList** - Displays rule violations in a structured format

### Supported Class Types

#### Custom Classes

**Format:** `type[_variation][_element]`

- Use underscores only
- Lowercase alphanumeric characters
- Maximum 3 underscores
- Examples: `hero_primary`, `hero_primary_button`

#### Utility Classes

**Format:** `u-[property-description]`

- Must start with `u-`
- Use dashes only (no underscores)
- Examples: `u-margin-top-lg`, `u-text-center`

#### Combo Classes

**Format:** `is-[state-description]`

- Must start with `is-`
- Use dashes only (no underscores)
- Examples: `is-active`, `is-hidden`

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

## How It Works

### Element Linting

The element linting feature automatically analyzes elements as they're selected in the Webflow Designer:

1. When an element is selected, the `useElementLint` hook triggers the linting process
2. The `ElementLintService` fetches all styles from the site for context
3. It then retrieves the styles applied to the selected element
4. The `RuleRunner` validates these styles against all enabled rules
5. Results are displayed in the `LintPanel` component

### Page Linting

The page linting feature allows you to analyze all elements on the current page at once:

1. When the "Lint Current Page" button is clicked, the `usePageLint` hook is triggered
2. The `PageLintService` fetches all elements on the current page using `window.webflow.getAllElements()`
3. It then retrieves all styles from the site for context using `window.webflow.getAllStyles()`
4. For each element, it fetches the applied styles using `element.getStyles()`
5. The `RuleRunner` validates all styles against enabled rules
6. Results are displayed in the `LintPageButton` component

## Error Handling

The linter includes robust error handling:

- Gracefully handles missing or invalid Webflow API methods
- Provides fallbacks when elements don't have styles
- Captures and logs errors without crashing the extension
- Shows user-friendly error messages

## Technology Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Radix UI Components

## Extending the Linter

### Adding Custom Rules

See the detailed documentation in `src/features/linter/README.md` for information on creating custom rules and extending the linter's functionality.

## Contributing

Explore the [Webflow Designer API documentation](https://developers.webflow.com/designer/reference/introduction) for detailed information on Designer Extension features and API.
