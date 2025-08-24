import React from "react";
import { Badge } from "@/shared/ui/badge";

/**
 * Formats violation messages by wrapping property names and values with badges.
 * This makes them stand out better while maintaining readability.
 */
export const formatViolationMessage = (message: string): React.ReactNode => {
  // Pattern to match property names and values in quotes
  const propertyPattern = /"([^"]+)"/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = propertyPattern.exec(message)) !== null) {
    const [fullMatch, content] = match;
    const startIndex = match.index;

    // Add text before the match
    if (startIndex > lastIndex) {
      parts.push(message.slice(lastIndex, startIndex));
    }

    // Add the property/value as a badge
    const badge = React.createElement(Badge, {
      key: `property-${startIndex}`,
      variant: "inheritedProperty",
      className: "inline-flex mx-1 text-[10px] px-1 py-0.5",
      children: content,
    });

    parts.push(badge);
    lastIndex = startIndex + fullMatch.length;
  }

  // Add remaining text after the last match
  if (lastIndex < message.length) {
    parts.push(message.slice(lastIndex));
  }

  return parts.length > 0 ? parts : message;
};
