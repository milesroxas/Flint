import type {
  RuleResult,
  ExpandedViewCapability,
} from "@/features/linter/model/rule.types";

/**
 * Service for managing expanded view capabilities for rule violations.
 * Follows domain-driven design by encapsulating the logic for determining
 * what expanded content is available for a given violation.
 */
export class ExpandedViewCapabilitiesService {
  /**
   * Gets all available expanded view capabilities for a violation
   */
  getCapabilitiesForViolation(violation: RuleResult): ExpandedViewCapability[] {
    if (!violation.expandedViewCapabilities) {
      return [];
    }

    return violation.expandedViewCapabilities.filter((capability) => {
      // If no predicate is provided, assume it's always relevant
      if (!capability.isRelevantFor) {
        return true;
      }

      // Use the predicate to determine relevance
      return capability.isRelevantFor(violation);
    });
  }

  /**
   * Checks if a violation has any available expanded view capabilities
   */
  hasExpandedViewCapabilities(violation: RuleResult): boolean {
    return this.getCapabilitiesForViolation(violation).length > 0;
  }

  /**
   * Gets the primary (first) expanded view capability for a violation
   */
  getPrimaryCapability(violation: RuleResult): ExpandedViewCapability | null {
    const capabilities = this.getCapabilitiesForViolation(violation);
    return capabilities.length > 0 ? capabilities[0] : null;
  }

  /**
   * Checks if any violations in a list have expanded view capabilities
   */
  hasAnyExpandedViewCapabilities(violations: RuleResult[]): boolean {
    return violations.some((violation) =>
      this.hasExpandedViewCapabilities(violation)
    );
  }
}

// Singleton instance
export const expandedViewCapabilitiesService =
  new ExpandedViewCapabilitiesService();
