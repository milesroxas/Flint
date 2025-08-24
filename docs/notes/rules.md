# Rules

## Categories

Rules are organized into the following categories:

### Shared

- **Canonical**
- **Structure**
- **Properties**
  - Missing color variable
  - No style on element
- **Performance**

### Presets

- **Structure**: Element graph and roles
- **Naming**: Lexical patterns and tokens for individual class names
- **Composition**: Rules about the class list on an element, including count, ordering, and the presence of a single base
- **Property**: Rules that inspect computed style declarations or utilities' property effects

### Lumos

#### Structure

Element graph and roles.

#### Naming

Lexical patterns and tokens for individual class names.

- **class-format**

  - **Purpose**: Custom classes must follow specific naming conventions
  - **Format**: Lowercase, underscore-separated with at least 2 segments
  - **Pattern**: `type_element` or `type_variant_element`
  - **Child groups**: May include additional group segments before final element
  - **Example**: `type[_variant]_[group]_wrap`
  - **Final segment**: Should describe the element (e.g., wrap, text, icon)
  - **Valid examples**:
    - `footer_wrap`
    - `footer_link_wrap`
    - `hero_secondary_content_wrap`
  - **Validation**: Ensures proper segments and recognized element terms

- **combo-class-format**
  - **Purpose**: Enforces proper combo class formatting
  - **Requirement**: Combos must be either variants (`is-`) or utilities (`u-`)
  - **Restriction**: Component bases (`c-*`) are not valid combos
  - **Variant format**: `is-[a-z0-9]+(?:-[a-z0-9]+)*`
  - **Utility format**: `u-[a-z0-9]+(?:-[a-z0-9]+)*`
  - **Benefit**: Prevents component classes as combos and ensures proper naming

#### Composition

Rules about class organization and relationships on elements.

- **variant-requires-base**

  - **Purpose**: Variant classes (`is-*`) must modify an existing base class
  - **Base class types**:
    - Component classes (prefixed with `c-`)
    - Custom base classes (not utility, not variant, classified as "custom")
    - Optionally combo/unknown classes if configured
  - **Prevents**: `<div class="is-active">` (invalid)
  - **Requires**: `<div class="c-card is-active">` (valid)
  - **Benefit**: Ensures variants always modify existing base components

- **class-order**

  - **Purpose**: Enforces proper class ordering within elements
  - **Order**: Base → Variants → Utilities
  - **Base classes**: Custom, component, combo
  - **Variant classes**: `is-*` patterns
  - **Utility classes**: `u-*` patterns
  - **Prevents**: Base classes appearing after variants or utilities
  - **Benefit**: Consistent and logical class organization

- **combo-limit**
  - **Purpose**: Limits classes applied after the base class
  - **Configurable options**:
    - Maximum combos allowed
    - Whether utilities count toward limit
    - Variant prefixes to exclude from base detection
    - Whether to assume first token as base
  - **Default**: 2 classes after base, utilities count toward limit

#### Property

Rules that inspect computed style declarations or utilities' property effects.

- **utility-class-exact-duplicate**

  - **Purpose**: Identifies utility classes with identical property sets
  - **Benefit**: Eliminates redundant CSS and maintains clean stylesheets
  - **Scope**: Classes with exact duplicate properties

- **utility-class-duplicate-properties**
  - **Purpose**: Identifies utility classes with overlapping properties
  - **Benefit**: Consolidation opportunities and reduced CSS bloat
  - **Scope**: Classes with shared properties
