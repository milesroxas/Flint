# Client-First Preset Rules

This document provides a comprehensive overview of all rules implemented in the Client-First preset, organized by category and type.

## Overview

The Client-First preset enforces kebab-case naming conventions and structural patterns for Webflow projects. It consists of **4 rules** across 3 categories:

- **1 Client-First-specific rule** (1 naming)
- **3 shared rules** (2 property, 1 structure)

## Rule Categories

### 1. Naming Rules (1 rule)

#### `cf:naming:class-format`

- **Name**: Client-First: Custom Class Format
- **Type**: Naming Rule
- **Severity**: Error
- **Target Classes**: Custom classes
- **Configurable**: ✅ (project-defined elements)

**Description**: Custom classes must use kebab-case format with lowercase letters, numbers, and hyphens only. The format should be descriptive and follow the pattern `feature-element` or `feature-variant-element`.

**Format Requirements**:

- Lowercase letters, numbers, and hyphens only
- No underscores or spaces
- Must be descriptive and meaningful
- Can include multiple segments separated by hyphens

**Examples**:

- ✅ `feature-card`, `hero-primary-content`, `nav-link-text`
- ❌ `featureCard`, `feature_card`, `Feature-Card`, `f`

**Configuration**:

```typescript
{
  projectDefinedElements: string[] // Custom element terms for this project
}
```

---

### 2. Shared Property Rules (2 rules)

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

### 3. Shared Structure Rules (1 rule)

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

| Rule ID                                 | Name                                   | Type      | Severity | Auto-fix | Configurable |
| --------------------------------------- | -------------------------------------- | --------- | -------- | -------- | ------------ |
| `cf:naming:class-format`                | Client-First: Custom Class Format      | Naming    | Error    | ❌       | ✅           |
| `shared:property:duplicate-of-utility`  | Avoid duplicate of existing utility    | Structure | Warning  | ❌       | ✅           |
| `shared:property:color-variable`        | Use Color Variables                    | Property  | Warning  | ❌       | ✅           |
| `shared:structure:missing-class-on-div` | Block elements must have style classes | Structure | Warning  | ❌       | ❌           |

## Client-First Class Naming Convention

The Client-First preset enforces a specific naming convention:

### Base Custom Classes

- Format: `feature-element` or `feature-variant-element`
- Must be lowercase with hyphens
- Should be descriptive and meaningful
- No underscores or spaces allowed

### Complete Example

```html
<!-- Correct Client-First class usage -->
<div class="hero-wrapper">
  <div class="hero-content-wrapper">
    <h1 class="hero-title">Title</h1>
    <p class="hero-description">Description</p>
  </div>
</div>
```

## Configuration

Several rules support configuration to adapt to project-specific requirements. Configurations are defined in the preset and can be customized per project.

See individual rule documentation above for specific configuration options.
