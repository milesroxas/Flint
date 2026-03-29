# Linting and Type Checking

This project uses a combination of **Biome** (for linting and formatting) and **TypeScript** (for type checking) to ensure code quality.

## Why Both Tools?

- **Biome**: Fast linter and formatter that catches code style issues, potential bugs, and enforces best practices
- **TypeScript**: Type checker that catches type errors and ensures compatibility with target ES versions

**Important**: Biome does NOT check TypeScript compilation errors or ES version compatibility. You must run both tools to catch all issues.

## Available Commands

### Individual Commands

```bash
# Run Biome linter only
pnpm lint

# Run Biome linter and auto-fix issues
pnpm lint:fix

# Run TypeScript type checking only
pnpm typecheck

# Format code with Biome
pnpm format
```

### Combined Command (Recommended)

```bash
# Run both TypeScript type checking AND Biome linting
pnpm lint:all
```

**Best Practice**: Always run `pnpm lint:all` before committing or building to catch both type errors and linting issues.

## Biome Configuration

Rules live in `biome.json` (`recommended: true` plus project overrides). Notable overrides include **noNonNullAssertion** (error), **noPrototypeBuiltins** (error), **noUnusedVariables** (error), **useExhaustiveDependencies** (warn on React hooks), and **useTemplate** (error). See the file for the full set.

## Common issues

- Prefer `key in obj` over `Object.hasOwn()` if targeting the project’s ES version.
- Avoid `!`; narrow with `if` / early `continue` instead (including `array.shift()` / `queue.shift()` in loops).

## CI

Use `pnpm lint:all` in pipelines so typecheck and Biome both run.

## Editor

The Biome VS Code extension picks up `biome.json`; enable format on save if you want auto-format on save.
