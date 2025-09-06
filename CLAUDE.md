# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Server
```bash
pnpm dev
```
Use the printed URL as your Webflow "Development URL" in the Designer extension settings.

### Building
```bash
# Development bundle
pnpm build:dev

# Production bundle  
pnpm build:prod
```
Both commands create timestamped bundle.zip files in respective `bundle/` subdirectories.

### Testing
```bash
# Run all tests
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Watch mode
pnpm test:watch

# Run specific test suites
pnpm test:structure
pnpm test:class-order
```

### Code Quality
```bash
# Lint code
pnpm lint
```

## Architecture Overview

This is a React + Vite Webflow Designer Extension that provides real-time CSS class linting with preset-driven rules (Lumos, Client-first). The architecture follows a modular feature-based structure with clear separation of concerns.

### Core Architecture Concepts

**Service Architecture**: The linter uses a centralized context service (`lint-context.service.ts`) that provides intelligent caching and eliminates redundancy. This service creates a unified `LintContext` containing all necessary data (styles, element relationships, roles, etc.) for rule execution.

**Preset System**: Rules are organized into presets (`lumos.preset.ts`, `client-first.preset.ts`) that define grammar parsers, role detectors, and rule collections. Each preset provides:
- Grammar adapter for parsing class names
- Role detection logic for element classification
- Collection of validation rules

**Element Graph & Relationships**: The system builds an element graph (`element-graph.service.ts`) and parent-child relationships for structural analysis. This enables context-aware validation that considers element hierarchy.

**Rule Types**: Rules are categorized by scope:
- **Element rules**: Validate individual elements and their classes
- **Page rules**: Validate page-wide concerns (duplicates, structure)
- **Naming rules**: Validate class naming conventions
- **Property rules**: Validate CSS property usage

### Key Modules

**Linter Core** (`src/features/linter/`):
- `services/`: Core linting services including context management, rule execution, and caching
- `rules/`: Validation rules organized by preset (lumos/, client-first/, canonical/, shared/)
- `model/`: Type definitions and interfaces
- `grammar/`: Class name parsing adapters per preset
- `presets/`: Preset configurations that bundle rules, grammars, and detectors

**Entity Services** (`src/entities/`):
- `element/`: Element graph construction and relationship mapping
- `style/`: Style fetching, caching, and property analysis

**UI Components** (`src/features/linter/ui/`):
- `violations/`: Displays linting results with intelligent color coding
- `controls/`: User controls (preset switching, filtering, mode toggles)
- `expanded/`: Detailed violation views with structural context

### Webflow API Integration

The extension integrates defensively with Webflow Designer APIs:
- `getAllElements()`, `getAllStyles()`, `getStyles()` for data fetching
- `setSelectedElement()` for element highlighting
- `style.isComboClass()` for combo class detection with heuristic fallback
- Path alias `@/*` maps to `src/*`

### State Management

Uses Zustand stores for:
- `pageLint.store.ts`: Page-level linting state
- `elementLint.store.ts`: Element-level linting state  
- `expandedView.store.ts`: UI expansion state
- `animation.store.ts`: UI animation controls

### Class Type Detection

The system categorizes classes as:
- **Custom**: User-defined semantic classes (e.g., `hero_title`)
- **Utility**: Single-property helpers (e.g., `text-center`)  
- **Combo**: Webflow's grouped utility classes detected via API + heuristics

### Performance Features

- Intelligent caching with signature-based invalidation
- Redundancy elimination in context service (57% code reduction)
- Lightweight page context caching for performance
- Structural context scoping to reduce analysis overhead

## Testing Structure

Tests are co-located with source code in `__tests__/` directories:
- Unit tests for individual rules and services
- Parity tests ensuring rule consistency
- Snapshot tests for message output validation

When writing tests, follow the existing patterns in `src/features/linter/rules/lumos/composition/__tests__/` and similar directories.

## Important Notes

- Always run `pnpm lint` after making changes to ensure code quality
- The linter UI entry point is `src/features/linter/view/LinterPanel.tsx`
- Message formatting uses intelligent color coding system (`message-formatter.ts`)
- Context service centralizes bootstrap logic - avoid recreating context unnecessarily
- Page mode uses caching for performance - element mode creates focused contexts