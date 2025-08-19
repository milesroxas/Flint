# Rule and Linter Model

## What each field is for

- **`type: RuleType`**
  Engine concern. Determines **how** the rule executes and which API it uses.

  - `"naming"` → works on a single class string via `test/evaluate`.
  - `"composition"` → works on the element’s class list via `analyzeElement(args)`.
  - `"structure"` → works on the DOM graph and roles via `analyzeElement(args)` and parent/ancestor helpers.
  - `"property"` → works on computed properties or utility effects via `analyze(...)`.

- **`category: RuleCategory`**
  Product/UX concern. Determines **how you present, filter, and report** rules in the UI and presets. Typical values reflect the _why_ of the rule: `"format"`, `"semantics"`, `"maintainability"`, `"performance"`, `"accessibility"`, `"custom"`, etc.

In short: **type = execution pathway**. **category = user-facing grouping and rationale**.

# Concrete examples from your codebase

| Rule                                                  | `type` (engine)                                           | `category` (UX grouping) | Why this pairing                                                      |
| ----------------------------------------------------- | --------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------- |
| `lumos:naming:class-format`                           | `"naming"`                                                | `"format"`               | Operates on a single class token, presented as a formatting rule.     |
| `lumos:composition:class-order`                       | `"composition"`                                           | `"composition"`          | Operates on class list ordering. Shown under Composition.             |
| `lumos:composition:variant-requires-base`             | `"composition"`                                           | `"composition"`          | Checks presence relationship within class list.                       |
| `lumos:naming:combo-limit` (if you keep it as naming) | `"composition"` or `"naming"` depending on implementation | `"maintainability"`      | Even though it runs on class list, the _reason_ is tech-debt control. |
| `canonical:section-parent-is-main`                    | `"structure"`                                             | `"structure"`            | DOM role relationship.                                                |
| `property:large-background` (hypothetical)            | `"property"`                                              | `"performance"`          | Reads properties; you present it as a performance risk.               |
| `property:aria-role-conflict` (hypothetical)          | `"property"`                                              | `"accessibility"`        | Property-driven, but the rationale is a11y.                           |

# Why not collapse them?

If you kept only one field, you would lose either:

- The ability to route rules through the correct **executor** (naming vs element-scope vs property-scope), or
- The ability to **present** rules coherently for users, presets, and reporting.

Keeping both lets you:

- Dispatch by `type` in the runner:

  ```ts
  switch (rule.type) {
    case "naming":
      /* call test/evaluate */ break;
    case "composition":
    case "structure":
      /* call analyzeElement */ break;
    case "property":
      /* call analyze */ break;
  }
  ```

- Filter, group, toggle, and summarize by `category` in the UI and opinion modes.

# About narrowing categories on subtypes

It is useful to narrow when the category is intrinsic:

- `StructureRule` → `category: "structure"` makes sense and you already do this.
- `CompositionRule` → you can set `category: "composition"` for consistency.

This does **not** make `type` and `category` redundant. It only enforces sensible defaults. You still use `type` for execution and `category` for UX. For cross-cutting rules where the rationale differs, you can keep `type` fixed and choose another `category` when appropriate, or keep `category` fixed and add **tags** for secondary facets.

# Practical guidance

- Keep both fields. Use **`type`** for engine dispatch and required method signatures.
- Use **`category`** for UI grouping, filters, and preset toggles.
- Add **tags** for finer filters without exploding the enum.
- Where a subtype has a natural category, **narrow it** in the type to catch mistakes at compile time.

## Categories

### structure

Relationships in the DOM tree and role hierarchy. Examples: one main per page, section is direct child of main, child-group key matching.

### format

String shape and order of classes. Examples: class casing and separators, base-before-utilities, suffix requirements, disallow hyphen.

### semantics

Meaning and intent checks. Examples: heading order, tag vs role alignment, reserved prefixes, component namespace usage.

### accessibility

Alt text presence, interactive roles, label associations.

### performance

Asset and render cost risks. Examples: too many combo classes triggering specificity bloat, deep nesting, heavy effects flags.

### maintainability

Tech-debt and cleanliness. Examples: combo class count limits, duplicate base classes, unused styles, conflicting utilities.

### custom

Team or preset policy that does not fit above.
