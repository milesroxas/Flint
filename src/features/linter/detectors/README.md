# Canonical Role Detection (Detectors + Grammar)

This guide explains how roles `main`, `section`, `componentRoot`, and `childGroup` are detected using preset-aware detectors, how ancestry context enables intelligent scoring, and how rules consume the detected roles.

## Overview

The role detection system implements a sophisticated, preset-agnostic approach to understanding page structure:

- **Grammar-adapted parsing** per preset via `GrammarAdapter`
- **Small, composable detectors** emit role candidates with confidence scores (0-1)
- **Context-rich signals** via `DetectionContext` (ancestry, tags, element graph)
- **Thresholding and singleton enforcement** for reliable role assignment

Key types: `src/features/linter/model/preset.types.ts`, `src/features/linter/model/linter.types.ts`

## Detection Pipeline

### 1. Service Integration

Page and element lint services build inputs and invoke role detection:

```typescript
// src/features/linter/services/page-lint-service.ts
const roleDetection = createRoleDetectionService({
  detectors: [...roleDetectors],
  config: roleDetectionConfig,
});
rolesByElement = roleDetection.detectRolesForPage(elementsWithClassNames);
```

### 2. Role Detection Service

**File**: `src/features/linter/services/role-detection.service.ts`

The service constructs ancestry-aware snapshots and executes detectors:

```typescript
interface ElementSnapshot {
  readonly id: string;
  readonly tagName: string;
  readonly classes: readonly string[];
  readonly parentId: string | null;
  readonly childrenIds: readonly string[];
  readonly attributes: Readonly<Record<string, string>>;
}

interface DetectionContext {
  readonly allElements: readonly ElementSnapshot[];
  readonly styleInfo: readonly {
    className: string;
    properties: Record<string, unknown>;
  }[];
  readonly pageInfo: { title?: string; url?: string };
}
```

**Process**:

1. Builds parent/children indexes from element hierarchy
2. Creates stable `ElementSnapshot[]` with normalized element data
3. Provides full `DetectionContext.allElements` to each detector for ancestry analysis
4. Applies score thresholding (default: 0.6) and enforces singleton `main`

### 3. Detector Execution & Scoring

Each detector returns `{ role, score }` or `null`. The highest-scoring role ≥ threshold wins:

```typescript
interface RoleDetector {
  readonly id: string;
  readonly description?: string;
  detect(
    element: ElementSnapshot,
    context: DetectionContext
  ): RoleDetectionResult | null;
}

interface RoleDetectionResult {
  readonly role: ElementRole;
  readonly score: number; // 0-1 range
  readonly reasoning?: string;
}
```

## Lumos Detectors (Context-Rich)

**File**: `src/features/linter/detectors/lumos.detectors.ts`

### Main Detection

Strong naming signal with tag fallback:

```typescript
{
  id: "lumos-main-detector",
  detect: (element: ElementSnapshot, _context: DetectionContext) => {
    // Strong: Lumos page_main class
    if (element.classes?.some((n) => n === "page_main")) {
      return { role: "main", score: 0.95 };
    }
    // Soft: HTML5 semantic tag
    if (element.tagName?.toLowerCase() === "main") {
      return { role: "main", score: 0.6 };
    }
    return null;
  },
}
```

### Section Detection

Semantic tags and custom base patterns:

```typescript
{
  id: "lumos-section-detector",
  detect: (element: ElementSnapshot, _context: DetectionContext) => {
    const tag = element.tagName?.toLowerCase();
    if (tag === "section") return { role: "section", score: 0.7 };

    // Lumos custom base naming: section_* (not utilities)
    if (element.classes?.some((n) => /^section_/.test(n))) {
      return { role: "section", score: 0.9 };
    }
    return null;
  },
}
```

### Wrapper Detection (componentRoot vs childGroup)

Advanced classification using grammar parsing and ancestry context:

```typescript
{
  id: "lumos-wrapper-detector",
  detect: (element: ElementSnapshot, context: DetectionContext) => {
    // 1. Grammar-aware base selection
    const parsedCustoms = (element.classes ?? [])
      .map((n) => lumosGrammar.parse(n))
      .filter((p) => p.kind === "custom");
    const preferred = parsedCustoms.find((p) => !!p.elementToken)?.raw;
    const base = preferred ?? pickFallbackBase(element.classes);

    // 2. Classify wrapper type using heuristics
    const role = classifyWrapName(base); // "componentRoot" | "childGroup" | null
    if (!role) return null;

    // 3. Context-aware ancestry scoring
    const ancestors = buildAncestorChain(element, context.allElements);
    const ancestorHasSection = ancestors.some(a =>
      a.tagName?.toLowerCase() === "section" ||
      a.classes?.some(c => /^section_/.test(c))
    );

    // 4. Score adjustment based on structural context
    let score = role === "componentRoot" ? 0.9 : 0.86;
    if (role === "componentRoot") {
      score = ancestorHasSection
        ? Math.min(1, score + 0.05)      // Promote when properly nested
        : Math.max(0.55, score - 0.2);   // Demote when orphaned
    } else {
      score = ancestorHasSection ? Math.min(1, score + 0.02) : score;
    }

    return { role, score };
  },
}
```

### Smart Fallback Logic

Grammar-aware base class selection:

```typescript
function pickFallbackBase(classNames: readonly string[]): string {
  // Prefer proper Lumos custom base:
  // - Contains underscores for token separation
  // - Not utility (u-*), component (c-*), or combo (is-*)
  // - Has multiple tokens (type + element minimum)
  const lumosCustom = classNames.find((n) => {
    if (!n.includes("_")) return false;
    if (n.startsWith("u-") || n.startsWith("c-") || n.startsWith("is-"))
      return false;
    const tokens = n.split("_").filter(Boolean);
    return tokens.length >= 2;
  });

  return (
    lumosCustom ??
    classNames.find((n) => n.includes("_")) ??
    classNames[0] ??
    ""
  );
}
```

### Wrapper Classification

Intelligent heuristics for component structure:

```typescript
const SUBPART_HINTS = new Set([
  "inner",
  "content",
  "media",
  "image",
  "grid",
  "list",
  "item",
  "header",
  "footer",
  "title",
  "subtitle",
  "copy",
  "desc",
  "meta",
  "actions",
  "links",
  "buttons",
  "button",
  "badge",
  "cta",
]);

function classifyWrapName(name: string): "componentRoot" | "childGroup" | null {
  if (!/(?:^|[_-])(wrap|wrapper)$/i.test(name)) return null;

  const tokens = name.split(/[_-]+/).filter(Boolean);
  const base =
    tokens[tokens.length - 1] === "wrap" ||
    tokens[tokens.length - 1] === "wrapper"
      ? tokens.slice(0, -1)
      : tokens;

  const tail = base[base.length - 1]?.toLowerCase();
  const looksChild = base.length >= 3 || SUBPART_HINTS.has(tail);
  return looksChild ? "childGroup" : "componentRoot";
}
```

## Client-First Detectors

**File**: `src/features/linter/detectors/client-first.detectors.ts`

### Main Detection

```typescript
{
  id: "client-first-main-detector",
  detect: (element: ElementSnapshot, _context: DetectionContext) => {
    const hit = element.classes.find(
      (n) => n === "main-wrapper" || /^main_/.test(n)
    );
    if (hit) return { role: "main", score: 0.95 };
    return null;
  },
}
```

### Section Detection

```typescript
{
  id: "client-first-section-detector",
  detect: (element: ElementSnapshot, _context: DetectionContext) => {
    const hit = element.classes.find((n) => /^section[_-]/.test(n));
    if (hit) return { role: "section", score: 0.85 };
    return null;
  },
}
```

### Context-Aware Wrapper Detection

Recently enhanced with full ancestry support:

```typescript
{
  id: "client-first-wrapper-detector",
  detect: (element: ElementSnapshot, context: DetectionContext) => {
    const firstClass = element.classes[0];
    if (!firstClass || !endsWithWrap(firstClass)) return null;

    // Token-based classification
    const tokenCount = firstClass.split(/[_-]/).filter(Boolean).length;
    const role = tokenCount >= 3 ? "childGroup" : "componentRoot";

    // Ancestry context analysis (similar to Lumos)
    const ancestors = buildAncestorChain(element, context.allElements);
    const ancestorHasSection = ancestors.some((a) => {
      const tag = (a.tagName ?? "").toLowerCase();
      if (tag === "section") return true;
      return (a.classes ?? []).some((c) => /^section[_-]/.test(c));
    });

    // Context-aware score adjustment
    let score = role === "componentRoot" ? 0.72 : 0.7;
    if (role === "componentRoot") {
      score = ancestorHasSection
        ? Math.min(1, score + 0.05)      // Promote under sections
        : Math.max(0.55, score - 0.15);  // Demote when orphaned
    } else {
      score = ancestorHasSection ? Math.min(1, score + 0.02) : score;
    }

    return { role, score };
  },
}
```

## Grammar Adapters

Grammar adapters provide preset-specific class parsing for intelligent base selection.

### Lumos Grammar

**File**: `src/features/linter/grammar/lumos.grammar.ts`

```typescript
export const lumosGrammar: GrammarAdapter = {
  id: "lumos",
  isCustomFirstRequired: true,
  utilityPrefix: "u-",
  componentPrefix: "c-",
  comboPrefix: "is-",
  parse(name: string): ParsedClass {
    const kind = getClassType(name);
    if (kind !== "custom") return { raw: name, kind };

    // Parse custom: type_[variation_]element
    const tokens = name.split("_").filter(Boolean);
    return {
      raw: name,
      kind: "custom",
      tokens,
      type: tokens[0],
      variation: tokens.length > 2 ? tokens.slice(1, -1).join("_") : undefined,
      elementToken: tokens.length >= 2 ? tokens[tokens.length - 1] : undefined,
    };
  },
};
```

### Client-First Grammar

**File**: `src/features/linter/grammar/client-first.grammar.ts`

```typescript
export const clientFirstGrammar: GrammarAdapter = {
  id: "client-first",
  parse(name: string): ParsedClass {
    // Normalize kebab-case to underscore for consistent token parsing
    const normalized = name.replace(/-/g, "_");
    const tokens = normalized.split("_").filter(Boolean);
    return {
      raw: name,
      kind: getClassType(name),
      tokens,
      type: tokens[0],
      variation: tokens.length > 2 ? tokens.slice(1, -1).join("_") : undefined,
      elementToken: tokens.length >= 2 ? tokens[tokens.length - 1] : undefined,
    };
  },
};
```

## Configuration & Thresholds

### Default Configuration

```typescript
const DEFAULT_CONFIG: RoleDetectionConfig = { threshold: 0.6 };
```

### Preset-Specific Overrides

```typescript
// In preset definition
const lumosPreset: Preset = {
  id: "lumos",
  grammar: lumosGrammar,
  roleDetectors: lumosRoleDetectors,
  roleDetectionConfig: {
    threshold: 0.65, // Slightly higher for Lumos precision
    fallbackRole: "unknown",
  },
  rules: [
    /* ... */
  ],
};
```

### Singleton Main Enforcement

After all detectors run, only the highest-scoring `main` remains:

```typescript
// In role-detection.service.ts
const mainCandidates = Object.entries(scoresByElement)
  .filter(([, v]) => v.role === "main")
  .map(([elId, v]) => ({ elId, score: v.best }));

if (mainCandidates.length > 1) {
  const winner = mainCandidates.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  mainCandidates.forEach((candidate) => {
    result[candidate.elId] =
      candidate.elId === winner.elId ? "main" : "unknown";
  });
}
```

## How Rules Consume Roles

### Canonical Page Rules

Rules receive `rolesByElement` map and use it for structural validation:

```typescript
// src/features/linter/rules/canonical/main-children.page.ts
export const mainChildrenPageRule: PageRule = {
  id: "main-children-page",
  description: "Main element should contain sections or component roots",

  checkPage: (context: PageRuleContext) => {
    const { rolesByElement, getChildrenIds } = context;

    // Find the main element
    const mainElementId = Object.entries(rolesByElement).find(
      ([, role]) => role === "main"
    )?.[0];

    if (!mainElementId) return []; // No main found

    // BFS search for sections or component roots
    const hasValidChildren = breadthFirstSearch(
      mainElementId,
      getChildrenIds,
      (id) =>
        ["section", "componentRoot"].includes(rolesByElement[id] ?? "unknown")
    );

    return hasValidChildren
      ? []
      : [
          {
            elementId: mainElementId,
            severity: "error" as const,
            message:
              "Main element should contain at least one section or component root",
          },
        ];
  },
};
```

### Element-Scope Rules

```typescript
// Using roles in element rules
export const componentRootStructureRule: ElementRule = {
  id: "component-root-structure",
  checkElement: (context: ElementRuleContext) => {
    const { elementId, rolesByElement, getChildrenIds } = context;
    const role = rolesByElement[elementId];

    if (role !== "componentRoot") return [];

    const children = getChildrenIds(elementId);
    const hasContent = children.some((childId) =>
      ["childGroup", "content", "layout"].includes(
        rolesByElement[childId] ?? "unknown"
      )
    );

    return hasContent
      ? []
      : [
          {
            elementId,
            severity: "warning" as const,
            message:
              "Component root should contain layout, content, or child groups",
          },
        ];
  },
};
```

## Performance & Optimization

### Caching Strategy

Role detection results are cached using page signatures:

```typescript
// In page-lint-service.ts
const sig = signatureFor(elementStylePairs, parentIdByChildId);
let rolesByElement: RolesByElement;

if (rolesCacheSignature === sig && cachedRolesByElement) {
  rolesByElement = cachedRolesByElement; // Cache hit
} else {
  const roleDetection = createRoleDetectionService({
    detectors: [...roleDetectors],
    config: roleDetectionConfig,
  });
  rolesByElement = roleDetection.detectRolesForPage(elementsWithClassNames);
  rolesCacheSignature = sig;
  cachedRolesByElement = rolesByElement; // Cache update
}
```

### Performance Budgets

- **Page scan**: ≤ 250ms for ~500 elements
- **Element scan**: ≤ 80ms for single element analysis
- **Detector execution**: Non-blocking with graceful error handling

## Tuning & Extension

### Adding New Detectors

```typescript
const customDetector: RoleDetector = {
  id: "my-custom-detector",
  description: "Detects custom role patterns",
  detect: (element: ElementSnapshot, context: DetectionContext) => {
    // Your detection logic
    if (meetsCriteria(element)) {
      return { role: "customRole", score: 0.8 };
    }
    return null;
  },
};

// Add to preset
const customPreset: Preset = {
  id: "custom",
  roleDetectors: [...existingDetectors, customDetector],
  // ...
};
```

### Best Practices

1. **Use ancestry context** via `DetectionContext.allElements` for intelligent scoring
2. **Prefer grammar parsing** over ad-hoc string matching when possible
3. **Keep detectors focused** - return `null` when uncertain so other detectors can contribute
4. **Score meaningfully** - use the full 0-1 range with contextual adjustments
5. **Handle errors gracefully** - detector failures should not break the pipeline

### Debugging

Enable debug logging to trace detector execution:

```typescript
// Development mode logging
console.log(
  `[DEBUG] Detector ${detector.id} scored ${scored?.score} for role ${scored?.role}`
);
```

## Related Documentation

- **PRD**: `docs/guides/prd-canonical-roles.md` - Product requirements and vision
- **Services**: `src/features/linter/services/README.md` - Service architecture overview
- **Rules**: `src/features/linter/rules/README.md` - Rule implementation patterns
- **Types**: `src/features/linter/model/preset.types.ts` - Core type definitions
- **ADRs**: `docs/adrs/adr-025-canonical-roles-detection-and-page-rules.md` - Architectural decisions
