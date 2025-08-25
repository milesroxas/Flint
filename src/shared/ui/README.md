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
