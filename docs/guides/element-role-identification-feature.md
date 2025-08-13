# Implementing Robust Element-Role Identification in FlowLint

## Overview

The linter now computes and displays semantic element roles derived from class names, in addition to DOM contexts. The pipeline parses the first custom class via the active preset’s grammar and maps it to an `ElementRole` using the preset’s role resolver. Services attach the resolved role to each violation’s metadata so the UI can render badges and group items as needed.

---

## Current state

- **Element contexts** – `element-context-classifier.ts` assigns `componentRoot`, `childGroup`, and `childGroupInvalid` based on `_wrap` placement and parent/container rules.
- **Grammar & roles** – Implemented for Lumos and Client‑first under `src/features/linter/grammar/*` and `src/features/linter/roles/*`.
- **Services** – `element-lint-service.ts` and `page-lint-service.ts` compute roles by parsing the first custom class and reconciling `_wrap` with DOM context (demoting to `childGroup` when not a root).
- **UI** – `ViolationHeader.tsx` displays role badges when `violation.metadata.role` is present.

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

## Implementation details

### Grammar adapters

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

### Role resolvers

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

### Presets

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

### Pipeline wiring

In `rule-runner.ts`:

- Skip non-customs.
- Parse first custom class with `grammar.parse`.
- Map with `roles.mapToRole`.
- Attach role to `RuleContext`.

---

### Testing and validation

- **Grammar adapters**: class names → expected `ParsedClass`.
- **Role resolvers**: tokens → correct `ElementRole`, including wrap/childGroup handling.
- **Integration**: ensure `RuleContext` includes role.

---

### Notes on configuration

- Feature flag initially.
- `ProjectConfig.roleAliases` to map custom tokens to built-in roles.

---

## Conclusion

FlowLint defines contracts for role identification but no implementation.
Adding grammar adapters and role resolvers for Lumos and Client-First, integrating them into presets, and updating the pipeline unlocks:

- Context-aware lint rules.
- Meaningful role badges in UI.
- Alignment with Lumos and Client-First semantic naming best practices.
