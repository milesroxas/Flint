export interface ParsedDuplicateMessage {
  intro: string
  properties: Array<{
    property: string
    value: string
    classes: string[]
  }>
}

export function parseDuplicateMessage(message: string): ParsedDuplicateMessage | null {
  if (!message.includes("duplicate properties:")) {
    return null
  }

  const [intro, propertiesSection] = message.split("duplicate properties:")
  if (!propertiesSection) return null

  const propertyParts = propertiesSection
    .replace(/\.\s*Consider consolidating\.$/, "")
    .split(";")
    .filter((part) => part.trim())

  const properties = propertyParts
    .map((part) => {
      const match = part.match(/^\s*([^:]+):(.*?)\s*\(also in:\s*(.*?)\)\s*$/)
      if (match) {
        const [, property, value, classes] = match
        return {
          property: property.trim(),
          value: value.trim(),
          classes: classes.split(",").map((c) => c.trim()),
        }
      }
      return null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return {
    intro: intro.trim(),
    properties,
  }
}


