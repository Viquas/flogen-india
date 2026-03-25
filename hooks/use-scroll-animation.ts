"use client"

import { useEffect, useRef } from "react"

/**
 * Scroll-triggered fade-in + slide-up animation via IntersectionObserver.
 * Attach the returned ref to any element. It gets `animate-on-scroll` initially
 * (invisible + offset), then `animate-in` when it enters the viewport.
 *
 * Respects prefers-reduced-motion: skips animation entirely if user prefers.
 * Observes once — animation does not reverse on scroll up.
 */
export function useScrollAnimation(
  options?: { threshold?: number; rootMargin?: string }
): React.RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return // Element stays visible, no animation

    el.classList.add("animate-on-scroll")

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")
          observer.unobserve(entry.target)
        }
      },
      {
        threshold: options?.threshold ?? 0.15,
        rootMargin: options?.rootMargin ?? "0px",
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options?.threshold, options?.rootMargin])

  return ref
}

/** CSS for scroll animation classes. Inject into layout <style> tag. */
export const SCROLL_ANIMATION_STYLES = `
  .animate-on-scroll {
    opacity: 0;
    transform: translateY(24px);
  }
  .animate-on-scroll.animate-in {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 700ms ease-out, transform 700ms ease-out;
  }
  [id] {
    scroll-margin-top: 80px;
  }
`
