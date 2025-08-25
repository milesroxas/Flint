# Linter Library Functions

This directory contains utility functions and services that support the linter functionality.

## Enhanced Message Formatter ✨

The `message-formatter.ts` provides intelligent message formatting with automatic color coding for improved readability.

### Overview

The enhanced message formatter analyzes violation messages to automatically detect content types and apply appropriate color coding. This creates clear visual hierarchy and maintains your product design style.

### How It Works

1. **Pre-analysis**: Analyzes the entire message to understand its structure
2. **Pattern Recognition**: Identifies specific message patterns like "Child group key X does not match root key Y. Rename to Z"
3. **Smart Color Assignment**: Applies colors based on position and content type within the message
4. **Badge Generation**: Creates appropriately colored badges for each quoted content section

### Color Coding System

| Content Type             | Color         | Badge Variant       | Use Case                                    |
| ------------------------ | ------------- | ------------------- | ------------------------------------------- |
| **Webflow Class**        | 🔵 Blue       | `webflowClass`      | Class names, component references           |
| **Error Content**        | 🔴 Orange-red | `errorContent`      | Problematic values, violations              |
| **Suggestion Content**   | 🟢 Green      | `suggestionContent` | Recommended fixes, actions                  |
| **Dynamic Properties**   | 🟣 Purple     | `dynamicProperty`   | Placeholders like `[element]`, `{property}` |
| **Inherited Properties** | ⚪ Default    | `inheritedProperty` | Fallback for other content                  |

### Message Pattern Examples

#### Child Group Key Pattern

```
"Child group key component_error does not match root key component_group. Rename to component_group_[element]_wrap."
```

**Color Assignment:**

- `component_error` → **Error Content** (orange-red) - First quoted item
- `component_group` → **Webflow Class** (blue) - Second quoted item
- `component_group_[element]_wrap` → **Suggestion Content** (green) - Third quoted item

#### Generic Rename Pattern

```
"Consider renaming to new_class_name"
```

**Color Assignment:**

- `new_class_name` → **Suggestion Content** (green) - Appears after "rename to"

### API Reference

#### `formatViolationMessage(message: string): React.ReactNode`

Formats a violation message by wrapping quoted content with appropriately colored badges.

**Parameters:**

- `message`: The violation message string

**Returns:**

- React node with formatted message and color-coded badges

**Example:**

```typescript
import { formatViolationMessage } from "@/features/linter/lib/message-formatter";

const formattedMessage = formatViolationMessage(
  'Child group key "component_error" does not match root key "component_group". Rename to "component_group_[element]_wrap".'
);
```

### Pattern Detection

The formatter recognizes these message patterns:

- **"Child group key X does not match root key Y. Rename to Z"** - Canonical child group pattern
- **"X does not match Y"** - Generic mismatch patterns
- **"Rename to X"** - Suggestion patterns
- **Dynamic content** - Placeholders like `[element]`, `{property}`, `<name>`

### Technical Implementation

- **Structure-first approach**: Analyzes message structure before applying colors
- **Position-based logic**: Uses match index within the message for reliable color assignment
- **Fallback handling**: Gracefully handles unknown patterns with default styling
- **Performance optimized**: Single pass through the message with efficient regex matching

### Integration

The message formatter is automatically used by:

- `ViolationMessage` component for plain text messages
- `ViolationDetails` component for detailed violation information
- All violation display components throughout the UI

### Customization

To add new message patterns:

1. Update the `analyzeContentByMessageStructure` function
2. Add new pattern detection logic
3. Define appropriate color assignments
4. Test with sample messages

### Benefits

- **Improved Readability**: Clear visual distinction between different content types
- **Consistent Design**: Maintains your product's design language
- **Accessibility**: Better contrast and visual hierarchy
- **Maintainability**: Centralized color logic with easy pattern extension
- **User Experience**: Users can quickly identify errors, suggestions, and references

## Other Library Functions

- `color-utils.ts` - Color utility functions for consistent styling
- `labels.ts` - Centralized label management for roles and contexts
- `message-parser.ts` - Parses duplicate property messages
- `string-normalization.ts` - String normalization utilities
