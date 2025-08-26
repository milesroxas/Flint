# Shared UI Components

This directory contains reusable UI components that are shared across the application. These components follow consistent design patterns and use the application's design tokens.

## Badge Component

The `Badge` component is a versatile, accessible badge element with enhanced color coding for lint messages and other content.

### Enhanced Color Variants

The Badge component now includes specialized variants for the enhanced message color coding system:

#### **Core Variants**

- `default` - Primary brand color with hover states
- `secondary` - Secondary background with muted text
- `destructive` - Error/danger styling
- `outline` - Bordered variant with hover effects
- `error` - Standard error styling
- `warning` - Warning styling
- `suggestion` - Suggestion/info styling

#### **Property Variants**

- `inheritedProperty` - For inherited CSS properties
- `newProperty` - For new CSS properties

#### **🎨 Enhanced Message Color Variants** ✨

- `webflowClass` - **Webflow blue** (`oklch(0.45 0.214 259.815)`) for class names
- `errorContent` - **Orange-red** (`oklch(0.55 0.18 15)`) for error content
- `suggestionContent` - **Green** (`oklch(0.50 0.14 145)`) for suggestions
- `dynamicProperty` - **Purple** (`oklch(0.52 0.12 290)`) for dynamic placeholders

#### **Special Features**

- `isCombo` - Special styling for combo classes
- `copyable` - Adds copy functionality with visual feedback

### Usage Examples

```tsx
// Webflow class styling
<Badge variant="webflowClass">component_wrap</Badge>

// Error content highlighting
<Badge variant="errorContent">component_error</Badge>

// Suggestion content
<Badge variant="suggestionContent">component_group_[element]_wrap</Badge>

// Dynamic property
<Badge variant="dynamicProperty">[element]</Badge>

// Copyable badge
<Badge variant="webflowClass" copyable>copyable_class_name</Badge>
```

### Props

```tsx
interface BadgeProps {
  variant?: BadgeVariant;
  isCombo?: boolean;
  copyable?: boolean;
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
}
```

## Other Components

- `accordion.tsx` - Collapsible content sections
- `button.tsx` - Button component with variants
- `card.tsx` - Card container component
- `collapsible.tsx` - Simple collapsible content
- `dropdown-menu.tsx` - Dropdown menu component
- `scroll-area.tsx` - Custom scrollable area
- `severity-button.tsx` - Severity-specific button styling
- `tabs.tsx` - Tab navigation component
- `theme-toggle.tsx` - Theme switching component

## Design System Integration

All components use the application's design tokens defined in `src/styles/globals.css`:

- **Color tokens**: Primary, secondary, error, warning, suggestion
- **Enhanced message colors**: Webflow blue, error content, suggestion content, dynamic properties
- **Spacing**: Consistent padding, margins, and gaps
- **Typography**: Unified font sizes and weights
- **Borders**: Consistent border radius and styles

## Accessibility Features

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast support

## Performance Considerations

- Optimized re-renders with React.memo where appropriate
- Efficient state management
- Minimal DOM manipulation
- CSS-in-JS with class-variance-authority for optimal bundle size

# UI Animation System

This document outlines the comprehensive animation system used throughout the application, including timing, easing curves, and animation patterns.

## Core Animation Principles

### 1. **Performance-First Approach**

- Uses CSS transitions and transforms for hardware acceleration
- Leverages `will-change` property strategically
- Implements `requestAnimationFrame` for JavaScript-based animations
- Avoids layout thrashing by using transform and opacity

### 2. **Consistent Timing System**

- **Fast interactions**: 200-300ms (buttons, toggles, micro-interactions)
- **Standard transitions**: 300-500ms (hover states, content changes)
- **Content animations**: 500-700ms (section reveals, page transitions)
- **Complex sequences**: 700ms+ (multi-phase animations)

### 3. **Easing Curve System**

Three standardized easing curves provide consistent motion across the application:

#### **Ease-Gentle** (`cubic-bezier(0.4, 0, 0.2, 1)`)

- **Use case**: Subtle, natural-feeling transitions
- **Examples**: Hover states, color changes, opacity transitions
- **Duration**: 300-500ms
- **CSS class**: `.ease-gentle`

#### **Ease-Spring** (`cubic-bezier(0.16, 1, 0.3, 1)`)

- **Use case**: Bouncy, energetic animations with overshoot
- **Examples**: Content reveals, entrance animations, emphasis
- **Duration**: 500-700ms
- **CSS class**: `.ease-spring`

#### **Ease-Smooth** (`cubic-bezier(0.25, 0.1, 0.25, 1)`)

- **Use case**: Balanced, professional transitions
- **Examples**: Page transitions, modal animations
- **Duration**: 300-600ms
- **CSS class**: `.ease-smooth`

## Animation Categories

### 1. **Micro-Interactions (200-300ms)**

```tsx
// Button hover effects
className = "transition-all duration-200 ease-out";

// Icon transforms
className = "transition-transform duration-200 ease-out group-hover:scale-110";

// Quick state changes
className = "transition-colors duration-200 ease-out";
```

### 2. **Standard Transitions (300-500ms)**

```tsx
// Severity button animations
className = "transition-all duration-300 ease-gentle";

// Content reveals
className = "transition-all duration-500 ease-gentle";

// Hover states
className = "transition-all duration-300 ease-out";
```

### 3. **Content Animations (500-700ms)**

```tsx
// Section reveals
className = "transition-all duration-700 ease-spring";

// Violation items
className = "transition-all duration-700 ease-spring";

// Action bar entrance
className = "transition-all duration-700 ease-out";
```

### 4. **Complex Sequences (700ms+)**

```tsx
// Multi-phase linting animations
// Phase 1: Severity tiles appear (500ms)
// Phase 2: Count animations (800ms)
// Phase 3: Violations reveal (700ms)
```

## Animation Patterns

### 1. **Staggered Animations**

```tsx
// Violation items with 80ms stagger
animationDelay={animationDelay + index * 80}

// Severity counts with 150ms stagger
staggerDelay={150}
```

### 2. **State-Based Animations**

```tsx
// Conditional animation triggers
className={cn(
  "transition-all duration-300 ease-gentle",
  shouldAnimateCount && "animate-count-up"
)}

// State change detection
useEffect(() => {
  if (prevState !== currentState) {
    setIsAnimating(true);
    setPrevState(currentState);
  }
}, [currentState, prevState]);
```

### 3. **Transform-Based Animations**

```tsx
// Slide up from below
className={cn(
  "transition-all duration-500 ease-gentle",
  isVisible
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-2"
)}

// Scale effects
className={cn(
  "transition-all duration-300 ease-out",
  isAnimating && "scale-105"
)}
```

### 4. **Opacity + Transform Combinations**

```tsx
// Fade in with slide up
className = "animate-fade-in"; // 600ms ease-gentle

// Slide up with spring
className = "animate-slide-up"; // 700ms ease-spring

// Count up with scale
className = "animate-count-up"; // 800ms ease-gentle
```

## CSS Animation Utilities

### **Built-in Keyframes**

```css
/* Fade in with slight upward movement */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide up with spring-like motion */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale animation for emphasis */
@keyframes count-up {
  from {
    transform: scale(0.95);
  }
  to {
    transform: scale(1);
  }
}
```

### **Animation Classes**

```css
.animate-fade-in {
  animation: fade-in 600ms var(--ease-gentle) forwards;
}

.animate-slide-up {
  animation: slide-up 700ms var(--ease-spring) forwards;
}

.animate-count-up {
  animation: count-up 800ms var(--ease-gentle) forwards;
}
```

## JavaScript Animation Patterns

### 1. **Count-Up Animation**

```tsx
// 60fps count-up with completion callback
const animate = () => {
  currentCount += increment;
  if (currentCount >= count) {
    setAnimatedCount(count);
    onCountAnimationComplete?.();
  } else {
    setAnimatedCount(Math.floor(currentCount));
    requestAnimationFrame(animate);
  }
};
```

### 2. **Staggered Delays**

```tsx
// Sequential animation triggers
if (staggerDelay > 0) {
  const timer = setTimeout(startAnimation, staggerDelay);
  return () => clearTimeout(timer);
} else {
  startAnimation();
}
```

### 3. **Animation State Management**

```tsx
// Zustand store for complex animation sequences
const useAnimationStore = create<AnimationState>()(
  devtools((set, get) => ({
    isLinting: false,
    severityTilesVisible: false,
    severityCountsAnimating: false,
    severityAnimationComplete: false,
    violationsVisible: false,

    startLinting: () => set({ isLinting: true /* ... */ }),
    showSeverityTiles: () => set({ severityTilesVisible: true /* ... */ }),
    // ... more phase transitions
  }))
);
```

## Best Practices

### 1. **Performance**

- Use `transform` and `opacity` for animations
- Apply `will-change` only when needed
- Leverage `requestAnimationFrame` for JS animations
- Avoid animating layout-triggering properties

### 2. **Accessibility**

- Respect `prefers-reduced-motion` (to be implemented)
- Provide alternative states for motion-sensitive users
- Ensure animations don't interfere with focus management

### 3. **Consistency**

- Use predefined easing curves and durations
- Maintain consistent stagger delays (80ms for lists, 150ms for groups)
- Apply animation patterns consistently across similar components

### 4. **User Experience**

- Keep micro-interactions under 300ms
- Use spring easing for content reveals to add personality
- Implement proper animation completion callbacks
- Avoid animation conflicts by managing state carefully

## Implementation Examples

### **Severity Button Animation**

```tsx
// Multi-phase animation with count-up effect
<SeverityButton
  severity="error"
  count={displayCounts.error}
  shouldStartCounting={severityCountsAnimating}
  staggerDelay={0}
  onCountAnimationComplete={handleCountAnimationComplete}
/>
```

### **Violation Item Stagger**

```tsx
// Staggered reveal with spring easing
<ViolationItem
  key={getItemId(violation, index)}
  violation={violation}
  animationDelay={animationDelay + index * 80}
  shouldAnimate={isVisible}
/>
```

### **Conditional Animation States**

```tsx
// State-based animation triggers
className={cn(
  "transition-all duration-500 ease-gentle",
  severityTilesVisible
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-2"
)}
```

This animation system provides a cohesive, performant, and delightful user experience while maintaining consistency across all components and interactions.
