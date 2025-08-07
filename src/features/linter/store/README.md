# PageLintStore

This README describes the `PageLintStore` Zustand store, which manages the state and actions for linting Webflow pages using the `pageLintService`. It applies modern best practices in 2025, including middleware for debugging, selective subscriptions, and immutable updates.

---

## Table of Contents

1. [Overview](#overview)
2. [File Location](#file-location)
3. [Installation](#installation)
4. [Usage](#usage)

   - [Importing the Store](#importing-the-store)
   - [Reading State](#reading-state)
   - [Invoking Actions](#invoking-actions)

5. [State Shape](#state-shape)
6. [Middleware](#middleware)
7. [Services](#services)
8. [Example](#example)
9. [TypeScript Types](#typescript-types)
10. [Contributing](#contributing)
11. [License](#license)

---

## Overview

`PageLintStore` uses Zustand to manage:

- Lint results (`RuleResult[]`)
- Loading status (`boolean`)
- Error messages (`string | null`)
- An async action `lintPage` to perform the lint scan

It integrates with Webflow Designer API to fetch elements, then delegates to `pageLintService` to run the configured lint rules.

## File Location

```text
src/features/linter/stores/usePageLintStore.ts
```

## Installation

Ensure you have the following packages installed:

```bash
npm install zustand
npm install --save-dev @types/zustand
```

## Usage

### Importing the Store

```ts
import { usePageLintStore } from "@/features/linter/stores/pageLintStore";
```

### Reading State

Use selective subscriptions to avoid unnecessary re-renders.

```ts
const results = usePageLintStore((state) => state.results);
const loading = usePageLintStore((state) => state.loading);
const error = usePageLintStore((state) => state.error);
```

### Invoking Actions

Invoke the lint action when needed (for example on button click):

```tsx
<button onClick={() => usePageLintStore.getState().lintPage()}>
  Lint Page
</button>
```

or within a React effect:

```ts
useEffect(() => {
  const lint = usePageLintStore.getState().lintPage;
  lint();
}, []);
```

## State Shape

| Key      | Type                  | Description                              |
| -------- | --------------------- | ---------------------------------------- |
| results  | `RuleResult[]`        | Array of lint violations and suggestions |
| loading  | `boolean`             | True while lint is in progress           |
| error    | `string \| null`      | Error message if lint fails              |
| lintPage | `() => Promise<void>` | Async action to run the page lint        |

## Middleware

The store is enhanced with:

- `devtools` for Redux DevTools integration
- `subscribeWithSelector` for selective subscriptions
- `immer` for concise immutable updates

This setup provides performance and debugging benefits.

## Services

Singleton instances are initialized outside the store:

- `StyleService`
- `UtilityClassAnalyzer`
- `RuleRegistry` (registered with `defaultRules`)
- `RuleRunner`
- `pageLintService` (created via `createPageLintService`)

These services are reused across lint runs.

## Example

```tsx
import React from "react";
import { usePageLintStore } from "@/features/linter/stores/pageLintStore";

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

## TypeScript Types

```ts
interface PageLintState {
  results: RuleResult[];
  loading: boolean;
  error: string | null;
  lintPage: () => Promise<void>;
}
```
