# Implementing Robust Element-Role Identification in FlowLint

## Overview

The current FlowLint UI can display element contexts (the classifier uses Webflow’s DOM structure to detect when an element is the root of a component), but it does not yet surface the semantic **role** of each element.

The `linter.types.ts` file defines an `ElementRole` union covering roles such as `container`, `layout`, `title`, `actions`, etc., and the unified plan explains that the lint pipeline should parse class names using a `GrammarAdapter` and then map each parsed class to a role using a `RoleResolver`.

However, there is no runtime logic wired up to perform this parsing or mapping — the only context currently exposed is `componentRoot` from the `element-context-classifier`.

This guide describes how to extend the FlowLint codebase to provide robust role identification for both Lumos and Client-First naming conventions. The goal is to parse the first custom class on an element, infer its role (e.g., `title`, `text`, `actions`), and surface that role in the linter context so that context-aware rules and the UI can react appropriately.

---

## Current state

- **Element contexts** – `element-context-classifier.ts` assigns only one context (`componentRoot`) by checking for classes ending in `_wrap` that have an ancestor with classes like `section_contain`, `u-section…` or `c-…`.
- **Types scaffolding** – `linter.types.ts` defines `ElementRole`, `ParsedClass`, `GrammarAdapter` and `RoleResolver` but there are no implementations.
- **UI** – `LintPanelHeader.tsx` accepts an array of roles and converts each role to a human-friendly label (e.g., `componentRoot` → “Component Root”). Currently the UI always receives an empty roles array because roles are never computed.

---

## Why element roles matter

Lumos and Client-First guidelines emphasise naming classes semantically.  
A custom class is composed of:

- **Type** – component identifier.
- **Variation** – optional.
- **Element tokens** – describe the role.

Example: `hero_secondary_title` →  
type: `hero`, variation: `secondary`, element token: `title`.

Element tokens convey the role of that element within the component:

- `_wrap` → component root.
- `_contain` / `_container` → container.
- `_layout` → layout wrappers.
- `_content`, `_title`, `_text`, `_actions`, `_button`, `_link`, `_icon`, `_list`, `_item` → semantic roles.

Child groups inside a component also end in `_wrap` — e.g. `.footer_link_wrap` is a child group inside `.footer_wrap`.

Mapping these tokens to the `ElementRole` union will enable FlowLint to provide role-specific lint rules and group violations by semantic role in the UI.

---

## Design considerations from Lumos and Client-First

### Lumos

- Underscore-separated custom classes.
- At most three underscores.
- Custom classes applied first.
- `_wrap` for component root.
- Structure: `type` + optional `variation` + `element`.

Typical element tokens: `wrap`, `contain`, `layout`, `content`, `title`, `text`, `actions`, `button`, `link`, `icon`, `list`, `item`.

### Client-First

- Similar underscore pattern.
- Adds core structure classes: `page-wrapper`, `main-wrapper`, `section_[id]`, `padding-global`, `container-[size]`, `padding-section-[size]`.
- Recognise collection classes: `collection-list` → `list`, `collection-item` → `item`.

---

## Utility, component, and combo classes

- Utility: start with `u-` (skip for role parsing).
- Component: start with `c-` (skip).
- Combo: start with `is-` (skip).

The grammar parser should skip these and operate only on the **first custom class**.

---

## Implementation plan

### 1. Create grammar adapters

`src/features/linter/grammar/`

**Lumos grammar adapter (`lumos.grammar.ts`)**

1. Determine class kind:
   - `u-` → utility.
   - `c-` → component.
   - `is-` → combo.
   - Else: custom.
2. Tokenise by `_`.
3. Construct `ParsedClass` object with type, variation, and `elementToken` as last token.
4. Expose prefixes and `isCustomFirstRequired`.

**Client-First grammar adapter (`client-first.grammar.ts`)**

- Same as Lumos but:
  - Handle `collection-list` / `collection-item`.
  - Handle core structure dashes → normalise or tokenise accordingly.
  - Recognise container and wrapper roles.

---

### 2. Implement role resolvers

`src/features/linter/roles/`

**Mapping table:**

| Element token(s)           | ElementRole   |
| -------------------------- | ------------- |
| wrap (first)               | componentRoot |
| wrap (subsequent)          | childGroup    |
| contain, container\*       | container     |
| layout                     | layout        |
| content                    | content       |
| title, heading, header     | title         |
| text, paragraph, rich-text | text          |
| actions, buttons           | actions       |
| button, btn                | button        |
| link                       | link          |
| icon                       | icon          |
| list, collection-list      | list          |
| item, collection-item, li  | item          |
| anything else              | unknown       |

**Lumos resolver**

- First custom class only.
- `isContainerLike` for contain/container/layout.

**Client-First resolver**

- Extend to core structure:
  - `page-wrapper`, `main-wrapper` → layout.
  - `padding-global`, `padding-section-*` → layout.
  - `section_*` → layout.
  - `collection-*` → list/item.
- `isContainerLike` includes wrapper, section, container, padding-global.

---

### 3. Integrate grammar and roles into presets

Example:

```ts
export const lumosPreset: Preset = {
  id: "lumos",
  grammar: lumosGrammar,
  roles: lumosRoles,
  rules: [
    /* existing */
  ],
};
```

---

### 4. Enhance the linter pipeline

In `rule-runner.ts`:

- Skip non-customs.
- Parse first custom class with `grammar.parse`.
- Map with `roles.mapToRole`.
- Attach role to `RuleContext`.

---

### 5. Testing and validation

- **Grammar adapters**: class names → expected `ParsedClass`.
- **Role resolvers**: tokens → correct `ElementRole`, including wrap/childGroup handling.
- **Integration**: ensure `RuleContext` includes role.

---

### 6. Migration and configuration

- Feature flag initially.
- `ProjectConfig.roleAliases` to map custom tokens to built-in roles.

---

## Conclusion

FlowLint defines contracts for role identification but no implementation.
Adding grammar adapters and role resolvers for Lumos and Client-First, integrating them into presets, and updating the pipeline unlocks:

- Context-aware lint rules.
- Meaningful role badges in UI.
- Alignment with Lumos and Client-First semantic naming best practices.
