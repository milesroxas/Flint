// Cache reset functionality - separated to avoid dynamic/static import conflicts
// This module is designed to be dynamically imported only for cache invalidation

// Import the actual cache implementation
import { resetStyleServiceCache as internalResetCache } from "@/entities/style/services/style-service-cache";

export function resetStyleServiceCache() {
  internalResetCache();
}
