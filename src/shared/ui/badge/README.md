# Badge Component

The Badge component provides a flexible, accessible way to display small pieces of information with consistent styling and animations.

## Variants

### **Default Variants**

- `default` - Primary badge with primary colors
- `secondary` - Secondary badge with muted colors
- `destructive` - Error/danger badge with destructive colors
- `outline` - Outlined badge with border
- `error` - Error severity badge
- `warning` - Warning severity badge
- `suggestion` - Suggestion/info severity badge

### **Specialized Variants**

- `inheritedProperty` - For displaying inherited CSS properties
- `newProperty` - For displaying new CSS properties
- `webflowClass` - For Webflow class names (primary styling)
- `webflowClassMuted` - For Webflow class names (muted styling)
- `errorContent` - For error content areas
- `suggestionContent` - For suggestion content areas
- `dynamicProperty` - For dynamic CSS properties

## Props

### **Core Props**

- `variant` - Badge variant (see above)
- `className` - Additional CSS classes
- `children` - Badge content
- `asChild` - Render as different element using Radix Slot

### **Special Props**

- `isCombo` - **DEPRECATED**: This prop overrides variant styling with combo-specific colors
- `copyable` - Enables copy-to-clipboard functionality with visual feedback

## Styling System

### **Base Styling**

```css
.inline-flex items-center justify-center leading-none rounded-xs
px-2 py-0.5 my-0.5 text-xs font-medium w-fit min-w-0 max-w-full gap-1
[&>svg]:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px]
transition-colors overflow-hidden
```

### **Variant Styling**

Each variant has its own color scheme using CSS custom properties:

```css
/* Example: webflowClass variant */
.webflowClass {
  background-color: var(--color-webflow-class);
  color: var(--color-webflow-class-foreground);
}

.webflowClass:hover {
  background-color: var(--color-webflow-class-hover);
}

.webflowClass:active {
  background-color: var(--color-webflow-class-active);
}
```

### **Combo Styling (DEPRECATED)**

⚠️ **Warning**: The `isCombo` prop overrides variant styling with:

```css
.isCombo[data-state="true"] {
  background-color: rgb(var(--accent) / 0.1);
  color: hsl(var(--foreground));
  font-size: 0.75rem;
  border-radius: 0.125rem;
}
```

**This breaks the design system and should not be used.**

## Usage Examples

### **Basic Badge**

```tsx
<Badge variant="webflowClass">hero_wrap</Badge>
```

### **Copyable Badge**

```tsx
<Badge variant="webflowClass" copyable>
  is-active
</Badge>
```

### **Inherited Property Badge**

```tsx
<Badge
  variant="inheritedProperty"
  className="break-words whitespace-normal font-normal text-xs"
>
  <span>
    <strong>color:</strong> inherit
  </span>
</Badge>
```

### **Webflow Class Badge (Recommended)**

```tsx
<Badge
  variant="webflowClass"
  className="whitespace-normal break-words max-w-full"
>
  <span className="text-left flex items-center">
    <code className="font-mono text-xs font-normal break-all">{className}</code>
  </span>
</Badge>
```

## Copy Functionality

When `copyable={true}`, the badge:

- Shows a copy icon on hover
- Copies text content to clipboard on click
- Provides visual feedback (checkmark on success, error icon on failure)
- Falls back to `document.execCommand` if clipboard API unavailable

## Accessibility

- Proper focus management with `focus-visible:ring`
- Screen reader support for copy functionality
- Semantic button behavior when copyable
- High contrast ratios maintained across all variants

## Best Practices

### **DO**

- Use `webflowClass` variant for class names
- Use `webflowClassMuted` for secondary class information
- Apply appropriate `className` for layout adjustments
- Use `copyable` for class names that users might want to copy

### **DON'T**

- Use `isCombo` prop (deprecated, breaks design system)
- Mix variants with custom colors
- Override core styling without good reason
- Use for large amounts of text

## Migration from isCombo

If you were using `isCombo={true}`, replace with:

```tsx
// OLD (deprecated)
<Badge isCombo={true} variant="webflowClass">
  {className}
</Badge>

// NEW (recommended)
<Badge variant="webflowClass">
  {className}
</Badge>
```

This ensures consistent styling with the design system and proper variant behavior.
