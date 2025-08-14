# Guide: Enhancing the Client‑First Linter Preset

This document describes how to extend the existing **Client‑First** preset in
FlowLint to enforce more of Finsweet’s naming and structural conventions. It is
structured according to the project’s Feature‑Sliced layout and assumes
TypeScript and modern best practices. When implementing services or helpers,
prefer **factory functions** over classes for better tree‑shaking and easier
testing. All examples below follow the naming and folder conventions
described in `docs/guides/unified-plan.md`.

## Overview

The current `client-first` preset implements only a handful of rules. To
provide a robust experience aligned with the official Client‑First docs you
should:

1. **Enhance the grammar** to parse custom class names into
   _type_, _variation_ and _element_ tokens.
2. **Extend the role resolver** to recognise additional structural tokens
   (e.g. `page-wrapper`, `section_*`, `container-*`, `padding-global`).
3. **Add new naming and context‑aware rules** that enforce the naming
   conventions, restrict deep stacking, validate variant usage and ensure
   containers and spacing classes are applied correctly.
4. **Update the preset’s context configuration** to match Client‑First’s
   core structure.
5. **Write unit tests** to guarantee parity and prevent regressions.

Each step below references the existing file structure. Paths are relative
to the project root.

## 1. Grammar enhancement

File to update: `src/features/linter/grammar/client-first.grammar.ts`.

The current parser simply splits class names on hyphens and assigns the
resulting tokens to `ParsedClass.tokens`. Client‑First custom classes,
however, use underscores (`_`) to separate the group (type) from the
element, and hyphens (`-`) to indicate variations. Utility classes never
contain underscores:contentReference[oaicite:0]{index=0}, while custom classes do:contentReference[oaicite:1]{index=1}. To
support this, introduce a more sophisticated tokenizer:

```ts
import type {
  GrammarAdapter,
  ParsedClass,
} from "@/features/linter/model/linter.types";

/**
 * Normalises a Client‑First custom class by replacing hyphens with
 * underscores.  This allows us to split on a single delimiter for
 * type/variation/element extraction.  Utility and combo classes are
 * returned early.
 */
function parseClientFirstCustom(name: string): ParsedClass {
  // Replace hyphens with underscores to normalise variation segments
  const normalised = name.replace(/-/g, "_");
  const segments = normalised.split("_").filter(Boolean);
  const result: ParsedClass = { raw: name, kind: "custom", tokens: segments };

  // The first token is the group/type (e.g. `team-list` → `team-list`)
  result.type = segments[0];
  // Variations are any tokens except the first and last when more than two exist
  if (segments.length > 2) {
    // Join variation segments back with underscores to preserve hyphen context
    result.variation = segments.slice(1, -1).join("_") || undefined;
  }
  // The last segment is considered the element token (e.g. `wrapper`)
  if (segments.length >= 2) {
    result.elementToken = segments[segments.length - 1];
  }
  return result;
}

export const clientFirstGrammar: GrammarAdapter = {
  id: "client-first",
  isCustomFirstRequired: true,
  utilityPrefix: "u-",
  componentPrefix: "c-",
  comboPrefix: "is-",
  parse(name: string): ParsedClass {
    // Determine the kind using prefixes
    if (name.startsWith("u-"))
      return { raw: name, kind: "utility" } as ParsedClass;
    if (name.startsWith("c-"))
      return { raw: name, kind: "component" } as ParsedClass;
    if (name.startsWith("is-"))
      return { raw: name, kind: "combo" } as ParsedClass;
    // Default to custom and parse via our helper
    return parseClientFirstCustom(name);
  },
};
```

````

This function reuses the existing discriminated `ParsedClass` type and
maintains type safety. It also ensures that variations are preserved with
underscores, which will be important when writing rules to validate
variation placement.

## 2. Role resolver extension

File to update: `src/features/linter/roles/client-first.roles.ts`.

The resolver maps a parsed class to an `ElementRole`. Client‑First’s
core structure (page wrapper, main wrapper, sections, containers and
padding wrappers) should be recognised so that context‑aware rules can
operate correctly. Update the resolver as follows:

```ts
import type {
  RoleResolver,
  ParsedClass,
  ElementRole,
} from "@/features/linter/model/linter.types";

const toRole = (token: string): ElementRole => {
  const t = token.toLowerCase();
  if (t === "wrap" || t === "wrapper") return "componentRoot";
  if (t.startsWith("section")) return "layout";
  if (t.startsWith("page") || t.startsWith("main")) return "layout";
  if (t.startsWith("container")) return "container";
  if (t.startsWith("padding")) return "container";
  // existing mappings for content, title, text etc.
  if (["layout", "content"].includes(t)) return t as ElementRole;
  if (["title", "heading", "header"].includes(t)) return "title";
  if (["text", "paragraph", "rich-text"].includes(t)) return "text";
  if (["actions", "buttons"].includes(t)) return "actions";
  if (["button", "btn"].includes(t)) return "button";
  if (t === "link") return "link";
  if (t === "icon") return "icon";
  if (["list", "collection-list"].includes(t)) return "list";
  if (["item", "collection-item", "li"].includes(t)) return "item";
  return "unknown";
};

export const clientFirstRoles: RoleResolver = {
  id: "client-first",
  mapToRole(parsed: ParsedClass): ElementRole {
    if (parsed.kind !== "custom") return "unknown";
    return toRole(parsed.elementToken ?? "");
  },
  isContainerLike(parsed: ParsedClass): boolean {
    const token = (parsed.elementToken ?? "").toLowerCase();
    return (
      token === "wrap" ||
      token === "wrapper" ||
      token.startsWith("container") ||
      token.startsWith("section") ||
      token.startsWith("page") ||
      token.startsWith("main") ||
      token.startsWith("padding")
    );
  },
};
```

By recognising `section-*`, `container-*`, and padding wrappers, context rules
can distinguish between root containers and inner groups.

## 3. New rules

Create new rule files under `src/rules/naming` or `src/rules/context-aware` as
appropriate. All rule objects should implement the `NamingRule` or
`PropertyRule` interface from `rule.types.ts`. Use factory functions
wherever possible to allow for dependency injection (e.g. passing in
configuration or utils). Below are examples of some proposed rules.

### 3.1 Custom class structure rule

File: `src/rules/naming/cf-custom-class-structure.ts`

This rule validates that custom class names follow the
“group_variation_element” pattern: underscores separate the group and
element, hyphens (converted to underscores in the parser) represent
variations, and no underscores appear in utility classes.

```ts
import type {
  NamingRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

export const cfCustomClassStructureRule: NamingRule = {
  id: "cf-custom-class-structure",
  name: "Client‑First: Custom Class Structure",
  description:
    "Custom classes must use an underscore to separate group and element; hyphens denote variations only.",
  example: "team-list_headshot-wrapper, section-hero_heading-title",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["custom"],
  test(name: string) {
    // Quick pass: must contain at least one underscore
    return name.includes("_");
  },
  evaluate(name: string): RuleResult | null {
    const hasUnderscore = name.includes("_");
    const hasDoubleUnderscore = /__/.test(name);
    const hasTrailingUnderscore = name.endsWith("_");
    const hasLeadingUnderscore = name.startsWith("_");
    // Reject if no underscore, multiple underscores together, or leading/trailing
    if (
      !hasUnderscore ||
      hasDoubleUnderscore ||
      hasLeadingUnderscore ||
      hasTrailingUnderscore
    ) {
      return {
        ruleId: "cf-custom-class-structure",
        name: "Client‑First: Custom Class Structure",
        message:
          "Custom classes must separate group and element with a single underscore and may contain hyphenated variations.",
        severity: "warning",
        className: name,
        isCombo: false,
      };
    }
    return null;
  },
};
```

### 3.2 Variant usage rule

File: `src/rules/naming/cf-variant-usage.ts`

This rule ensures that `is-` classes are always stacked on top of a base
class, as the Client‑First docs specify that variants (`is-*`) work only
when combined with base classes.

```ts
import type {
  NamingRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

export interface ComboContext {
  /**
   * Full list of classes on the element.  Provided by the rule runner via
   * dependency injection.
   */
  classList: string[];
}

export const createVariantUsageRule = (ctx: ComboContext): NamingRule => {
  return {
    id: "cf-variant-usage",
    name: "Client‑First: Variant Usage",
    description:
      "Combo classes starting with is- must be applied after a base class.",
    example: "button is-primary (valid), is-primary (invalid)",
    type: "naming",
    severity: "warning",
    enabled: true,
    category: "format",
    targetClassTypes: ["combo"],
    test(className: string) {
      return className.startsWith("is-");
    },
    evaluate(className: string): RuleResult | null {
      // Check if the variant is the first or only class in the class list
      const index = ctx.classList.indexOf(className);
      if (index === 0 || ctx.classList.length === 1) {
        return {
          ruleId: "cf-variant-usage",
          name: "Client‑First: Variant Usage",
          message: "Variant classes (is-*) must be stacked after a base class.",
          severity: "warning",
          className,
          isCombo: true,
        };
      }
      return null;
    },
  };
};
```

To inject the `classList` context, extend the rule runner to pass the
element’s full class list to factory functions. A simple approach is to
augment `runRulesOnStylesWithContext` so that it calls factory rules with
`{ classList: stylesWithElement.styleNames }`.

### 3.3 Stack depth rule

File: `src/rules/naming/cf-limit-stack-depth.ts`

This rule warns when an element contains more than a configurable number
of classes, encouraging developers to avoid deep stacking.

```ts
import type {
  NamingRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

export const createLimitStackDepthRule = (maxDepth = 3): NamingRule => ({
  id: "cf-limit-stack-depth",
  name: "Client‑First: Limit Stack Depth",
  description: `Warn when an element has more than ${maxDepth} classes (excluding presets).`,
  example: "btn is-primary text-large display-flex (4 classes)",
  type: "naming",
  severity: "suggestion",
  enabled: true,
  category: "performance",
  targetClassTypes: ["custom", "utility", "combo"],
  test: () => true,
  evaluate: (_className: string, classList: string[]): RuleResult | null => {
    if (classList.length > maxDepth) {
      return {
        ruleId: "cf-limit-stack-depth",
        name: "Client‑First: Limit Stack Depth",
        message: `Avoid stacking more than ${maxDepth} classes; consider creating a custom class instead.`,
        severity: "suggestion",
        className: classList.join(" "),
        isCombo: false,
      };
    }
    return null;
  },
});
```

### 3.4 Clean container rule

File: `src/rules/context-aware/cf-clean-container.ts`

This context‑aware rule ensures that container classes (e.g. `container-small`)
are not combined with spacing utilities such as `padding-*` or `margin-*`. The
docs recommend decoupling padding from containers.

Use the helper `createContextAwarePropertyRule` from
`src/features/linter/utils/context-rule-helpers.ts`:

```ts
import { createContextAwarePropertyRule } from "@/features/linter/utils/context-rule-helpers";
import type {
  PropertyRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

export const cfCleanContainerRule: PropertyRule =
  createContextAwarePropertyRule({
    id: "cf-clean-container",
    name: "Client‑First: Clean Containers",
    description:
      "Do not apply spacing utilities to container-* classes; add spacing to an inner wrapper instead.",
    example:
      "container-large padding-medium ➜ move padding-medium to a wrapper inside the container",
    context: "container",
    category: "semantics",
    severity: "warning",
    targetClassTypes: ["utility"],
    analyze: (className): RuleResult[] => {
      const issues: RuleResult[] = [];
      // If a container element includes padding- or margin- utilities, report it
      if (/^(padding|margin|spacer)-/.test(className)) {
        issues.push({
          ruleId: "cf-clean-container",
          name: "Client‑First: Clean Containers",
          message:
            "Containers should not carry spacing utilities; apply spacing on an inner wrapper.",
          severity: "warning",
          className,
          isCombo: false,
        });
      }
      return issues;
    },
  });
```

### 3.5 No utility padding on inner elements

File: `src/rules/context-aware/cf-no-padding-on-inner.ts`

The spacing strategy advises against applying `padding-*` utilities on inner
elements; instead, custom classes should carry inner padding. This
rule triggers when padding utilities are found on non‑root, non‑container
elements.

```ts
import { createContextAwarePropertyRule } from "@/features/linter/utils/context-rule-helpers";
import type {
  PropertyRule,
  RuleResult,
} from "@/features/linter/model/rule.types";

export const cfNoPaddingOnInnerRule: PropertyRule =
  createContextAwarePropertyRule({
    id: "cf-no-padding-on-inner",
    name: "Client‑First: Avoid Padding Utilities on Inner Elements",
    description:
      "Use custom classes for inner padding; avoid padding-* on nested elements.",
    example: "card_content padding-small ➜ move padding to card_content class",
    context: "childGroup",
    category: "format",
    severity: "suggestion",
    targetClassTypes: ["utility"],
    analyze(className) {
      const violations: RuleResult[] = [];
      if (className.startsWith("padding-")) {
        violations.push({
          ruleId: "cf-no-padding-on-inner",
          name: "Client‑First: Avoid Padding Utilities on Inner Elements",
          message:
            "Avoid padding-* utilities on inner elements; use a custom class instead.",
          severity: "suggestion",
          className,
          isCombo: false,
        });
      }
      return violations;
    },
  });
```

Add additional rules as required (e.g. descriptive naming heuristics or
general‑to‑specific order checks) following the same pattern.

## 4. Update the preset

File to modify: `src/presets/client-first.preset.ts`.

Import the new grammar, roles and rules at the top and add them to the
`rules` array. Also, update `contextConfig` to recognise Client‑First’s
core structure:

```ts
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";
import { clientFirstRoles } from "@/features/linter/roles/client-first.roles";
import {
  cfCustomClassStructureRule,
  cfVariantIsPrefixRule,
  cfUnknownUtilityFamilyRule,
  // …other existing rules
} from "@/rules/naming";
import {
  cfCleanContainerRule,
  cfNoPaddingOnInnerRule,
  // …other context‑aware rules
} from "@/rules/context-aware";

export const clientFirstPreset = {
  id: "client-first",
  grammar: clientFirstGrammar,
  roles: clientFirstRoles,
  // Configure the element context classifier to match Client‑First structure
  contextConfig: {
    wrapSuffix: "_wrap",
    // Recognise page, main, section, container and padding wrappers
    parentClassPatterns: [
      "section_contain",
      /^u-section/,
      /^c-/,
      /^page_(wrapper|main)/,
      /^main_wrapper/,
      /^section_/,
      /^container-/,
      /^padding-(global|section)/,
    ],
    requireDirectParentContainerForRoot: true,
    childGroupRequiresSharedTypePrefix: true,
    typePrefixSeparator: "_",
    // Allow hyphens inside the group token
    groupNamePattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    childGroupPrefixJoiner: "_",
  },
  rules: [
    // naming rules
    cfCustomClassStructureRule,
    cfVariantIsPrefixRule,
    cfUnknownUtilityFamilyRule,
    // new naming rules
    // factory‑created rules must be instantiated here, injecting dependencies
    // (e.g. class lists) via the rule runner
    // …
    // context‑aware rules
    cfNoUtilitiesOnRootRule,
    cfInnerWrapperRecommendedRule,
    cfContainersCleanRule,
    cfCleanContainerRule,
    cfNoPaddingOnInnerRule,
    // …other new rules
  ],
} as const;
```

Be sure to add imports for the new rule files and remove any unused imports.
Because factory‑created rules (e.g. `createVariantUsageRule`) need access to
the current class list, you may need to extend `rule-runner.ts` to detect
when a rule is a function and call it with the appropriate context.

## 5. Testing

For each new module, add corresponding tests under
`src/features/linter/grammar/__tests__/`, `src/features/linter/roles/__tests__/`
and `src/rules/__tests__/`. Example:

```ts
// src/features/linter/grammar/__tests__/client-first-enhanced.grammar.test.ts
import { describe, it, expect } from "vitest";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";

describe("clientFirstGrammar", () => {
  it("parses group, variation and element correctly", () => {
    const parsed = clientFirstGrammar.parse(
      "team-list_primary_headshot-wrapper"
    );
    expect(parsed.kind).toBe("custom");
    expect(parsed.type).toBe("team-list");
    expect(parsed.variation).toBe("primary");
    expect(parsed.elementToken).toBe("wrapper");
  });
});
```

Replicate this pattern for the role resolver and each rule. Snapshot tests
can be added to `src/features/linter/services/__tests__/` to stabilise
violation messages. Ensure all tests pass with `pnpm exec vitest`.

## 6. Conclusion

Following this guide will transform the Client‑First preset from a minimal
example into a comprehensive linter that aligns with Finsweet’s official
guidelines. By enhancing the grammar and role resolver, adding focused
rules and tuning the context configuration, FlowLint can prevent
inconsistent naming, misuse of utilities and structural mistakes. Use
factory functions for injectable rules and adhere to strict typing to
maintain code quality. Once implemented, run the development server
(`pnpm dev`) and test the preset in the Designer Extension UI, then run
`pnpm exec vitest` to ensure parity with the automated tests.
````
