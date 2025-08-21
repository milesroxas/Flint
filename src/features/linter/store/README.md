# Linter Stores

This README describes the Zustand stores for linting Webflow pages and elements. It applies modern best practices in 2025, including middleware for debugging, selective subscriptions, and immutable updates.

---

## Table of Contents

1. [Overview](#overview)
2. [File Locations](#file-locations)
3. [Installation](#installation)
4. [Usage](#usage)

   - [Importing the Stores](#importing-the-stores)
   - [Reading State](#reading-state)
   - [Invoking Actions](#invoking-actions)

5. [State Shapes](#state-shapes)
6. [Middleware](#middleware)
7. [Services](#services)
8. [Examples](#examples)
9. [TypeScript Types](#typescript-types)
10. [Contributing](#contributing)
11. [License](#license)

---

## Overview

### PageLintStore

`PageLintStore` uses Zustand to manage:

- Lint results (`RuleResult[]`)
- Loading status (`boolean`)
- Error messages (`string | null`)
- An async action `lintPage` to perform the lint scan

It integrates with Webflow Designer API to fetch elements, then delegates to `pageLintService` to run the configured lint rules.

### ElementLintStore

`ElementLintStore` manages element-specific linting:

- Lint results for the currently selected element (`RuleResult[]`)
- Structural context toggle (`boolean`) - enables subtree analysis vs. single-element analysis
- Loading status and error handling
- Auto-refresh on Designer selection events
- Async action `refresh` to re-lint the selected element

When structural context is enabled, it analyzes the selected element and all its descendants using the same logic as page scans.

## File Locations

```text
src/features/linter/store/usePageLintStore.ts
src/features/linter/store/elementLint.store.ts
```

## Installation

Already included in this project. If needed in isolation:

```bash
pnpm add zustand
```

## Usage

### Importing the Stores

```ts
import { usePageLintStore } from "@/features/linter/store/usePageLintStore";
import { useElementLintStore } from "@/features/linter/store/elementLint.store";
```

### Reading State

Use selective subscriptions to avoid unnecessary re-renders.

**Page Lint:**

```ts
const results = usePageLintStore((state) => state.results);
const loading = usePageLintStore((state) => state.loading);
const error = usePageLintStore((state) => state.error);
```

**Element Lint:**

```ts
const results = useElementLintStore((state) => state.results);
const structuralContext = useElementLintStore(
  (state) => state.structuralContext
);
const loading = useElementLintStore((state) => state.loading);
```

### Invoking Actions

**Page Lint:**

```tsx
<button onClick={() => usePageLintStore.getState().lintPage()}>
  Lint Page
</button>
```

**Element Lint:**

```tsx
// Toggle structural context
const setStructuralContext = useElementLintStore(
  (state) => state.setStructuralContext
);
<button onClick={() => setStructuralContext(!structuralContext)}>
  Toggle Structure
</button>;

// Refresh element lint
const refresh = useElementLintStore((state) => state.refresh);
<button onClick={refresh}>Refresh Element</button>;
```

## State Shapes

### PageLintStore

| Key              | Type                  | Description                                   |
| ---------------- | --------------------- | --------------------------------------------- |
| results          | `RuleResult[]`        | Array of lint violations and suggestions      |
| passedClassNames | `string[]`            | Unique class names encountered during the run |
| loading          | `boolean`             | True while lint is in progress                |
| error            | `string \| null`      | Error message if lint fails                   |
| hasRun           | `boolean`             | Indicates if at least one run has occurred    |
| lintPage         | `() => Promise<void>` | Async action to run the page lint             |
| clearResults     | `() => void`          | Clears results and resets flags               |

### ElementLintStore

| Key                  | Type                         | Description                                   |
| -------------------- | ---------------------------- | --------------------------------------------- |
| results              | `RuleResult[]`               | Array of lint violations for selected element |
| classNames           | `string[]`                   | Class names of selected element (legacy)      |
| roles                | `ElementRole[]`              | Detected roles of selected element (legacy)   |
| loading              | `boolean`                    | True while lint is in progress                |
| error                | `string \| null`             | Error message if lint fails                   |
| structuralContext    | `boolean`                    | Whether structural context is enabled         |
| refresh              | `() => Promise<void>`        | Async action to re-lint selected element      |
| clear                | `() => void`                 | Clears results and resets flags               |
| setStructuralContext | `(enabled: boolean) => void` | Toggles structural context mode               |

## Middleware

Both stores are enhanced with:

- `devtools` for Redux DevTools integration
- `subscribeWithSelector` for selective subscriptions
- `immer` for concise immutable updates

This setup provides performance and debugging benefits.

## Services

Singleton instances are initialized outside the stores:

- `StyleService`
- `UtilityClassAnalyzer`
- `RuleRegistry` (registered with preset rules)
- `RuleRunner`
- `pageLintService` (created via `createPageLintService`)
- `elementLintService` (created via `createElementLintService`)

These services are reused across lint runs.

## Examples

### Page Lint Button

```tsx
import React from "react";
import { usePageLintStore } from "@/features/linter/store/usePageLintStore";

export function LintButton() {
  const loading = usePageLintStore((state) => state.loading);
  const lintPage = usePageLintStore((state) => state.lintPage);

  return (
    <button disabled={loading} onClick={lintPage}>
      {loading ? "Linting..." : "Lint Page"}
    </button>
  );
}
```

### Element Lint with Structural Toggle

```tsx
import React from "react";
import { useElementLintStore } from "@/features/linter/store/elementLint.store";

export function ElementLintControls() {
  const { results, structuralContext, loading, refresh, setStructuralContext } =
    useElementLintStore();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={structuralContext}
          onChange={(e) => setStructuralContext(e.target.checked)}
        />
        Analyze subtree (selected element + descendants)
      </label>

      <button disabled={loading} onClick={refresh}>
        {loading ? "Linting..." : "Lint Element"}
      </button>

      <div>Found {results.length} violations</div>
    </div>
  );
}
```

## TypeScript Types

### PageLintStore

```ts
interface PageLintState {
  results: RuleResult[];
  passedClassNames: string[];
  loading: boolean;
  error: string | null;
  hasRun: boolean;
}

interface PageLintActions {
  lintPage: () => Promise<void>;
  clearResults: () => void;
}

type PageLintStore = PageLintState & PageLintActions;
```

### ElementLintStore

```ts
interface ElementLintState {
  results: RuleResult[];
  classNames: string[];
  roles: ElementRole[];
  loading: boolean;
  error: string | null;
  structuralContext: boolean;
}

interface ElementLintActions {
  refresh: () => Promise<void>;
  clear: () => void;
  setStructuralContext: (enabled: boolean) => void;
}

type ElementLintStore = ElementLintState & ElementLintActions;
```

## Auto-refresh Behavior

The `ElementLintStore` automatically subscribes to Webflow Designer's `selectedelement` events and refreshes the lint results when a new element is selected. This ensures the UI always shows violations for the currently selected element.

When `structuralContext` is enabled, the store will analyze the selected element and all its descendants, enabling structural rules like `canonical:child-group-key-match` to run on nested children.
