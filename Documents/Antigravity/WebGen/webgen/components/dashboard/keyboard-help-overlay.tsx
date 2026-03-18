"use client"

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface KeyboardHelpOverlayProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: Array<{ key: string; description: string }>
}

const navigationKeys = new Set(['j', 'k'])
const actionKeys = new Set(['a', 'r', 'f', 'e'])

export function KeyboardHelpOverlay({ isOpen, onClose, shortcuts }: KeyboardHelpOverlayProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Group shortcuts into sections
  const navigation = shortcuts.filter(s => navigationKeys.has(s.key))
  const actions = shortcuts.filter(s => actionKeys.has(s.key))
  const other = shortcuts.filter(s => !navigationKeys.has(s.key) && !actionKeys.has(s.key))

  const sections = [
    { title: 'Navigation', items: navigation },
    { title: 'Actions', items: actions },
    { title: 'Other', items: other },
  ].filter(s => s.items.length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal card */}
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcut sections */}
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700">{shortcut.description}</span>
                    <kbd className="bg-zinc-100 border border-zinc-300 rounded px-2 py-0.5 text-sm font-mono font-semibold text-zinc-700">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
