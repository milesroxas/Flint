// Alternative singleton pattern for better performance
import {
  createLinterServices,
  type LinterServices,
} from "./linter-service-factory";

let servicesSingleton: LinterServices | null = null;

/**
 * Get shared linter services instance. Creates singleton on first call.
 * Use this for consistent service instances across the app.
 */
export function getLinterServices(): LinterServices {
  if (!servicesSingleton) {
    servicesSingleton = createLinterServices();
  }
  return servicesSingleton;
}

/**
 * Reset services singleton. Call when preset changes or during testing.
 */
export function resetLinterServices(): void {
  servicesSingleton = null;
}
