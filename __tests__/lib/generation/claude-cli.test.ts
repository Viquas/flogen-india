import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }))
vi.mock('child_process', () => ({ spawn: spawnMock, default: { spawn: spawnMock } }))

import { spawn } from 'child_process'
import { buildClaudePrompt, stripCodeFences, runClaudeCLI } from '@/lib/generation/claude-cli'

describe('buildClaudePrompt', () => {
    it('includes the business name, craft-core marker, and the closing output instruction', () => {
        const prompt = buildClaudePrompt({
            businessName: 'The Coffee Nook',
            industry: 'hospitality',
            description: 'A cozy cafe in Fitzroy',
        })

        expect(prompt).toContain('The Coffee Nook')
        // craft-core marker — the file's BANNED contrast rule text
        expect(prompt).toContain('BANNED')
        expect(prompt).toContain('Output ONLY the single-file React component `export default function GeneratedPage()`. No prose, no markdown fences.')
    })

    it('includes real photo URLs when photos are present', () => {
        const prompt = buildClaudePrompt({
            businessName: 'The Coffee Nook',
            industry: 'hospitality',
            photos: [
                { name: 'places/abc/photos/1', widthPx: 1600, heightPx: 900 },
            ],
        })

        expect(prompt).toContain('/api/photos?name=')
        expect(prompt).toMatch(/REAL BUSINESS PHOTOS/)
    })

    it('omits the photos block when no photos are present', () => {
        const prompt = buildClaudePrompt({ businessName: 'No Photo Biz' })
        expect(prompt).not.toContain('REAL BUSINESS PHOTOS')
    })
})

describe('stripCodeFences', () => {
    it('strips ```tsx fences', () => {
        const wrapped = '```tsx\nexport default function GeneratedPage() {\n  return <div />\n}\n```'
        const stripped = stripCodeFences(wrapped)
        expect(stripped).toBe('export default function GeneratedPage() {\n  return <div />\n}')
    })

    it('leaves clean code without fences untouched', () => {
        const clean = 'export default function GeneratedPage() {\n  return <div />\n}'
        expect(stripCodeFences(clean)).toBe(clean)
    })
})

/** Fake child_process.ChildProcess: EventEmitter with stdout/stderr streams and a stdin sink. */
function makeFakeChild() {
    const child: any = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stdout.setEncoding = vi.fn()
    child.stderr = new EventEmitter()
    child.stderr.setEncoding = vi.fn()
    child.stdin = { write: vi.fn(), end: vi.fn() }
    child.kill = vi.fn()
    return child
}

describe('runClaudeCLI', () => {
    beforeEach(() => {
        vi.mocked(spawn).mockReset()
    })

    it('resolves with stdout when the process exits 0', async () => {
        const child = makeFakeChild()
        vi.mocked(spawn).mockReturnValue(child)

        const promise = runClaudeCLI('a prompt')
        child.stdout.emit('data', 'generated code output')
        child.emit('close', 0)

        await expect(promise).resolves.toBe('generated code output')
        expect(child.stdin.write).toHaveBeenCalledWith('a prompt')
        expect(child.stdin.end).toHaveBeenCalled()
    })

    it('rejects with a helpful message on ENOENT', async () => {
        const child = makeFakeChild()
        vi.mocked(spawn).mockReturnValue(child)

        const promise = runClaudeCLI('a prompt')
        const err: NodeJS.ErrnoException = new Error('spawn claude ENOENT')
        err.code = 'ENOENT'
        child.emit('error', err)

        await expect(promise).rejects.toThrow(/claude CLI not found/)
    })

    it('rejects with stderr context on non-zero exit', async () => {
        const child = makeFakeChild()
        vi.mocked(spawn).mockReturnValue(child)

        const promise = runClaudeCLI('a prompt')
        child.stderr.emit('data', 'boom: something broke')
        child.emit('close', 1)

        await expect(promise).rejects.toThrow(/exited with code 1/)
        await expect(promise).rejects.toThrow(/boom: something broke/)
    })

    it('passes the expected spawn args', async () => {
        const child = makeFakeChild()
        vi.mocked(spawn).mockReturnValue(child)

        const promise = runClaudeCLI('a prompt')
        child.emit('close', 0)
        await promise

        expect(spawn).toHaveBeenCalledWith('claude', [
            '-p',
            '--model', 'sonnet',
            '--output-format', 'text',
            '--disallowed-tools', 'Bash', 'Edit', 'Write', 'Read', 'WebFetch', 'WebSearch',
        ])
    })
})
