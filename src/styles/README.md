# CSS Animation System

This document outlines the comprehensive CSS animation system, including custom properties, easing curves, keyframes, and utility classes.

## Custom Properties

### **Easing Curves**

```css
/* Modern easing curves using CSS custom properties */
@property --ease-spring {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@property --ease-gentle {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}
```

### **Easing Values**

```css
:root {
  /* Spring easing - bouncy, energetic with overshoot */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);

  /* Gentle easing - subtle, natural transitions */
  --ease-gentle: cubic-bezier(0.4, 0, 0.2, 1);

  /* Smooth easing - balanced, professional */
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

## Easing Utility Classes

### **Base Easing Classes**

```css
/* Apply easing curves to transitions */
.ease-spring {
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

.ease-gentle {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.ease-smooth {
  transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

### **Usage Examples**

```css
/* Spring easing for content reveals */
.content-reveal {
  transition: all 700ms ease-spring;
}

/* Gentle easing for hover states */
.button-hover {
  transition: all 300ms ease-gentle;
}

/* Smooth easing for page transitions */
.page-transition {
  transition: all 500ms ease-smooth;
}
```

## Keyframe Animations

### **Fade In Animation**

```css
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

.animate-fade-in {
  animation: fade-in 600ms var(--ease-gentle, cubic-bezier(0.4, 0, 0.2, 1)) forwards;
}
```

**Use Case**: Subtle entrance animations with slight upward movement
**Duration**: 600ms
**Easing**: `ease-gentle`
**Properties**: Opacity + translateY transform

### **Slide Up Animation**

```css
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

.animate-slide-up {
  animation: slide-up 700ms var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1)) forwards;
}
```

**Use Case**: Content reveals with spring-like motion
**Duration**: 700ms
**Easing**: `ease-spring`
**Properties**: Opacity + translateY transform (larger movement)

### **Count Up Animation**

```css
@keyframes count-up {
  from {
    transform: scale(0.95);
  }
  to {
    transform: scale(1);
  }
}

.animate-count-up {
  animation: count-up 800ms var(--ease-gentle, cubic-bezier(0.4, 0, 0.2, 1)) forwards;
}
```

**Use Case**: Emphasis animations for counting or highlighting
**Duration**: 800ms
**Easing**: `ease-gentle`
**Properties**: Scale transform only

## Duration Utilities

### **Custom Duration Classes**

```css
/* Extended duration utilities */
.duration-600 {
  transition-duration: 600ms;
}

.duration-700 {
  transition-duration: 700ms;
}

.duration-800 {
  transition-duration: 800ms;
}
```

### **Standard Tailwind Durations**

```css
/* Built-in Tailwind durations */
.duration-200 {
  transition-duration: 200ms;
} /* Micro-interactions */
.duration-300 {
  transition-duration: 300ms;
} /* Standard transitions */
.duration-500 {
  transition-duration: 500ms;
} /* Content changes */
.duration-700 {
  transition-duration: 700ms;
} /* Section reveals */
```

## Animation Patterns

### **1. Opacity + Transform Combinations**

```css
/* Fade in with slide up */
.fade-slide-up {
  transition: all 500ms ease-gentle;
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-up.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### **2. Scale + Opacity**

```css
/* Scale with fade */
.scale-fade {
  transition: all 300ms ease-gentle;
  opacity: 0;
  transform: scale(0.95);
}

.scale-fade.visible {
  opacity: 1;
  transform: scale(1);
}
```

### **3. Multi-Property Transitions**

```css
/* Complex transitions */
.complex-transition {
  transition: opacity 500ms ease-gentle, transform 500ms ease-spring,
    background-color 300ms ease-gentle;
}
```

## Performance Optimizations

### **Hardware Acceleration**

```css
/* Enable hardware acceleration */
.hardware-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* Optimize for animations */
.animation-optimized {
  will-change: transform, opacity;
  backface-visibility: hidden;
}
```

### **Layout Avoidance**

```css
/* Avoid layout-triggering properties */
.performance-friendly {
  /* ✅ Good - only transform and opacity */
  transition: transform 300ms ease-gentle, opacity 300ms ease-gentle;
}

.performance-unfriendly {
  /* ❌ Bad - triggers layout */
  transition: width 300ms ease-gentle, height 300ms ease-gentle;
}
```

## Responsive Animations

### **Media Query Adjustments**

```css
/* Reduce motion on smaller screens */
@media (max-width: 768px) {
  .animate-fade-in {
    animation-duration: 400ms; /* Faster on mobile */
  }

  .animate-slide-up {
    animation-duration: 500ms;
  }
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-up,
  .animate-count-up {
    animation: none;
    transition: none;
  }
}
```

## Component-Specific Animations

### **Button Animations**

```css
/* Button hover effects */
.button {
  transition: all 200ms ease-out;
}

.button:hover {
  transform: scale(1.05);
}

.button:active {
  transform: scale(0.98);
}
```

### **Card Animations**

```css
/* Card entrance animations */
.card {
  transition: all 500ms ease-gentle;
  opacity: 0;
  transform: translateY(16px);
}

.card.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### **Modal Animations**

```css
/* Modal entrance/exit */
.modal {
  transition: all 300ms ease-smooth;
}

.modal.entering {
  opacity: 0;
  transform: scale(0.9);
}

.modal.entered {
  opacity: 1;
  transform: scale(1);
}
```

## Debugging and Development

### **Animation Inspector**

```css
/* Debug animation timing */
.debug-animation {
  outline: 2px solid red;
  outline-offset: 2px;
}

/* Show transition properties */
.debug-transition {
  transition: all 0.1s linear !important;
}
```

### **Performance Monitoring**

```css
/* Monitor paint and layout */
.monitor-performance {
  will-change: auto;
  transform: translateZ(0);
}
```

## Best Practices

### **1. Timing Consistency**

- Use predefined easing curves
- Maintain consistent duration scales
- Apply appropriate timing for interaction type

### **2. Performance**

- Prefer `transform` and `opacity`
- Use `will-change` sparingly
- Avoid animating layout properties

### **3. Accessibility**

- Respect `prefers-reduced-motion`
- Provide alternative states
- Ensure animations don't interfere with focus

### **4. User Experience**

- Keep micro-interactions under 300ms
- Use spring easing for content reveals
- Implement proper completion states

## Integration with JavaScript

### **CSS-in-JS Patterns**

```tsx
// Dynamic animation classes
const animationClass = cn(
  "transition-all duration-500 ease-gentle",
  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
);

// Conditional animations
const conditionalAnimation = cn(
  "transition-all duration-300 ease-gentle",
  shouldAnimate && "animate-fade-in"
);
```

### **State-Based Animations**

```tsx
// React state for animation triggers
const [isAnimating, setIsAnimating] = useState(false);

// CSS classes based on state
className={cn(
  "transition-all duration-300 ease-out",
  isAnimating && "scale-105"
)}
```

This CSS animation system provides a comprehensive foundation for creating smooth, performant, and accessible animations throughout the application.
