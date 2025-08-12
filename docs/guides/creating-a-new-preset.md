# Creating a New Preset (End‑to‑End)

This guide walks you through creating a new preset from scratch, including grammar and role adapters, rule registration, optional context configuration, wiring, testing, and best practices. It references existing patterns in this repository and links to the Webflow Designer Extensions documentation where relevant.

---

## What is a Preset?

A preset bundles:

- Grammar adapter: parses a class name into structured tokens
- Role resolver: maps parsed tokens to an `ElementRole`
- Rules: naming/property/context‑aware checks
- Optional `contextConfig`: tweaks for the element‑context classifier

Reference implementation files you can open side‑by‑side:

- `src/presets/lumos.preset.ts`
- `src/presets/client-first.preset.ts`
- `src/features/linter/grammar/lumos.grammar.ts`
- `src/features/linter/grammar/client-first.grammar.ts`
- `src/features/linter/roles/lumos.roles.ts`
- `src/features/linter/roles/client-first.roles.ts`

Contracts and data flow are documented in:

- `docs/guides/how-it-all-works.md` (Presets, grammar, roles and pipeline)
- `docs/guides/architecture.md` (Where things live and how they wire)
- `docs/guides/unified-plan.md` (Interfaces like `Preset`, `GrammarAdapter`, `RoleResolver`)

Webflow Designer Extensions references:

- Webflow Designer Extensions overview: [Designer Extensions](https://developers.webflow.com/docs/designer-extensions)
- API reference: [Designer Extensions API Reference](https://developers.webflow.com/docs/designer-extensions-api-reference)

---

## Prerequisites

- Node and pnpm installed
- Dev server runs with:

```bash
pnpm dev
```

- Tests run with:

```bash
pnpm exec vitest
```

---

## Step 1 — Choose a preset ID and folder scaffold

Pick a lowercase kebab‑case ID, e.g., `acme`.

Create three files following existing patterns:

- `src/features/linter/grammar/acme.grammar.ts`
- `src/features/linter/roles/acme.roles.ts`
- `src/presets/acme.preset.ts`

Keep imports using the `@` alias configured in `vite.config.ts` and `tsconfig.json`.

---

## Step 2 — Implement the Grammar Adapter

Grammar turns a class string into a `ParsedClass` object (see `linter.types.ts`).

File: `src/features/linter/grammar/acme.grammar.ts`

```ts
import {
  GrammarAdapter,
  ParsedClass,
} from "@/features/linter/model/linter.types";

function tokenizeUnderscore(name: string): string[] {
  return name.split("_").filter(Boolean);
}

function detectKind(name: string): ParsedClass["kind"] {
  if (name.startsWith("u-")) return "utility";
  if (name.startsWith("is-")) return "combo";
  if (name.startsWith("c-")) return "unknown"; // reserved for components; not parsed as custom
  return "custom";
}

export const acmeGrammar: GrammarAdapter = {
  id: "acme",
  utilityPrefix: "u-",
  comboPrefix: "is-",
  componentPrefix: "c-",
  isCustomFirstRequired: true,
  parse(name: string): ParsedClass {
    const kind = detectKind(name);
    if (kind !== "custom") {
      return { raw: name, kind };
    }
    const tokens = tokenizeUnderscore(name);
    const [type, maybeVariation, ...rest] = tokens;
    const elementToken = rest.length > 0 ? rest[rest.length - 1] : undefined;

    // Accept either 2 or 3+ segments. If 3+ → treat the second as variation.
    const variation = rest.length > 0 ? maybeVariation : undefined;

    return {
      raw: name,
      kind,
      type,
      variation,
      elementToken,
      tokens,
    };
  },
};
```

Notes:

- Tokenization uses underscores to align with existing presets.
- Only the first custom class on an element will be role‑mapped later.

---

## Step 3 — Implement the Role Resolver

The role resolver maps a `ParsedClass` into an `ElementRole`. Keep it conservative; unknowns are allowed.

File: `src/features/linter/roles/acme.roles.ts`

```ts
import {
  ElementRole,
  ParsedClass,
  RoleResolver,
} from "@/features/linter/model/linter.types";

function toRoleFromElementToken(token?: string): ElementRole {
  switch (token) {
    case "wrap":
      return "componentRoot";
    case "contain":
    case "container":
      return "container";
    case "layout":
      return "layout";
    case "content":
      return "content";
    case "title":
    case "heading":
    case "header":
      return "title";
    case "text":
    case "paragraph":
    case "rich-text":
      return "text";
    case "actions":
    case "buttons":
      return "actions";
    case "button":
    case "btn":
      return "button";
    case "link":
      return "link";
    case "icon":
      return "icon";
    case "list":
    case "collection-list":
      return "list";
    case "item":
    case "collection-item":
    case "li":
      return "item";
    default:
      return "unknown";
  }
}

export const acmeRoles: RoleResolver = {
  id: "acme",
  mapToRole(parsed: ParsedClass): ElementRole {
    if (parsed.kind !== "custom") return "unknown";
    return toRoleFromElementToken(parsed.elementToken);
  },
  isContainerLike(parsed: ParsedClass): boolean {
    if (parsed.kind !== "custom") return false;
    const token = parsed.elementToken ?? "";
    return ["wrap", "contain", "container", "layout"].includes(token);
  },
};
```

Notes:

- Defers `childGroup` vs `componentRoot` to DOM context reconciliation in the pipeline (the classifier may demote a `wrap`).

---

## Step 4 — Add Rules (minimal to start)

Rules should be small, focused, and typed. Place them under `src/rules` in the matching category folder.

Example naming rule file: `src/rules/naming/acme-custom-class-format.ts`

```ts
import type {
  NamingRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

export const acmeCustomClassFormatRule: NamingRule = {
  id: "acme-custom-class-format",
  name: "Acme Custom Class Format",
  description:
    "Custom classes must be lowercase and underscore-separated (type[_variation]_element)",
  example: "hero_wrap, hero_primary_title",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],

  test(className: string): boolean {
    if (
      className.startsWith("c-") ||
      className.startsWith("u-") ||
      className.startsWith("is-")
    )
      return true;
    return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(className);
  },

  evaluate(className: string): RuleResult | null {
    if (
      className.startsWith("c-") ||
      className.startsWith("u-") ||
      className.startsWith("is-")
    )
      return null;
    const ok = /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(className);
    if (ok) return null;
    return {
      ruleId: "acme-custom-class-format",
      name: "Acme Custom Class Format",
      message: `Invalid custom class: ${className}`,
      severity: "warning",
      className,
      isCombo: false,
    };
  },
};
```

You can reuse or extend existing Lumos/Client‑First rules as templates:

- `src/rules/naming/lumos-custom-class-format.ts`
- `src/rules/naming/lumos-utility-class-format.ts`
- `src/rules/naming/lumos-combo-class-format.ts`
- `src/rules/property/lumos-utility-class-exact-duplicate.ts`
- `src/rules/context-aware/*`

---

## Step 5 — Create the Preset file

File: `src/presets/acme.preset.ts`

```ts
import { Preset } from "@/features/linter/model/linter.types";
import { acmeGrammar } from "@/features/linter/grammar/acme.grammar";
import { acmeRoles } from "@/features/linter/roles/acme.roles";
import { acmeCustomClassFormatRule } from "@/rules/naming/acme-custom-class-format";

export const acmePreset: Preset = {
  id: "acme",
  grammar: acmeGrammar,
  roles: acmeRoles,
  rules: [
    acmeCustomClassFormatRule,
    // add more rules from src/rules/** as needed
  ],
  // Optional: tweak the DOM context classifier for your naming scheme
  contextConfig: {
    wrapSuffix: "_wrap",
    requireDirectParentContainerForRoot: true,
    childGroupRequiresSharedTypePrefix: true,
    parentClassPatterns: ["section_contain", /^u-section/, /^c-/, /^page_main/],
    typePrefixSeparator: "_",
    typePrefixSegmentIndex: 0,
    groupNamePattern: /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    childGroupPrefixJoiner: "_",
  },
};
```

If your preset needs a different `_wrap` suffix or different container patterns, adjust `contextConfig` accordingly. See `src/entities/element/model/element-context-classifier.ts` and `docs/guides/how-it-all-works.md` for classifier behavior.

---

## Step 6 — Make the preset selectable (dynamic registry)

No manual wiring is needed. Presets are auto-discovered via `import.meta.glob` in `src/presets/index.ts`. Dropping a `*.preset.ts` file that exports a `Preset` object will:

- Register it for the linter boot (`initializeRuleRegistry` uses the registry to resolve the active preset)
- Automatically appear in the UI switcher (`PresetSwitcher` lists available preset IDs at runtime)

The switcher calls `ensureLinterInitialized(mode, presetId)` to rebuild the registry using your preset.

---

## Step 7 — Run and validate locally

- Start dev server:

```bash
pnpm dev
```

- Switch presets in the UI and lint a few pages/elements
- Confirm rules fire and role badges appear as expected

If you rely on Webflow Designer APIs (e.g., element selection, resizing), consult the official docs:

- [Designer Extensions](https://developers.webflow.com/docs/designer-extensions)
- [API Reference](https://developers.webflow.com/docs/designer-extensions-api-reference)

---

## Step 8 — Testing

Aim for unit and integration coverage that mirrors existing suites under `src/features/linter/services/__tests__/`.

1. Grammar unit tests

Create `src/features/linter/grammar/__tests__/acme.grammar.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { acmeGrammar } from "@/features/linter/grammar/acme.grammar";

describe("acmeGrammar", () => {
  it("parses custom with element token", () => {
    const parsed = acmeGrammar.parse("hero_primary_title");
    expect(parsed.kind).toBe("custom");
    expect(parsed.type).toBe("hero");
    expect(parsed.variation).toBe("primary");
    expect(parsed.elementToken).toBe("title");
  });

  it("marks utilities and combos without parsing", () => {
    expect(acmeGrammar.parse("u-p-4").kind).toBe("utility");
    expect(acmeGrammar.parse("is-rounded").kind).toBe("combo");
  });
});
```

2. Roles unit tests

Create `src/features/linter/roles/__tests__/acme.roles.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { acmeRoles } from "@/features/linter/roles/acme.roles";

const make = (raw: string) => ({
  raw,
  kind: "custom" as const,
  elementToken: raw,
  tokens: [raw],
});

describe("acmeRoles", () => {
  it("maps tokens to roles", () => {
    expect(acmeRoles.mapToRole(make("wrap"))).toBe("componentRoot");
    expect(acmeRoles.mapToRole(make("contain"))).toBe("container");
    expect(acmeRoles.mapToRole(make("layout"))).toBe("layout");
  });
});
```

3. Integration tests

- Consider adding a parity test similar to `src/features/linter/services/__tests__/lumos.preset.parity.test.ts` for your preset’s expected outcomes.
- Use `scan.process.integration.test.ts` as a template to validate end‑to‑end scanning with your preset active.

Run all tests:

```bash
pnpm exec vitest
```

---

## Best practices

- Type safety

  - Export concrete `GrammarAdapter`, `RoleResolver`, and `Rule` objects with explicit types from `@/features/linter/model/linter.types`.
  - Avoid `any`. Leverage discriminated unions (`ParsedClass.kind`).

- Rule design

  - Keep rules single‑purpose and side‑effect free.
  - Prefer pure functions; avoid DOM walks inside rules.
  - Use the `RuleContext` to read precomputed data (contexts, parsed classes, utility maps).

- Performance

  - Do not re‑compute class kind or duplicate maps inside rules; the runner and analyzers handle that.
  - Prefer early returns and simple regexes.
  - Use `contextConfig` instead of ad‑hoc DOM traversal.

- Maintainability

  - Reuse existing helpers and patterns from `lumos`/`client-first`.
  - Keep naming consistent: files in `kebab-case`, exported symbols in `camelCase`/`PascalCase` per existing conventions.

- UX alignment
  - Provide clear `description` and messages in rules.
  - Where applicable, include `metadata` that UI can render (e.g., `formattedProperty`).

---

## Troubleshooting

- My preset loads but rules don’t run

  - Use the UI to switch to your preset and ensure it appears in `PresetSwitcher`. This calls `ensureLinterInitialized("balanced", "acme")` under the hood.
  - Check `rules` array is non‑empty and rule IDs are unique.

- Roles look wrong for `_wrap`

  - Expected: grammar maps `_wrap` to `componentRoot`, but classifier can demote to `childGroup` when not at root. See `element-context-classifier.ts` and adjust `contextConfig`.

- Duplicate utilities detection seems off
  - The utility analyzer works on `u-*` styles. Ensure your site styles and prefixes align with defaults or extend grammar if needed.

---

## Reference index

- Preset contracts and wiring: `docs/guides/how-it-all-works.md`, `docs/guides/architecture.md`, `docs/guides/unified-plan.md`
- Element context classifier: `src/entities/element/model/element-context-classifier.ts`
- Linter factory and registry: `src/features/linter/model/linter.factory.ts`, `src/features/linter/services/registry.ts`
- Rule runner: `src/features/linter/services/rule-runner.ts`
- Existing presets: `src/presets/lumos.preset.ts`, `src/presets/client-first.preset.ts`
- Existing adapters: `src/features/linter/grammar/*`, `src/features/linter/roles/*`
- Rules: `src/rules/**`
- Tests: `src/features/linter/services/__tests__/**`
- Webflow Designer Extensions: [Docs](https://developers.webflow.com/docs/designer-extensions), [API Reference](https://developers.webflow.com/docs/designer-extensions-api-reference)

---

## Checklist

- [ ] Grammar adapter created and exported
- [ ] Role resolver created and exported
- [ ] Rules created and added to preset `rules`
- [ ] `contextConfig` tuned (optional)
- [ ] Preset file created and auto‑discovered (visible in `PresetSwitcher`)
- [ ] Tests added (grammar, roles, and integration)
- [ ] `pnpm exec vitest` passes and preset works in `pnpm dev`
