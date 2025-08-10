# Combo Class Error — Development Implementation Guide

## Scope (what ships)

- Keep existing combo/order/limit detection logic intact.
- Enrich violations with:

  - `suggestedName` for **combo limit** cases (merge utilities into first combo).
  - `currentOrder` and `properOrder` for **ordering** cases (combos/utilities after custom).

- Light UI change to render the new metadata.
- Unit + snapshot tests.

This follows your existing runner + UI patterns, avoids redundant code, and keeps performance tight.

---

## Preconditions

- Repo layout validated around these paths:

  - `src/features/linter/services/rule-runner.ts`
  - `src/features/linter/components/ViolationItem.tsx`
  - `src/features/linter/model/rule.types.ts` (already allows open‑ended `metadata`)

- Existing violations surfaced for:

  - `lumos-combo-class-limit`
  - `lumos-combos-after-custom-ordering`
  - `lumos-utilities-after-custom-ordering`

---

## Changes by File

### 1) New factory (no external deps)

**Path:** `src/features/linter/services/combo-suggestion.factory.ts`

**Why:** Keeps naming logic isolated and testable; you can later swap grammar behavior without touching the runner. Uses a **factory function** per your style.

```ts
// src/features/linter/services/combo-suggestion.factory.ts
export interface ComboSuggestionParams {
  /** Custom class names in order of appearance (first is base). */
  customClasses: string[];
  /** Combo class names in order of appearance (first is variant). */
  combos: string[];
}

/**
 * Builds a suggestion like: base `card_primary` + first combo `is-rounded`
 * -> `is-card-primary-rounded`
 */
export const createComboSuggestion = () => {
  return ({
    customClasses,
    combos,
  }: ComboSuggestionParams): string | undefined => {
    if (!customClasses?.length || !combos?.length) return undefined;
    const base = customClasses[0]; // e.g., "card_primary"
    const variant = combos[0].replace(/^is-/, ""); // e.g., "rounded"
    const baseSlug = base.replace(/_/g, "-"); // "card-primary"
    return `is-${baseSlug}-${variant}`; // "is-card-primary-rounded"
  };
};
```

**Notes**

- Intentionally minimal. If/when you wire a grammar adapter, swap the kebab logic to use it.

---

### 2) Rule runner enrichment

**Path:** `src/features/linter/services/rule-runner.ts`

**What to add:**

- Import and instantiate the new factory once.
- For each element, compute `currentOrder`, `properOrder`, and `suggestedName`.
- Attach the new metadata to **existing** violations.

**Suggested patch (conceptual diff):**

```ts
// imports
import { createComboSuggestion } from "../services/combo-suggestion.factory"; // adjust relative path if needed

export const createRuleRunner = (registry, analyzer) => {
  const suggestCombo = createComboSuggestion();

  // ... inside your per-element loop where `list` is the element's styles
  const ordered = [...list].sort((a, b) => a.order - b.order);
  const currentOrder = ordered.map((s) => s.name);

  // classify using your existing getClassType(...) util
  const customClasses = ordered
    .filter((s) => getClassType(s.name) === "custom")
    .map((s) => s.name);
  const comboClasses = ordered
    .filter((s) => getClassType(s.name) === "combo")
    .map((s) => s.name);
  const utilities = ordered
    .filter((s) => getClassType(s.name) === "utility")
    .map((s) => s.name);
  const properOrder = [...customClasses, ...comboClasses, ...utilities];

  const suggestedName = suggestCombo({ customClasses, combos: comboClasses });

  // When pushing "combos after custom" or "utilities after custom":
  results.push({
    ruleId: "lumos-combos-after-custom-ordering", // or utilities variant
    name: "Wrong class order",
    message: "Combos should follow the base custom class.", // keep existing text style
    severity: "warning", // keep your severity
    elementId: elId,
    metadata: { elementId: elId, currentOrder, properOrder },
  });

  // When pushing "combo class limit":
  results.push({
    ruleId: "lumos-combo-class-limit",
    name: "Too many combo classes",
    message:
      `This element has ${comboClasses.length} combo classes; limit is ${maxCombos}.` +
      (suggestedName
        ? ` Merge remaining combo/utility classes into “${suggestedName}”.`
        : ""),
    severity: "warning",
    elementId: elId,
    metadata: {
      elementId: elId,
      combos: comboClasses,
      maxCombos,
      suggestedName,
    },
  });
};
```

**Guardrails**

- Only compute `currentOrder`/`properOrder` once per element.
- Only include `currentOrder`/`properOrder` on **ordering** violations.
- `suggestedName` is optional—message concatenation guards against `undefined`.
- No type changes needed; `RuleResult.metadata` is already open‑ended.

---

### 3) UI rendering

**Path:** `src/features/linter/components/ViolationItem.tsx`

**What to add:** small block to render order metadata for ordering violations. The “Suggested” label already shows `suggestedName` for other rules—your new combo‑limit suggestion will appear there automatically.

**Snippet:**

```tsx
{
  Array.isArray(violation.metadata?.currentOrder) &&
    Array.isArray(violation.metadata?.properOrder) && (
      <div className="mt-1 space-y-1">
        <div>
          <strong>Current order:</strong>{" "}
          {violation.metadata.currentOrder.join(" \u2192 ")}
        </div>
        <div>
          <strong>Proper order:</strong>{" "}
          {violation.metadata.properOrder.join(" \u2192 ")}
        </div>
      </div>
    );
}
```

**Style & UX**

- Keep the panel compact. This block only renders when metadata exists.
- The existing “Suggested:” row (already in the component) will show `suggestedName` for `lumos-combo-class-limit`.

---

## Acceptance Criteria (User story mapping)

- **Too many combo classes**

  - Violation shows:

    - Combo classes listed in applied order (already in place).
    - Allowed limit (already in place).
    - **Suggested merge target** (new): `suggestedName` (e.g. `is-card-primary-rounded`).

- **Wrong order / structure**

  - Violation shows:

    - **Current order** of classes.
    - **Proper order** reference (custom → combo → utilities).

- **No regressions**

  - Existing detections and severities unchanged.
  - Page scan and element scan show identical behavior.

---

## Test Plan

### Unit

- **Factory**

  - `createComboSuggestion()`:

    - returns `undefined` when missing base or first combo.
    - converts `card_primary` + `is-rounded` → `is-card-primary-rounded`.
    - preserves `is-` prefix on final result and strips it from variant.

- **Runner metadata**

  - Ordering case attaches `currentOrder` & `properOrder`.
  - Combo limit case attaches `suggestedName` when computable.

### Snapshot (“golden” messages)

- Update snapshots for:

  - `lumos-combo-class-limit` (message now may include merge suggestion).
  - Ordering violations (no message change required if you keep current text; but new metadata fields exist—assert in a structured snapshot if you snapshot full objects).

### Integration

- Simulated element with `card_primary is-rounded u-shadow-md u-p-4`:

  - Proper order: `["card_primary","is-rounded","u-shadow-md","u-p-4"]`.
  - If your limit triggers, expect `suggestedName = is-card-primary-rounded`.
  - UI renders both orders and suggestion.

---

## Rollout Checklist

- [ ] Add `combo-suggestion.factory.ts`.
- [ ] Enrich `rule-runner.ts` with `currentOrder`, `properOrder`, `suggestedName`.
- [ ] Render order metadata in `ViolationItem.tsx`.
- [ ] Update/extend unit tests for the factory and runner enrichments.
- [ ] Refresh snapshots.
- [ ] Manual smoke test on a page with:

  - basic custom + 1 combo + 2 utilities.
  - an out‑of‑order class sequence.
  - over‑limit combo count.

- [ ] Verify both **Selected Element** and **Page Scan** flows show identical output (your known parity goal).

---

## Code Quality & Performance Notes

- **Factory functions**: used for suggestion logic as requested.
- **Type safety**: no schema churn; document new `metadata` keys in comments.
- **Perf**: the per‑element sort was already happening in your flow; we reuse that result to avoid repeated work.
- **Maintainability**: minimal touch surface; relies on existing IDs and UI renderer paths.

---

## Future‑proofing (optional, fast follows)

- Swap string transforms for your **Grammar Adapter** when you formalize one in the preset system (so `suggestedName` always conforms to Lumos or Client‑First rules).
- Add a **quick‑fix CTA** (copy suggested name to clipboard) in `ViolationItem` for combo‑limit errors.
- Gate the suggestion via a rule option if you want it configurable in presets.

---

## Time Estimate

- Factory + runner enrichment: **2–3 hrs**
- UI block + styles: **0.5 hr**
- Unit + snapshot tests: **1–1.5 hrs**
- Manual QA (two flows): **0.5 hr**
- **Total:** \~**4–5.5 hrs**

If you want, I can prep a PR branch with the files and diffs exactly aligned to your repo tree so you can review and merge quickly.
