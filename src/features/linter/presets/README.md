# Presets Directory Structure

This directory contains preset configurations for the linter. Each preset is self-contained and defines its own rules, grammar, role detection, and element categorization.

**To create or extend a preset:** See `docs/guides/extending-presets.md` (single source of truth).

## Current Structure

```
presets/
├── README.md                    # This file
├── index.ts                     # Auto-discovery and exports
├── lumos.preset.ts             # Lumos preset configuration
└── client-first.preset.ts      # Client-First preset configuration
```

## Preset Configuration

Each preset must export:

```typescript
import type { Preset } from "@/features/linter/model/preset.types";
import type { PresetElementsConfig } from "@/features/linter/model/preset-elements.types";

export const myPresetElementsConfig: PresetElementsConfig = {
  getElements: getMyPresetKnownElements,
  categoryMap: {
    layout: ["container", "wrapper"],
    content: ["text", "heading"],
    // ... other categories
  },
  separator: "-", // or "_"
  metadata: {
    displayName: "My Preset",
    description: "Description of naming convention",
  },
};

export const myPreset: Preset & {
  rules: Rule[];
  elementsConfig: PresetElementsConfig;
} = {
  id: "my-preset",
  grammar: myGrammar,
  roleDetectors: myRoleDetectors,
  roleDetectionConfig: { threshold: 0.6 },
  elementsConfig: myPresetElementsConfig,
  rules: [
    // ... preset rules
  ],
};
```

## Current Presets

### Lumos Preset

- **ID**: `lumos`
- **Separator**: `_` (underscore)
- **Grammar**: Lumos grammar with underscore-separated naming
- **Rules**: Naming, composition, and shared property/structure rules
- **Element Categories**: layout, content, media, interactive, structure, testing

### Client-First Preset

- **ID**: `client-first`
- **Separator**: `-` (hyphen)
- **Grammar**: Client-First grammar with kebab-case naming
- **Rules**: Naming and shared property/structure rules
- **Element Categories**: layout, content, components, media, utility

## Auto-Discovery System

The `index.ts` file automatically discovers and registers all preset files:

- Uses `import.meta.glob` to find all `*.preset.ts` files
- Validates each export against the `Preset` interface
- Provides helper functions: `getAllPresets()`, `getPresetById()`, `getDefaultPresetId()`
- Default preset is Lumos when available, otherwise first available preset

## Adding a New Preset

1. Create `my-preset.preset.ts` in this directory
2. Export preset configuration with `elementsConfig`
3. The auto-discovery system will pick it up automatically
4. Ensure your preset follows the required interface structure

## Benefits of This Structure

1. **Self-contained**: Each preset owns its configuration
2. **Discoverable**: Auto-discovery means no manual registration
3. **Type-safe**: Full TypeScript support with proper interfaces
4. **Maintainable**: Clear ownership and separation of concerns
5. **Extensible**: Easy to add new presets without modifying existing code
