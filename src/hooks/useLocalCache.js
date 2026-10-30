/**
 * useLocalCache — Lightweight persistence hook with instant hydration.
 * Prevents screen flash on app launch by restoring last-known state
 * from localStorage before Firestore sync kicks in.
 *
 * IMPORTANT: Live Firestore data ALWAYS overrides cached values.
 * The cache is ONLY used as an initial render placeholder until
 * the first onSnapshot arrives. It is NEVER used to override live data.
 */
import { useState, useCallback } from "react";

const CACHE_PREFIX = "ace_parent_";

function readCacheValue(cacheKey, initialValue) {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached !== null) {
      return JSON.parse(cached);
    }
  } catch {
    // Corrupted cache — fall through to default
  }
  return initialValue;
}

function writeCacheValue(cacheKey, value) {
  try {
    if (value !== undefined && value !== null) {
      localStorage.setItem(cacheKey, JSON.stringify(value));
    } else {
      localStorage.removeItem(cacheKey);
    }
  } catch {
    // Storage full or unavailable — silent fail
  }
}

export function useLocalCache(key, initialValue) {
  const cacheKey = CACHE_PREFIX + key;

  // Only read from cache once on mount — never re-read after Firestore updates
  const [value, setValue] = useState(() => readCacheValue(cacheKey, initialValue));

  // Setter that also persists to localStorage immediately
  const setCached = useCallback((newValue) => {
    setValue(newValue);
    writeCacheValue(cacheKey, newValue);
  }, [cacheKey]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // noop
    }
    setValue(initialValue);
  }, [cacheKey, initialValue]);

  return [value, setCached, clearCache];
}

/**
 * Clears all parent-app cache entries.
 * Called on logout to prevent stale data leaking.
 */
export function clearAllCaches() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // noop
  }
}
