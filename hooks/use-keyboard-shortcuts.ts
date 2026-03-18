"use client"

import { useEffect } from 'react'

export interface KeyboardShortcutConfig {
  key: string
  description: string
  handler: () => void
  requiresFocus?: boolean
}

/**
 * Custom React hook for focus-aware keyboard navigation and actions.
 *
 * Registers a `keydown` listener on `document` that matches pressed keys
 * against the provided `shortcuts` array. Automatically skips handling when
 * the active element is a text input, textarea, select, contenteditable
 * element, or inside a Monaco editor -- preventing the P6 pitfall of
 * keyboard shortcuts firing during text entry.
 *
 * @param shortcuts - Array of shortcut configs to register
 * @param enabled - When false, the listener is not attached at all (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcutConfig[],
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      // Focus guard: never fire shortcuts when typing in an input-like element
      const active = document.activeElement
      if (active) {
        const tagName = active.tagName
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT'
        ) {
          return
        }
        if ((active as HTMLElement).contentEditable === 'true') {
          return
        }
        // Monaco editor guard
        if (active.closest?.('.monaco-editor')) {
          return
        }
      }

      const key = event.key.toLowerCase()

      for (const shortcut of shortcuts) {
        if (shortcut.key.toLowerCase() === key) {
          event.preventDefault()
          shortcut.handler()
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}
