# Presets Directory Structure

This directory contains preset configurations for the linter. Each preset is self-contained and defines its own rules, grammar, role detection, and element categorization.

## Current Structure

```
presets/
├── README.md                    # This file
├── index.ts                     # Auto-discovery and exports
├── lumos.preset.ts             # Lumos preset configuration
├── client-first.preset.ts      # Client-First preset configuration
└── [future-preset].preset.ts   # Future presets
```

## Future Scalable Structure

As the application grows, each preset can have its own directory:

```
presets/
├── README.md
├── index.ts
├── lumos/
│   ├── preset.ts               # Main preset export
│   ├── lib/                    # Preset-specific utilities
│   │   ├── validators.ts       # Custom validation logic
│   │   ├── transformers.ts     # Class name transformers
│   │   └── helpers.ts          # Helper functions
│   ├── types.ts                # Preset-specific types
│   └── config/                 # Configuration files
│       ├── elements.ts         # Element categorization
│       └── examples.ts         # Usage examples
├── client-first/
│   ├── preset.ts
│   ├── lib/
│   └── ...
└── my-custom-preset/
    ├── preset.ts
    ├── lib/
    └── ...
```

## Adding a New Preset

### Simple Approach (Current)

1. Create `my-preset.preset.ts` in this directory
2. Export preset configuration with `elementsConfig`
3. The auto-discovery system will pick it up automatically

### Scalable Approach (Future)

1. Create `my-preset/` directory
2. Create `my-preset/preset.ts` with main configuration
3. Add `my-preset/lib/` for preset-specific utilities
4. Update `index.ts` to include the new directory structure

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
  elementsConfig: myPresetElementsConfig,
  rules: [
    // ... preset rules
  ],
};
```

## Benefits of This Structure

1. **Self-contained**: Each preset owns its configuration
2. **Discoverable**: Auto-discovery means no manual registration
3. **Extensible**: Easy to add preset-specific utilities
4. **Maintainable**: Clear ownership and separation of concerns
5. **Type-safe**: Full TypeScript support with proper interfaces

## Migration Path

The current flat structure supports immediate needs. When complexity grows:

1. Presets can be migrated to directories individually
2. The service layer remains unchanged (discovers configurations automatically)
3. No breaking changes to existing functionality
