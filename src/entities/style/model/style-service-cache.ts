// Core cache implementation for style service
// This module contains the actual cache state and is statically imported by style.service.ts

// Module-level cache for site-wide styles (memoized for the session)
let cachedAllStylesPromise: Promise<any[]> | null = null;

export function resetStyleServiceCache() {
  cachedAllStylesPromise = null;
}

export function getStyleServiceCache() {
  return cachedAllStylesPromise;
}

export function setStyleServiceCache(cache: Promise<any[]> | null) {
  cachedAllStylesPromise = cache;
}
