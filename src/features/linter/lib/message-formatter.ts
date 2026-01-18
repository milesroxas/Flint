import React from "react";
import { Badge } from "@/shared/ui/badge";

/**
 * Formats violation messages by wrapping different content types with appropriate color-coded badges.
 * This enhances visual hierarchy and maintains your product design style.
 */
export const formatViolationMessage = (message: string): React.ReactNode => {
  // Pre-analyze the message to identify content types by their positions
  const contentAnalysis = analyzeMessageContent(message);

  // Enhanced pattern to match quoted content and detect content type
  const quotedContentPattern = /"([^"]+)"/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  let match: RegExpExecArray | null = quotedContentPattern.exec(message);
  while (match !== null) {
    const [fullMatch, content] = match;
    const startIndex = match.index;

    // Add text before the match
    if (startIndex > lastIndex) {
      parts.push(message.slice(lastIndex, startIndex));
    }

    // Get the variant from our pre-analysis
    const variant = (contentAnalysis[matchIndex] as any) || "inheritedProperty";

    parts.push(
      React.createElement(
        Badge,
        {
          key: `content-${startIndex}`,
          variant,
          className: "inline-flex mx-1 text-[10px] px-1 py-0.5",
        },
        content
      )
    );

    lastIndex = startIndex + fullMatch.length;
    matchIndex++;
    match = quotedContentPattern.exec(message);
  }

  // Add remaining text after the last match
  if (lastIndex < message.length) {
    parts.push(message.slice(lastIndex));
  }

  return parts.length > 0 ? parts : message;
};

/**
 * Pre-analyzes the entire message to determine content types based on message patterns
 */
function analyzeMessageContent(message: string): string[] {
  const variants: string[] = [];
  const quotedContentPattern = /"([^"]+)"/g;
  const matches: Array<{ content: string; index: number }> = [];

  let match: RegExpExecArray | null = quotedContentPattern.exec(message);
  while (match !== null) {
    matches.push({ content: match[1], index: match.index });
    match = quotedContentPattern.exec(message);
  }

  // Analyze each match based on message patterns
  matches.forEach((matchData, index) => {
    const { content } = matchData;

    // Check for dynamic property patterns first
    if (isDynamicProperty(content)) {
      variants.push("dynamicProperty");
      return;
    }

    // Analyze the message structure for specific patterns
    const variant = analyzeContentByMessageStructure(message, content, index, matches.length);
    variants.push(variant);
  });

  return variants;
}

/**
 * Analyzes content based on specific message structure patterns
 */
function analyzeContentByMessageStructure(
  message: string,
  content: string,
  matchIndex: number,
  totalMatches: number
): "webflowClass" | "errorContent" | "suggestionContent" | "dynamicProperty" | "inheritedProperty" | "propertyName" {
  // If message clearly refers to a CSS property, style it as a property name
  // Example: Property "background-color" uses hardcoded color "#FF0000".
  if (/^Property\s+"[^"]+"/i.test(message) && matchIndex === 0) {
    return "propertyName";
  }

  // Detect well-known CSS property names and treat them as properties, not classes
  if (isCssPropertyName(content)) {
    return "propertyName";
  }
  // Handle "Child group key X does not match root key Y. Rename to Z." pattern
  if (message.includes("Child group key") && message.includes("does not match") && message.includes("Rename to")) {
    if (matchIndex === 0) {
      // First quoted item is the error content
      return "errorContent";
    } else if (matchIndex === 1) {
      // Second quoted item is the reference webflow class
      return "webflowClass";
    } else if (matchIndex === 2) {
      // Third quoted item (after "Rename to") is the suggestion
      return "suggestionContent";
    }
  }

  // Handle other common patterns
  if (message.toLowerCase().includes("rename to") && matchIndex === totalMatches - 1) {
    // Last quoted item after "rename to" is likely a suggestion
    return "suggestionContent";
  }

  if (message.toLowerCase().includes("does not match") && matchIndex === 0) {
    // First quoted item in a "does not match" message is likely error content
    return "errorContent";
  }

  // Check if it's a webflow class by pattern
  if (isWebflowClassName(content)) {
    return "webflowClass";
  }

  return "inheritedProperty";
}

/**
 * Detects if content appears to be a Webflow class name
 */
function isWebflowClassName(content: string): boolean {
  // Common Webflow class patterns
  const webflowPatterns = [
    /^[a-z]+_[a-z_]+$/, // Lumos pattern: component_element, component_variant_element
    /^[a-z]+-[a-z-]+$/, // Client-First pattern: component-element
    /^page_/, // Page-level classes
    /^section_/, // Section classes
    /^component_/, // Component classes
    /^hero_/, // Hero classes
    /^nav_/, // Navigation classes
    /^footer_/, // Footer classes
    /_wrap$/, // Wrapper classes
    /_contain$/, // Container classes
    /_main$/, // Main classes
    /_content$/, // Content classes
  ];

  return webflowPatterns.some((pattern) => pattern.test(content));
}

/**
 * Detects dynamic property patterns like [element], {property}, etc.
 */
function isDynamicProperty(content: string): boolean {
  const dynamicPatterns = [
    /^\[.*\]$/, // [element], [variant], etc.
    /^\{.*\}$/, // {property}, {value}, etc.
    /^<.*>$/, // <name>, <variant>, etc.
    /^\$\{.*\}$/, // ${variable}, etc.
  ];

  return dynamicPatterns.some((pattern) => pattern.test(content));
}

/**
 * Detects common CSS property names to avoid misclassifying them as class names.
 * This is a lightweight heuristic; extend as needed.
 */
function isCssPropertyName(content: string): boolean {
  const commonProps = new Set<string>([
    "color",
    "background",
    "background-color",
    "border",
    "border-color",
    "outline-color",
    "text-decoration-color",
    "fill",
    "stroke",
  ]);

  if (commonProps.has(content)) return true;

  // Heuristic: lowercase kebab-case without underscores and without spaces
  // e.g., background-color, border-top-color
  if (/^[a-z][a-z0-9-]*$/.test(content) && content.includes("-")) {
    return true;
  }

  return false;
}
