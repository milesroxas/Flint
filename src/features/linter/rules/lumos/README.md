# Lumos Preset Rules

This document provides a comprehensive overview of all rules implemented in the Lumos preset, organized by category and type.

## Overview

The Lumos preset enforces a custom class naming convention and structural patterns for Webflow projects. It consists of **8 rules** across 4 categories:

- **5 Lumos-specific rules** (2 naming, 3 composition)
- **3 shared rules** (2 property, 1 structure)

## Rule Categories

### 1. Naming Rules (2 rules)

#### `lumos:naming:class-format`

- **Name**: Lumos Custom Class Format
- **Type**: Naming Rule
- **Severity**: Error
- **Target Classes**: Custom classes
- **Configurable**: ✅ (project-defined elements)

**Description**: Custom classes must be lowercase and underscore-separated with at least 2 segments: `type_element` or `type_variant_element`. Child group roots may include additional group segments before the final element (e.g., `type[_variant]_[group]_wrap`). The final segment should describe the element.

**Format Requirements**:

- Lowercase letters, numbers, and underscores only
- Minimum 2 segments separated by underscores
- No empty segments
- Final segment should be a recognized element term

**Known Element Terms**:

- Layout: `wrap`, `main`, `contain`, `container`, `layout`, `inner`, `content`, `section`
- Content: `text`, `title`, `heading`, `eyebrow`, `label`, `marker`
- Media: `icon`, `img`, `image`
- Interactive: `button`, `link`, `field`
- Structure: `group`, `item`, `list`, `card`
- Testing: `x`, `y`, `z`

**Examples**:

- ✅ `footer_wrap`, `hero_secondary_content_wrap`, `nav_link_text`
- ❌ `footerWrap`, `footer-wrap`, `footer_`, `f`

**Configuration**:

```typescript
{
  projectDefinedElements: string[] // Custom element terms for this project
}
```

**Auto-fix**: ❌ (Provides suggestions for manual fixes)

---

#### `lumos:naming:combo-class-format`

- **Name**: Combo class format
- **Type**: Naming Rule
- **Severity**: Error
- **Target Classes**: Combo classes, Utility classes

**Description**: After the base custom class, combos must be either a variant (`is-`) or a utility (`u-`). Component bases (`c-*`) are not valid combos.

**Format Requirements**:

- Variants: `is-[a-z0-9]+(?:-[a-z0-9]+)*`
- Utilities: `u-[a-z0-9]+(?:-[a-z0-9]+)*`
- No component classes (`c-*`) as combos

**Examples**:

- ✅ `base_custom is-active u-hidden`
- ✅ `hero_wrap is-large u-margin-top`
- ❌ `base_custom c-button` (component as combo)
- ❌ `base_custom IsActive` (invalid variant format)

**Auto-fix**: ✅ Normalizes invalid format to correct variant/utility syntax

---

### 2. Composition Rules (3 rules)

#### `lumos:composition:class-order`

- **Name**: Base class must precede variants and utilities
- **Type**: Structure Rule
- **Severity**: Error

**Description**: Within an element, base classes (custom/component/combo) must come before variant classes (`is-*`) and utility classes (`u-*`).

**Required Order**:

1. Base classes (custom, component, combo)
2. Variant classes (`is-*`)
3. Utility classes (`u-*`)

**Examples**:

- ✅ `base_custom is-active u-hidden`
- ✅ `c-card is-large u-margin-bottom`
- ❌ `is-active base_custom u-hidden`
- ❌ `u-hidden base_custom is-active`

**Auto-fix**: ✅ Reorders classes to match canonical order

---

#### `lumos:composition:variant-requires-base`

- **Name**: Variant requires a base class
- **Type**: Composition Rule
- **Severity**: Error
- **Configurable**: ✅

**Description**: Variant classes (`is-*`) must modify an existing base class. Ensure a Lumos base custom or a component (`c-*`) is present on the element.

**Base Class Types** (accepted):

- Custom classes (type: `custom`)
- Component classes (prefixed with `c-`)
- Optionally combo classes (if configured)
- Optionally unknown classes (if configured)

**Examples**:

- ✅ `c-card is-active`
- ✅ `hero_wrap is-large`
- ❌ `is-active` (no base class)
- ❌ `u-hidden is-active` (utility doesn't count as base)

**Configuration**:

```typescript
{
  variantPrefixes: string[];      // default: ["is_", "is-"]
  componentPrefixes: string[];    // default: ["c-"]
  allowComboAsBase: boolean;      // default: false
  allowUnknownAsBase: boolean;    // default: false
}
```

**Auto-fix**: ❌ (Cannot safely guess the correct base to add)

---

#### `lumos:composition:combo-limit`

- **Name**: Limit classes after base
- **Type**: Composition Rule
- **Severity**: Error
- **Configurable**: ✅

**Description**: Limit the number of classes applied after the base class on an element.

**Default Limits**:

- Maximum 2 classes after base
- Utilities count toward the limit
- Variants count toward the limit

**Examples**:

- ✅ `base_custom is-large is-active` (2 classes after base)
- ✅ `base_custom is-active u-hidden` (2 classes after base)
- ❌ `base_custom is-large is-active u-hidden` (3 classes after base, exceeds limit)

**Configuration**:

```typescript
{
  maxCombos: number;              // default: 2
  countUtilities: boolean;        // default: true
  variantPrefixes: string[];      // default: ["is_", "is-"]
  assumeFirstAsBase: boolean;     // default: true
}
```

**Auto-fix**: ❌ (Reports excess classes for manual removal)

---

### 3. Shared Property Rules (2 rules)

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

### 4. Shared Structure Rules (1 rule)

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

- ✅ `<div class="hero_wrap">` (has style class)
- ❌ `<div>` (no style classes)

**Auto-fix**: ❌ (Manual class addition or element removal required)

---

## Rule Summary

| Rule ID                                   | Name                                           | Type        | Severity | Auto-fix | Configurable |
| ----------------------------------------- | ---------------------------------------------- | ----------- | -------- | -------- | ------------ |
| `lumos:naming:class-format`               | Lumos Custom Class Format                      | Naming      | Error    | ❌       | ✅           |
| `lumos:naming:combo-class-format`         | Combo class format                             | Naming      | Error    | ✅       | ❌           |
| `lumos:composition:class-order`           | Base class must precede variants and utilities | Structure   | Error    | ✅       | ❌           |
| `lumos:composition:variant-requires-base` | Variant requires a base class                  | Composition | Error    | ❌       | ✅           |
| `lumos:composition:combo-limit`           | Limit classes after base                       | Composition | Error    | ❌       | ✅           |
| `shared:property:duplicate-of-utility`    | Avoid duplicate of existing utility            | Structure   | Warning  | ❌       | ✅           |
| `shared:property:color-variable`          | Use Color Variables                            | Property    | Warning  | ❌       | ✅           |
| `shared:structure:missing-class-on-div`   | Block elements must have style classes         | Structure   | Warning  | ❌       | ❌           |

## Lumos Class Naming Convention

The Lumos preset enforces a specific naming convention:

### Base Custom Classes

- Format: `type_element` or `type_variant_element`
- Child groups: `type[_variant]_[group]_wrap`
- Must be lowercase with underscores
- Final segment describes the element

### Variants

- Format: `is-descriptor`
- Modifies existing base classes
- Requires base class to be present
- Must come after base, before utilities

### Utilities

- Format: `u-property-value`
- Provides specific styling
- Can be used as combos
- Must come last in class order

### Complete Example

```html
<!-- Correct Lumos class usage -->
<div class="hero_wrap is-large u-margin-bottom">
  <div class="hero_content_wrap">
    <h1 class="hero_title is-primary">Title</h1>
    <p class="hero_text u-color-secondary">Description</p>
  </div>
</div>
```

## Configuration

Several rules support configuration to adapt to project-specific requirements. Configurations are defined in the preset and can be customized per project.

See individual rule documentation above for specific configuration options.
