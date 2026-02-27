# Canonical Rules

This document provides a comprehensive overview of all canonical rules that enforce structural and semantic patterns across presets, organized by category and type.

## Overview

Canonical rules provide fundamental structural validation that applies regardless of the naming convention or preset being used. **Two** of these rules are registered in the rule registry at runtime; one is implemented but not currently registered.

- **Registered**: `canonical:main-children`, `canonical:childgroup-key-match`
- **Implemented but not registered**: `canonical:section-parent-is-main`

## Rule Categories

### 1. Structure Rules (3 rules)

#### `canonical:main-children`

- **Name**: Main should contain sections or component roots
- **Type**: Page Rule
- **Severity**: Error
- **Target Classes**: All
- **Configurable**: ❌

**Description**: Ensures main element contains semantic content like sections or component roots as direct or descendant children.

**Required Content**:

- Main element must contain at least one semantic element
- Valid semantic elements: `section`, `componentRoot`
- Content can be direct children or descendants

**Search Strategy**:

- Uses Breadth-First Search (BFS) to find semantic content
- Searches through all descendants of main element
- Stops when first semantic content is found

**Examples**:

- ✅ Main contains `<section>` element
- ✅ Main contains component root element
- ❌ Main contains only unstyled divs
- ❌ Main has no semantic content

**Auto-fix**: ❌ (Manual content restructuring required)

---

#### `canonical:section-parent-is-main`

- **Name**: Section must be a direct child of main
- **Type**: Structure Rule
- **Severity**: Error
- **Target Classes**: Custom, Combo, Utility
- **Configurable**: ❌
- **Status**: Implemented but **not currently registered** in the rule registry (see `registry.ts`).

**Description**: Enforces that any element with role 'section' is a direct child of a 'main' element.

**Structural Requirements**:

- Section elements must have main as direct parent
- No intermediate elements between section and main
- Applies to all elements with role 'section'

**Examples**:

- ✅ `<main><section>...</section></main>`
- ❌ `<main><div><section>...</section></div></main>`
- ❌ `<div><section>...</section></div>` (no main parent)

**Auto-fix**: ❌ (Manual structural changes required)

---

#### `canonical:childgroup-key-match`

- **Name**: Child group component key must match nearest component root
- **Type**: Structure Rule
- **Severity**: Error
- **Target Classes**: Custom, Combo, Utility
- **Configurable**: ❌

**Description**: Child groups must share the same component key (name_variant) with their nearest component root ancestor to maintain consistent component naming.

**Naming Requirements**:

- Child group classes must start with the same component key as their root
- Component key format: `name_variant` (e.g., `hero_primary`)
- Child groups can add additional segments after the key

**Examples**:

- ✅ `hero_primary_wrap` (root) → `hero_primary_cta_wrap` (child group)
- ✅ `card_featured` (root) → `card_featured_image` (child group)
- ❌ `hero_primary_wrap` (root) → `card_cta_wrap` (child group) (different key)

**Auto-fix**: ❌ (Manual class renaming required)

---

## Rule Summary

| Rule ID                            | Name                                                        | Type      | Severity | Auto-fix | Configurable | Registered |
| ---------------------------------- | ----------------------------------------------------------- | --------- | -------- | -------- | ------------ | ---------- |
| `canonical:main-children`          | Main should contain sections or component roots             | Page      | Error    | ❌       | ❌           | ✅         |
| `canonical:childgroup-key-match`   | Child group component key must match nearest component root | Structure | Error    | ❌       | ❌           | ✅         |
| `canonical:section-parent-is-main` | Section must be a direct child of main                      | Structure | Error    | ❌       | ❌           | ❌         |

## Canonical Structural Patterns

These rules enforce fundamental structural patterns that apply across all presets:

### Page Structure

- **Semantic Content**: Main must contain meaningful content
- **Proper Hierarchy**: Sections must be direct children of main

### Component Relationships

- **Consistent Naming**: Child groups maintain component key consistency
- **Structural Validation**: Component hierarchy is properly maintained
- **Role Detection**: Elements are properly classified by their structural role

### Semantic Validation

- **Role Enforcement**: Elements must follow their assigned semantic roles
- **Structural Integrity**: Page structure follows accessibility and semantic best practices
- **Preset Agnostic**: Rules work regardless of naming convention

## Usage Across Presets

Canonical rules are fundamental and should be included in all presets to ensure:

- **Structural Consistency**: Pages follow proper semantic structure
- **Accessibility**: Elements maintain proper roles and relationships
- **Maintainability**: Component relationships are clear and consistent

## Configuration

Canonical rules are designed to be fundamental and do not support configuration. They enforce core structural patterns that should be consistent across all projects.
