# Factory Function Refactor

This README documents the refactoring of our linter services from class-based architecture to factory function patterns, following modern TypeScript best practices for 2025.

## Overview

We've converted all service classes to factory functions while maintaining 100% identical functionality. This refactor improves testability, follows modern functional programming patterns, and provides better dependency injection capabilities.

## Refactored Services

### 1. StyleService

**Before:** `StyleService` class  
**After:** `createStyleService()` factory function

### 2. RuleConfigurationService

**Before:** `RuleConfigurationService` class  
**After:** `createRuleConfigurationService()` factory function

### 3. RuleRunner

**Before:** `RuleRunner` class  
**After:** `createRuleRunner()` factory function

### 4. RuleRegistry

**Before:** `RuleRegistry` class  
**After:** `createRuleRegistry()` factory function

### 5. UtilityClassAnalyzer

**Before:** `UtilityClassAnalyzer` class  
**After:** `createUtilityClassAnalyzer()` factory function

### 6. LocalStorageAdapter

**Before:** `LocalStorageAdapter` class  
**After:** `createLocalStorageAdapter()` factory function

## Migration Guide

### StyleService

```typescript
// Before
const styleService = new StyleService();
await styleService.getAllStylesWithProperties();

// After
const styleService = createStyleService();
await styleService.getAllStylesWithProperties();
```

### RuleConfigurationService

```typescript
// Before
const configService = new RuleConfigurationService(ruleRegistry);
// or with custom adapter
const configService = new RuleConfigurationService(ruleRegistry, customAdapter);

// After
const configService = createRuleConfigurationService(ruleRegistry);
// or with custom adapter
const configService = createRuleConfigurationService(
  ruleRegistry,
  customAdapter
);
```

### RuleRunner

```typescript
// Before
const ruleRunner = new RuleRunner(ruleRegistry, utilityAnalyzer);
const results = ruleRunner.runRulesOnStyles(styles);

// After
const ruleRunner = createRuleRunner(ruleRegistry, utilityAnalyzer);
const results = ruleRunner.runRulesOnStyles(styles);
```

### RuleRegistry

```typescript
// Before
const ruleRegistry = new RuleRegistry();
ruleRegistry.registerRules(defaultRules);

// After
const ruleRegistry = createRuleRegistry();
ruleRegistry.registerRules(defaultRules);
```

### UtilityClassAnalyzer

```typescript
// Before
const utilityAnalyzer = new UtilityClassAnalyzer();
utilityAnalyzer.buildPropertyMaps(allStyles);

// After
const utilityAnalyzer = createUtilityClassAnalyzer();
utilityAnalyzer.buildPropertyMaps(allStyles);
```

## Updated Store Implementation

The Zustand store now uses factory functions consistently:

```typescript
// src/features/linter/store/usePageLintStore.ts
import { createStyleService } from "@/features/linter/services/style-service";
import { createRuleRunner } from "@/features/linter/services/rule-runner";
import { createRuleRegistry } from "@/features/linter/services/rule-registry";
import { createUtilityClassAnalyzer } from "@/features/linter/services/utility-class-analyzer";

// Initialize services using factory functions
const styleService = createStyleService();
const utilityAnalyzer = createUtilityClassAnalyzer();
const ruleRegistry = createRuleRegistry();
ruleRegistry.registerRules(defaultRules);
const ruleRunner = createRuleRunner(ruleRegistry, utilityAnalyzer);
const pageLintService = createPageLintService(styleService, ruleRunner);
```

## Architecture Benefits

### 1. **Improved Testability**

Factory functions make it easier to mock dependencies and test individual functions:

```typescript
// Easy to mock individual functions
const mockRuleRegistry = {
  getAllRules: jest.fn(() => []),
  getRuleConfiguration: jest.fn(() => undefined),
  // ... other methods
};

const ruleRunner = createRuleRunner(mockRuleRegistry, mockUtilityAnalyzer);
```

### 2. **Better Functional Programming**

- No shared mutable state in classes
- Pure functions where possible
- Easier to reason about data flow
- More aligned with modern JavaScript/TypeScript practices

### 3. **Consistent Dependency Injection**

All services use the same dependency injection pattern:

```typescript
// All services follow the same pattern
const serviceA = createServiceA(dependency1, dependency2);
const serviceB = createServiceB(serviceA, dependency3);
```

### 4. **Type Safety**

Each factory function exports its return type for proper TypeScript intellisense:

```typescript
export type StyleService = ReturnType<typeof createStyleService>;
export type RuleRunner = ReturnType<typeof createRuleRunner>;
// etc.
```

### 5. **Performance**

- No performance overhead compared to classes
- Closures provide encapsulation without class instantiation costs
- Same memory usage patterns

## Key Design Decisions

### Closure-Based Encapsulation

We use closures to maintain private state instead of private class fields:

```typescript
export const createService = (dependency: Dependency) => {
  // Private state captured in closure
  const privateState = new Map();

  // Internal functions
  const internalHelper = () => {
    /* ... */
  };

  // Public API
  const publicMethod = () => {
    /* can access privateState and internalHelper */
  };

  return {
    publicMethod,
  } as const;
};
```

### Dependency Injection Preserved

All services maintain the same dependency injection patterns:

```typescript
// Optional dependencies with defaults
const createServiceWithOptionalDep = (
  required: Required,
  optional?: Optional
) => {
  const dependency = optional ?? createDefaultDependency();
  // ...
};

// Required dependencies
const createServiceWithRequiredDeps = (dep1: Dep1, dep2: Dep2) => {
  // ...
};
```

### Immutable Return Objects

All factory functions return immutable objects using `as const`:

```typescript
return {
  method1,
  method2,
  method3,
} as const;
```

## Migration Checklist

- [x] Convert `StyleService` to factory function
- [x] Convert `RuleConfigurationService` to factory function
- [x] Convert `RuleRunner` to factory function
- [x] Convert `RuleRegistry` to factory function
- [x] Convert `UtilityClassAnalyzer` to factory function
- [x] Convert `LocalStorageAdapter` to factory function
- [x] Update store to use factory functions
- [x] Ensure all TypeScript types are properly exported
- [x] Verify all dependency injection works correctly

## Testing

The factory function pattern makes testing significantly easier:

```typescript
describe("RuleRunner", () => {
  it("should execute rules correctly", () => {
    const mockRegistry = createMockRuleRegistry();
    const mockAnalyzer = createMockUtilityAnalyzer();

    const ruleRunner = createRuleRunner(mockRegistry, mockAnalyzer);
    const results = ruleRunner.runRulesOnStyles(mockStyles);

    expect(results).toEqual(expectedResults);
  });
});
```

## Backward Compatibility

The public APIs remain completely unchanged. Existing code only needs to update the instantiation pattern from `new Class()` to `createClass()`.

## Future Considerations

This factory function architecture provides a solid foundation for:

- Better tree-shaking in bundlers
- Easier migration to other state management patterns
- Simplified dependency injection for testing
- More functional programming patterns as the codebase evolves

## TypeScript Benefits

- **Strict typing**: All factory functions are fully typed
- **Intellisense**: Return types provide proper autocomplete
- **Type inference**: `as const` ensures precise type inference
- **No type erasure**: Factory functions preserve all type information

The refactor maintains the exact same functionality while modernizing the architecture for better maintainability and testability.
