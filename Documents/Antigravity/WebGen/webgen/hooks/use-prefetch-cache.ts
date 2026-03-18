"use client"

import { useRef, useState, useCallback } from "react"
import { getProjectById } from "@/app/(admin)/dashboard/actions"

/**
 * Cached project data structure.
 * Mirrors the shape returned by getProjectById plus a cachedAt timestamp.
 */
export interface CachedProject {
  id: string
  business_data: any
  generated_code: string | null
  status: string
  [key: string]: any // other project fields (version, created_at, etc.)
  cachedAt: number   // timestamp for staleness check
}

export interface PrefetchCacheReturn {
  /** Get a cached project, or null if not cached / stale */
  getCached: (projectId: string) => CachedProject | null
  /** Prefetch the next N projects from a given project list (non-blocking) */
  prefetchNext: (currentProjectId: string, projectIds: string[]) => void
  /** Manually add a project to the cache (e.g., when loaded via normal flow) */
  addToCache: (project: CachedProject) => void
  /** Clear the entire cache */
  clearCache: () => void
  /** Number of cached items (for debugging) */
  cacheSize: number
}

/** How many projects to prefetch ahead of current position */
const PREFETCH_COUNT = 3

/** Cache entries older than this (ms) are considered stale and evicted on access */
const STALENESS_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Schedule a callback to run when the browser is idle.
 * Falls back to setTimeout for environments without requestIdleCallback.
 */
const scheduleIdle = (fn: () => void): void => {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(fn, { timeout: 2000 })
  } else {
    setTimeout(fn, 100)
  }
}

/**
 * React hook providing an in-memory LRU cache for project data prefetching.
 *
 * - Uses a Map (insertion-order) as the backing store for simple LRU semantics.
 * - Prefetches the next 3 projects via requestIdleCallback (non-blocking).
 * - Evicts stale entries (>5 min) on access.
 * - Never exceeds maxSize entries.
 * - Deduplicates in-flight fetches.
 *
 * Per P12: prefetching never competes with active user interactions.
 */
export function usePrefetchCache(maxSize: number = 5): PrefetchCacheReturn {
  const cacheRef = useRef<Map<string, CachedProject>>(new Map())
  const inFlightRef = useRef<Set<string>>(new Set())
  const [cacheVersion, setCacheVersion] = useState(0)

  /**
   * Get a cached project by ID.
   * Moves the entry to the end of the Map (most recently used).
   * Returns null if not found or stale.
   */
  const getCached = useCallback((projectId: string): CachedProject | null => {
    const cache = cacheRef.current
    const entry = cache.get(projectId)

    if (!entry) return null

    // Staleness check: evict if older than TTL
    if (Date.now() - entry.cachedAt > STALENESS_TTL_MS) {
      cache.delete(projectId)
      setCacheVersion(v => v + 1)
      return null
    }

    // LRU touch: delete and re-insert to move to end (most recently used)
    cache.delete(projectId)
    cache.set(projectId, entry)

    return entry
  }, [])

  /**
   * Add or update a project in the cache.
   * Enforces maxSize by evicting the least recently used entry (first in Map).
   */
  const addToCache = useCallback((project: CachedProject): void => {
    const cache = cacheRef.current

    // If already present, remove first (so re-insert moves to end)
    if (cache.has(project.id)) {
      cache.delete(project.id)
    }

    cache.set(project.id, project)

    // Evict LRU entries if over capacity
    while (cache.size > maxSize) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) {
        cache.delete(firstKey)
      }
    }

    setCacheVersion(v => v + 1)
  }, [maxSize])

  /**
   * Prefetch the next PREFETCH_COUNT projects after currentProjectId in the projectIds list.
   * Runs via requestIdleCallback so it never blocks active interactions.
   * Deduplicates: won't re-fetch projects already cached or in-flight.
   */
  const prefetchNext = useCallback((currentProjectId: string, projectIds: string[]): void => {
    const currentIndex = projectIds.indexOf(currentProjectId)
    if (currentIndex === -1) return

    // Take the next PREFETCH_COUNT IDs
    const nextIds = projectIds.slice(currentIndex + 1, currentIndex + 1 + PREFETCH_COUNT)

    for (const id of nextIds) {
      // Skip if already cached or in-flight
      if (cacheRef.current.has(id) || inFlightRef.current.has(id)) {
        continue
      }

      inFlightRef.current.add(id)

      scheduleIdle(() => {
        getProjectById(id)
          .then((result) => {
            if (result.success && result.data) {
              const project = result.data as any
              addToCache({
                ...project,
                cachedAt: Date.now(),
              })
              console.log("[PrefetchCache] Prefetched project:", id)
            }
          })
          .catch(() => {
            // Prefetch is best-effort; silently ignore failures
          })
          .finally(() => {
            inFlightRef.current.delete(id)
          })
      })
    }
  }, [addToCache])

  /**
   * Clear the entire cache and in-flight tracking set.
   */
  const clearCache = useCallback((): void => {
    cacheRef.current.clear()
    inFlightRef.current.clear()
    setCacheVersion(v => v + 1)
  }, [])

  return {
    getCached,
    prefetchNext,
    addToCache,
    clearCache,
    cacheSize: cacheRef.current.size,
  }
}
