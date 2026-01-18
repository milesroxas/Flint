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

The project uses strict Biome rules configured in `biome.json`:

### Key Rules Enabled

1. **noNonNullAssertion** (error): Prevents use of `!` non-null assertions
   - Forces proper null checks instead of assertions
   - Example: Use `if (value)` instead of `value!`

2. **noPrototypeBuiltins** (error): Prevents direct use of `Object.prototype` methods
   - Encourages use of `in` operator or modern alternatives
   - Example: Use `key in obj` instead of `Object.prototype.hasOwnProperty.call(obj, key)`

3. **noUnusedVariables** (error): Catches unused variables
   - Helps keep code clean and maintainable

4. **useExhaustiveDependencies** (warn): Checks React hook dependencies
   - Ensures useEffect/useMemo/useCallback have correct dependencies

5. **useTemplate** (error): Enforces template literals over string concatenation
   - Example: Use `` `Hello ${name}` `` instead of `"Hello " + name`

## Common Issues and Solutions

### Issue: `Object.hasOwn()` TypeScript Error

**Problem**: `Object.hasOwn()` is ES2022, but project targets ES2020

**Solution**: Use the `in` operator instead:
```typescript
// ❌ Bad (ES2022)
const hasKey = Object.hasOwn(obj, 'key');

// ✅ Good (ES2020 compatible)
const hasKey = 'key' in obj;
```

### Issue: Non-null Assertion Warning

**Problem**: Using `!` to assert non-null values

**Solution**: Use proper null checks:
```typescript
// ❌ Bad
const value = array.shift()!;

// ✅ Good
const value = array.shift();
if (value) {
  // use value safely
}
```

### Issue: Queue.shift() in Loops

**Problem**: `queue.shift()` can return `undefined`

**Solution**: Check for undefined:
```typescript
// ❌ Bad
while (queue.length > 0) {
  const item = queue.shift()!;
  process(item);
}

// ✅ Good
while (queue.length > 0) {
  const item = queue.shift();
  if (!item) continue;
  process(item);
}
```

## CI/CD Integration

For continuous integration, add this to your workflow:

```yaml
- name: Lint and Type Check
  run: pnpm lint:all
```

This ensures both TypeScript compilation and Biome linting pass before deployment.

## VS Code Integration

Install the Biome extension for real-time linting in VS Code:

1. Install "Biome" extension
2. Biome will automatically use the project's `biome.json` configuration
3. Enable "Format on Save" in VS Code settings for automatic formatting

## Pre-commit Hook (Optional)

Consider adding a pre-commit hook to run `pnpm lint:all`:

```bash
# .husky/pre-commit
#!/bin/sh
pnpm lint:all
```

This prevents committing code with linting or type errors.
