/**
 * Format Webflow style property values for lint messages.
 * Variable bindings are objects `{ id: "variable-..." }`; prefer human-readable names when provided.
 */

export function isWebflowVariableRef(value: unknown): value is { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string" &&
    String((value as { id: string }).id).startsWith("variable-")
  );
}

/**
 * @param variableNameById - From Designer API (`getAllVariables` / `getName()`), keyed by variable id
 */
export function formatStyleValueForLint(value: unknown, variableNameById?: ReadonlyMap<string, string>): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (isWebflowVariableRef(value)) {
    const name = variableNameById?.get(value.id);
    if (name) return name;
    return value.id;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
