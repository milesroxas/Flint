# FlowLint — User Stories

## Lint Violations

### Class Name Formatting Error

- **As a user**, I can see when a custom class name does not follow the required format.
  - I can view the correct format with a clear example.
  - I can view a suggested corrected name. _(Future: one-click rename)_
  - I can click a button to highlight the element with the violation.

### Combo Class Error

- **As a user**, I can see when an element has too many combo classes.
  - I can see the combo classes listed in the same order as applied.
  - I can see the allowed limit.
  - I can view a suggestion to merge or simplify classes.
- **As a user**, I can see when combo classes are in the wrong order or structure.
  - I can see the current order.
  - I can view the proper structure reference.

### Utility Class Misuse

- **As a user**, I can see when I use a utility class incorrectly.
  - I can see when a custom class is missing after the utility.
  - I can see when a utility is used in a non-permitted context (e.g., component root restrictions).

### Empty Div Error

- **As a user**, I can see when a `div` has no class assigned.
  - I can see a message stating that empty `div` elements are not allowed.

### Component Structure Error

- **As a user**, I can see when a component is not structured according to the preset.
  - I can view the component’s DOM tree.
  - I can read the specific rule violation:
    - Missing `_wrap` class.
    - Components must begin with a wrap.
    - Incorrect `contain` usage:
      - Not allowed as a child group root.
      - Should only set `width` and `margin: auto`.
    - Foreign element found (unrelated class).
    - Missing related custom class name.
    - Utility used where not allowed.

---

## Warnings

### Unknown Class Element Identifier

- **As a user**, I am warned when a class format contains an unrecognized element name.
  - I can view the accepted element name list.
  - I can add a new name to my accepted list.

### Custom Combo Class Duplicates Utility

- **As a user**, I am warned when a custom combo class duplicates properties of an existing utility.
  - I can view a side-by-side comparison.
  - I can see the duplicated properties.
  - I can view an example fix:
    - Remove `[custom-combo]` and replace with `[u-existing-utility]`.
