import { describe, it, expect } from 'vitest'
import { buildAuVoicePromptFragment } from '@/lib/ai/copy-voice'

describe('buildAuVoicePromptFragment', () => {
  it('includes en-AU spelling guidance', () => {
    const fragment = buildAuVoicePromptFragment()
    expect(fragment).toMatch(/en-AU|Australian English/i)
  })

  it('instructs against generic "Welcome to X" openers', () => {
    const fragment = buildAuVoicePromptFragment()
    expect(fragment.toLowerCase()).toContain('welcome to')
  })

  it('mentions problem-led headlines', () => {
    const fragment = buildAuVoicePromptFragment()
    expect(fragment.toLowerCase()).toContain('problem')
  })

  it('injects the suburb name when provided', () => {
    const fragment = buildAuVoicePromptFragment('Bondi')
    expect(fragment).toContain('Bondi')
  })

  it('omits suburb guidance when not provided', () => {
    const fragment = buildAuVoicePromptFragment()
    expect(fragment).not.toContain('undefined')
  })
})
