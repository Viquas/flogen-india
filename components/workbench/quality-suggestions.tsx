"use client"

import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

interface QualitySuggestion {
  label: string
  prompt: string
  category: 'structural' | 'content' | 'accessibility' | 'technical'
  icon: typeof Sparkles
}

interface QualitySuggestionsProps {
  code: string | null
  onSuggestionClick: (prompt: string) => void
}

export function QualitySuggestions({ code, onSuggestionClick }: QualitySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<QualitySuggestion[]>([])

  useEffect(() => {
    if (!code) { setSuggestions([]); return }

    const checks: QualitySuggestion[] = []

    // Structural checks
    if (!/Accordion|faq|frequently/i.test(code)) {
      checks.push({ label: 'Add FAQ section', prompt: 'Add a FAQ section with 5 relevant questions using the Accordion component', category: 'structural', icon: Sparkles })
    }
    if (!/footer/i.test(code)) {
      checks.push({ label: 'Add footer', prompt: 'Add a professional footer with contact info, social links, and copyright', category: 'structural', icon: Sparkles })
    }
    if (!/testimonial|review.*Star/i.test(code)) {
      checks.push({ label: 'Add testimonials', prompt: 'Add a testimonials section with 3 customer reviews including star ratings', category: 'structural', icon: Sparkles })
    }

    // Content checks
    if (/lorem ipsum/i.test(code)) {
      checks.push({ label: 'Replace placeholder text', prompt: 'Replace all Lorem Ipsum placeholder text with realistic content relevant to this business', category: 'content', icon: AlertTriangle })
    }
    if (!/unsplash\.com\/photo-\d+/.test(code)) {
      checks.push({ label: 'Add real images', prompt: 'Replace any placeholder images with real Unsplash photos relevant to this industry', category: 'content', icon: AlertTriangle })
    }

    // Accessibility checks
    const imgTags = code.match(/<img[\s\S]*?\/>/g) || []
    const missingAlt = imgTags.filter(tag => !/alt=/.test(tag))
    if (missingAlt.length > 0) {
      checks.push({ label: `Fix ${missingAlt.length} missing alt texts`, prompt: 'Add descriptive alt text to all images that are missing it', category: 'accessibility', icon: AlertTriangle })
    }

    // Technical checks
    if (!/mobileMenuOpen|md:hidden.*Menu/i.test(code)) {
      checks.push({ label: 'Add mobile menu', prompt: 'Add a functional mobile hamburger menu that toggles navigation links on small screens', category: 'technical', icon: Zap })
    }
    if (/<Facebook|<Instagram|<Twitter/i.test(code)) {
      checks.push({ label: 'Fix brand icons', prompt: 'Replace Facebook/Instagram/Twitter brand icons with Globe or Link2 icons from lucide-react (brand icons crash the UI)', category: 'technical', icon: AlertTriangle })
    }

    setSuggestions(checks.slice(0, 4)) // Max 4 suggestions
  }, [code])

  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-zinc-100 bg-zinc-50/50">
      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mr-1 self-center">Suggestions:</span>
      {suggestions.map((s, i) => {
        const Icon = s.icon
        return (
          <button
            key={i}
            onClick={() => onSuggestionClick(s.prompt)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border transition-colors hover:bg-white bg-white/60 border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
          >
            <Icon className="h-3 w-3" />
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
