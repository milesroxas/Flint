# Shared Rules

This document provides a comprehensive overview of all shared rules that can be used across different presets, organized by category and type.

## Overview

Shared rules provide common functionality that can be reused across multiple presets. They consist of **4 rules** across 2 categories:

- **3 property rules** (duplicate-of-utility, color variables, utility-duplicate-property)
- **1 structure rule** (missing classes on divs)

## Rule Categories

### 1. Property Rules (3 rules)

#### `shared:property:duplicate-of-utility`

- **Name**: Avoid duplicate of existing utility
- **Type**: Structure Rule
- **Severity**: Warning
- **Target Classes**: Custom, Combo
- **Configurable**: ✅

**Description**: Detects custom or combo classes whose declarations are identical to, or a subset of, a utility class. Prefer using the utility class.

**Comparison Modes**:

- `equal`: Exact match of property sets
- `subset`: Custom class properties are subset of utility

**Configuration**:

```typescript
{
  compareMode: "equal" | "subset";     // default: "equal"
  propertyAllowlist?: string[];        // optional: only compare these properties
  propertyBlocklist?: string[];        // optional: exclude these properties
  ignoreCustomProperties: boolean;     // default: true (ignore CSS custom props)
  normalizeValues: boolean;            // default: true (normalize whitespace/zeros)
}
```

**Examples**:

- ❌ Custom class with same declarations as existing utility
- ❌ Custom class that's a subset of utility declarations

**Auto-fix**: ❌ (Manual replacement required)

---

#### `shared:property:color-variable`

- **Name**: Use Color Variables
- **Type**: Property Rule
- **Severity**: Warning
- **Target Classes**: Custom, Utility, Combo
- **Configurable**: ✅

**Description**: Color properties should use Webflow variables instead of hardcoded color values for better maintainability and design system consistency.

**Detected Color Formats**:

- HSL/HSLA: `hsla(0, 100%, 66%, 1)` → `#ff4444`
- RGB/RGBA: `rgba(255, 0, 0, 1)` → `#ff0000`
- Hex: `#ff0000`
- Named colors: `red`, `blue`, etc.

**Target Properties** (configurable):

- `background-color` (default)
- `color` (default)

**Configuration**:

```typescript
{
  targetProperties: string[];  // default: ["background-color", "color"]
}
```

**Examples**:

- ✅ Using Webflow color variable
- ❌ `color: hsla(0, 100%, 66%, 1)` → `#ff4444` (hardcoded color)
- ❌ `background-color: #ff0000` (hardcoded color)

**Auto-fix**: ❌ (Manual replacement with variable required)

---

#### `canonical:utility-duplicate-property`

- **Name**: Consolidate duplicate utility properties
- **Type**: Structure Rule
- **Severity**: Warning
- **Target Classes**: Utility
- **Configurable**: ✅

**Description**: Detects utility classes that declare the same CSS property/value as other utilities. Teams should consolidate aliases to avoid redundancy. Exported from shared property and used by both presets; rule ID is canonical.

**Auto-fix**: ❌ (Manual consolidation required)

---

### 2. Structure Rules (1 rule)

#### `shared:structure:missing-class-on-div`

- **Name**: Block elements must have style classes
- **Type**: Structure Rule
- **Severity**: Warning
- **Target Classes**: Custom, Utility, Combo

**Description**: All block elements should have at least one style class assigned. Unstyled blocks can indicate incomplete implementations or unnecessary elements.

**Checks**:

- Only applies to `Block` element types (Webflow's equivalent to divs)
- Flags elements with zero style classes

**Examples**:

- ✅ `<div class="hero-wrapper">` (has style class)
- ❌ `<div>` (no style classes)

**Auto-fix**: ❌ (Manual class addition or element removal required)

---

## Rule Summary

| Rule ID                                 | Name                                    | Type      | Severity | Auto-fix | Configurable |
| --------------------------------------- | --------------------------------------- | --------- | -------- | -------- | ------------ |
| `shared:property:duplicate-of-utility`  | Avoid duplicate of existing utility     | Structure | Warning  | ❌       | ✅           |
| `shared:property:color-variable`        | Use Color Variables                     | Property  | Warning  | ❌       | ✅           |
| `canonical:utility-duplicate-property`  | Consolidate duplicate utility properties | Structure | Warning  | ❌       | ✅           |
| `shared:structure:missing-class-on-div` | Block elements must have style classes  | Structure | Warning  | ❌       | ❌           |

## Usage Across Presets

These shared rules are designed to be included in multiple presets to provide consistent functionality:

- **Client-First Preset**: Includes all 3 shared rules
- **Lumos Preset**: Includes all 3 shared rules
- **Other Presets**: Can selectively include these rules as needed

## Configuration

Several rules support configuration to adapt to project-specific requirements. Configurations are defined in the preset and can be customized per project.

See individual rule documentation above for specific configuration options.
