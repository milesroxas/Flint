# Client-First Preset Rules

This document provides a comprehensive overview of all rules implemented in the Client-First preset, organized by category and type.

## Overview

The Client-First preset enforces kebab-case naming conventions, structural patterns, and composition rules for Webflow projects. It consists of **15 rules** across 6 categories:

- **5 Client-First naming rules**
- **2 Client-First composition rules**
- **2 structure rules** (1 Client-First, 1 canonical)
- **2 Client-First property rules**
- **3 shared property rules**
- **1 shared structure rule**

## Rule Categories

### 1. Naming Rules (5 rules)

#### `cf:naming:class-format`

- **Name**: Client-First: Custom Class Format
- **Type**: Naming Rule
- **Severity**: Error (format); Suggestion (unrecognized element)
- **Target Classes**: Custom
- **Configurable**: ✅ (project-defined elements)

**Description**: Custom classes must use lowercase letters, numbers, hyphens, and underscores only. Client-First uses underscores for folder convention (`folder_element`). The format should be descriptive (e.g. `feature-element` or `section_identifier`).

**Format Requirements**:

- Lowercase letters, numbers, hyphens, and underscores only
- No spaces or uppercase
- Hyphens separate words within a segment; underscores separate folder from element

**Examples**:

- ✅ `section_about`, `hero_content-wrapper`, `feature-card_title`
- ❌ `featureCard`, `Feature-Card`, `f`, spaces

**Configuration**:

```typescript
{
  projectDefinedElements: string[] // Custom element terms for this project
}
```

---

#### `cf:naming:utility-no-underscore`

- **Name**: Client-First: Utility classes use dashes only
- **Type**: Naming Rule
- **Severity**: Error
- **Target Classes**: Utility

**Description**: Utility classes must use dashes (-) as separators. Underscores are reserved for custom class folder convention (`folder_element`).

**Examples**:

- ✅ `text-size-large`, `padding-global`
- ❌ `text_size_large` (use dashes instead)

**Auto-fix**: ✅ (rename-class)

---

#### `cf:naming:combo-is-prefix`

- **Name**: Client-First: Combo class format
- **Type**: Naming Rule
- **Severity**: Error
- **Target Classes**: Combo

**Description**: Combo classes must use the `is-` prefix followed by a lowercase descriptor with dashes (e.g. `is-brand`, `is-active`).

**Examples**:

- ✅ `is-brand`, `is-home`, `is-active`
- ❌ `is-`, `is-Brand`, `is_active`

**Auto-fix**: ✅ (rename-class when applicable)

---

#### `cf:naming:section-format`

- **Name**: Client-First: Section naming format
- **Type**: Naming Rule
- **Severity**: Warning
- **Target Classes**: Utility (classes that look like `section-*`)

**Description**: Sections should use the underscore folder convention: `section_[identifier]`. Avoid `section-[identifier]` which loses the folder grouping.

**Examples**:

- ✅ `section_about`, `section_testimonials`
- ❌ `section-about` (use `section_about`)

**Auto-fix**: ✅ (rename-class)

---

#### `cf:naming:no-abbreviations`

- **Name**: Client-First: Avoid abbreviations
- **Type**: Naming Rule
- **Severity**: Suggestion
- **Target Classes**: Custom, Utility

**Description**: Class names should be meaningful and complete. Avoid abbreviations that reduce clarity (e.g. `btn` → `button`, `img` → `image`). Some short tokens are allowed (e.g. `nav`, `faq`, `cta`).

**Auto-fix**: ❌

---

### 2. Composition Rules (2 rules)

#### `cf:composition:combo-not-alone`

- **Name**: Client-First: Combo class requires a base
- **Type**: Composition Rule
- **Severity**: Error

**Description**: Combo classes (`is-*`) are variant modifiers and must be applied alongside a base class (custom or utility). They must not stand alone on an element.

**Examples**:

- ✅ `button is-brand`, `header_content is-home`
- ❌ `is-active` only (no base class)

**Auto-fix**: ❌

---

#### `cf:composition:padding-section-requires-global`

- **Name**: Client-First: padding-section requires padding-global
- **Type**: Composition Rule
- **Severity**: Warning

**Description**: The `padding-section-[size]` utility should be used on the same element as `padding-global` to reduce nesting.

**Examples**:

- ✅ `padding-global padding-section-medium`
- ❌ `padding-section-medium` without `padding-global`

**Auto-fix**: ✅ (add-class: padding-global)

---

### 3. Structure Rules (2 rules)

#### `cf:structure:nav-outside-main`

- **Name**: Client-First: Nav outside main-wrapper
- **Type**: Structure Rule
- **Severity**: Warning

**Description**: Navigation elements (by `<nav>` tag or nav-related class) should be placed outside of main-wrapper, since nav content is not page-specific.

**Auto-fix**: ❌

---

#### `canonical:section-parent-is-main`

- **Name**: Section must be a direct child of main
- **Type**: Structure Rule
- **Severity**: Error

**Description**: Any element with role "section" must be a direct child of an element with role "main".

**Auto-fix**: ❌

---

### 4. Client-First Property Rules (2 rules)

#### `cf:property:padding-global-horizontal-only`

- **Name**: Client-First: padding-global horizontal only
- **Type**: Property Rule
- **Severity**: Warning
- **Target Classes**: Utility

**Description**: The `padding-global` class should only contain horizontal padding (left/right). Vertical padding should use `padding-section-[size]` classes.

**Auto-fix**: ❌

---

#### `cf:property:prefer-rem`

- **Name**: Client-First: Prefer rem units
- **Type**: Property Rule
- **Severity**: Suggestion
- **Target Classes**: Custom, Utility, Combo

**Description**: Client-First recommends rem units for sizing properties (typography, spacing, widths, etc.). Rem enables accessible, fluid responsive design. Values ≤1px are not flagged.

**Auto-fix**: ❌

---

### 5. Shared Property Rules (3 rules)

#### `shared:property:duplicate-of-utility`

- **Name**: Avoid duplicate of existing utility
- **Type**: Structure Rule
- **Severity**: Warning
- **Target Classes**: Custom, Combo
- **Configurable**: ✅

**Description**: Detects custom or combo classes whose declarations are identical to, or a subset of, a utility class. Prefer using the utility class.

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

**Auto-fix**: ❌

---

#### `shared:property:color-variable`

- **Name**: Use Color Variables
- **Type**: Property Rule
- **Severity**: Error
- **Target Classes**: Custom, Utility, Combo
- **Configurable**: ✅

**Description**: Color properties should use Webflow variables instead of hardcoded color values for better maintainability and design system consistency.

**Target Properties** (configurable): `background-color`, `color` (default)

**Configuration**:

```typescript
{
  targetProperties: string[];  // default: ["background-color", "color"]
}
```

**Auto-fix**: ❌

---

#### `canonical:utility-duplicate-property`

- **Name**: Consolidate duplicate utility properties
- **Type**: Structure Rule
- **Severity**: Warning
- **Target Classes**: Utility
- **Configurable**: ✅

**Description**: Detects utility classes that declare the same CSS property/value as other utilities. Teams should consolidate aliases to avoid redundancy.

**Auto-fix**: ❌

---

### 6. Shared Structure Rules (1 rule)

#### `shared:structure:missing-class-on-div`

- **Name**: Block elements must have style classes
- **Type**: Structure Rule
- **Severity**: Warning
- **Target Classes**: Custom, Utility, Combo

**Description**: All block elements (Webflow Block type) should have at least one style class assigned. Unstyled blocks can indicate incomplete implementations or unnecessary elements.

**Examples**:

- ✅ `<div class="hero-wrapper">` (has style class)
- ❌ Block with no classes

**Auto-fix**: ❌
**Configurable**: ❌

---

## Rule Summary

| Rule ID                                       | Name                                           | Type       | Severity  | Auto-fix | Configurable |
| --------------------------------------------- | ---------------------------------------------- | ---------- | --------- | -------- | ------------ |
| `cf:naming:class-format`                      | Client-First: Custom Class Format              | Naming     | Error     | ❌       | ✅           |
| `cf:naming:utility-no-underscore`             | Client-First: Utility classes use dashes only  | Naming     | Error     | ✅       | ❌           |
| `cf:naming:combo-is-prefix`                   | Client-First: Combo class format               | Naming     | Error     | ✅       | ❌           |
| `cf:naming:section-format`                    | Client-First: Section naming format             | Naming     | Warning   | ✅       | ❌           |
| `cf:naming:no-abbreviations`                  | Client-First: Avoid abbreviations              | Naming     | Suggestion| ❌       | ❌           |
| `cf:composition:combo-not-alone`             | Client-First: Combo class requires a base       | Composition| Error     | ❌       | ❌           |
| `cf:composition:padding-section-requires-global` | Client-First: padding-section requires padding-global | Composition | Warning | ✅       | ❌           |
| `cf:structure:nav-outside-main`               | Client-First: Nav outside main-wrapper          | Structure  | Warning   | ❌       | ❌           |
| `canonical:section-parent-is-main`            | Section must be a direct child of main         | Structure  | Error     | ❌       | ❌           |
| `cf:property:padding-global-horizontal-only`  | Client-First: padding-global horizontal only   | Property   | Warning   | ❌       | ❌           |
| `cf:property:prefer-rem`                     | Client-First: Prefer rem units                  | Property   | Suggestion| ❌       | ❌           |
| `shared:property:duplicate-of-utility`        | Avoid duplicate of existing utility            | Structure  | Warning   | ❌       | ✅           |
| `shared:property:color-variable`              | Use Color Variables                            | Property   | Error     | ❌       | ✅           |
| `canonical:utility-duplicate-property`        | Consolidate duplicate utility properties       | Structure  | Warning   | ❌       | ✅           |
| `shared:structure:missing-class-on-div`      | Block elements must have style classes         | Structure  | Warning   | ❌       | ❌           |

## Client-First Class Naming Convention

The Client-First preset enforces:

### Custom classes

- Format: `folder_element` or `folder_element-variant` (underscore for folder convention; hyphens within segments).
- Lowercase letters, numbers, hyphens, and underscores only.
- Descriptive and meaningful; no abbreviations (per rule).
- Project-defined element terms can be added via `cf:naming:class-format` config.

### Utility classes

- Dashes only (no underscores): e.g. `padding-global`, `text-size-large`.

### Combo classes

- Prefix `is-` followed by lowercase descriptor with dashes: e.g. `is-brand`, `is-active`.
- Must be used with a base class on the same element.

### Section names

- Use folder convention: `section_about`, `section_testimonials` (not `section-about`).

### Example

```html
<!-- Correct Client-First class usage -->
<div class="hero-wrapper">
  <div class="hero_content-wrapper padding-global padding-section-medium">
    <h1 class="hero_title">Title</h1>
    <p class="hero_description">Description</p>
  </div>
</div>
```

## Configuration

Several rules support configuration. Configurations are defined in the preset and can be customized per project.

- **cf:naming:class-format**: `projectDefinedElements` (string[])
- **shared:property:duplicate-of-utility**: `compareMode`, `propertyAllowlist`, `propertyBlocklist`, `ignoreCustomProperties`, `normalizeValues`
- **shared:property:color-variable**: `targetProperties`
- **canonical:utility-duplicate-property**: optional custom settings (e.g. `ignoredAliases`, `minClassCount`, `propertyAllowlist`, `propertyBlocklist`)

See individual rule sections above for details.
