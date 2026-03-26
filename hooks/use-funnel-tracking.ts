'use client'

import { useEffect, useRef } from 'react'
import { trackClientEvent, type FunnelEventType, type TrackEventProperties } from '@/lib/analytics/track'

/**
 * Fires a funnel event once on component mount.
 * Also tracks scroll depth at 25/50/75/100% thresholds using
 * IntersectionObserver on sentinel elements with data-scroll-depth attribute.
 *
 * Usage:
 *   useFunnelTracking('claim.started', { slug, projectId })
 *
 * For scroll depth, add sentinel divs in your JSX:
 *   <div data-scroll-depth="25" />  (at ~25% of the page)
 *   <div data-scroll-depth="50" />
 *   <div data-scroll-depth="75" />
 *   <div data-scroll-depth="100" /> (at the bottom)
 */
export function useFunnelTracking(
  eventType: FunnelEventType,
  properties?: TrackEventProperties,
) {
  const hasFired = useRef(false)
  const scrollDepthsFired = useRef<Set<string>>(new Set())

  // Fire the main event once on mount
  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true
    trackClientEvent(eventType, properties)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track scroll depth via IntersectionObserver
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const sentinels = document.querySelectorAll<HTMLElement>('[data-scroll-depth]')
    if (sentinels.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          const depth = (entry.target as HTMLElement).dataset.scrollDepth
          if (!depth || scrollDepthsFired.current.has(depth)) continue

          scrollDepthsFired.current.add(depth)
          trackClientEvent(`scroll.${depth}` as FunnelEventType, {
            ...properties,
            page: eventType,
          })
        }
      },
      { threshold: 0.1 },
    )

    sentinels.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
