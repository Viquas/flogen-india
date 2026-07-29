import { describe, it, expect, vi } from 'vitest'
import {
    HEARTBEAT_TTL_MS,
    writeHeartbeat,
    isClaudeLive,
    claimJobForClaude,
} from '@/lib/generation/worker-liveness'

function mockSupabaseSelect(rows: Array<{ last_heartbeat_at: string }>) {
    return {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
                })),
            })),
        })),
    }
}

describe('isClaudeLive', () => {
    it('is true when the latest heartbeat is within the TTL', async () => {
        const nowMs = Date.parse('2026-07-08T00:00:00.000Z')
        const heartbeatAt = new Date(nowMs - 10_000).toISOString() // 10s ago
        const sb = mockSupabaseSelect([{ last_heartbeat_at: heartbeatAt }])

        expect(await isClaudeLive(sb as any, nowMs)).toBe(true)
    })

    it('is false when the latest heartbeat is stale', async () => {
        const nowMs = Date.parse('2026-07-08T00:00:00.000Z')
        const heartbeatAt = new Date(nowMs - 200_000).toISOString() // 200s ago
        const sb = mockSupabaseSelect([{ last_heartbeat_at: heartbeatAt }])

        expect(await isClaudeLive(sb as any, nowMs)).toBe(false)
    })

    it('is false when there are no worker rows', async () => {
        const nowMs = Date.parse('2026-07-08T00:00:00.000Z')
        const sb = mockSupabaseSelect([])

        expect(await isClaudeLive(sb as any, nowMs)).toBe(false)
    })

    it('respects the documented TTL constant', () => {
        expect(HEARTBEAT_TTL_MS).toBe(90_000)
    })
})

describe('claimJobForClaude', () => {
    it('returns true when exactly one row is claimed', async () => {
        const selectMock = vi.fn().mockResolvedValue({ data: [{ id: 'job-1' }], error: null })
        const isMock = vi.fn(() => ({ select: selectMock }))
        const eq2Mock = vi.fn(() => ({ is: isMock }))
        const eq1Mock = vi.fn(() => ({ eq: eq2Mock }))
        const updateMock = vi.fn(() => ({ eq: eq1Mock }))
        const sb = { from: vi.fn(() => ({ update: updateMock })) }

        const result = await claimJobForClaude(sb as any, 'job-1')

        expect(result).toBe(true)
        expect(sb.from).toHaveBeenCalledWith('queue_jobs')
        expect(updateMock).toHaveBeenCalledWith(
            expect.objectContaining({
                claimed_by: 'claude',
                status: 'processing',
                claimed_at: expect.any(String),
            })
        )
        expect(eq1Mock).toHaveBeenCalledWith('id', 'job-1')
        expect(eq2Mock).toHaveBeenCalledWith('status', 'pending')
        expect(isMock).toHaveBeenCalledWith('claimed_by', null)
    })

    it('returns false when the job is already claimed (no rows returned)', async () => {
        const selectMock = vi.fn().mockResolvedValue({ data: [], error: null })
        const isMock = vi.fn(() => ({ select: selectMock }))
        const eq2Mock = vi.fn(() => ({ is: isMock }))
        const eq1Mock = vi.fn(() => ({ eq: eq2Mock }))
        const updateMock = vi.fn(() => ({ eq: eq1Mock }))
        const sb = { from: vi.fn(() => ({ update: updateMock })) }

        const result = await claimJobForClaude(sb as any, 'job-2')

        expect(result).toBe(false)
    })

    it('returns false on error', async () => {
        const selectMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
        const isMock = vi.fn(() => ({ select: selectMock }))
        const eq2Mock = vi.fn(() => ({ is: isMock }))
        const eq1Mock = vi.fn(() => ({ eq: eq2Mock }))
        const updateMock = vi.fn(() => ({ eq: eq1Mock }))
        const sb = { from: vi.fn(() => ({ update: updateMock })) }

        const result = await claimJobForClaude(sb as any, 'job-3')

        expect(result).toBe(false)
    })
})

describe('writeHeartbeat', () => {
    it('upserts a heartbeat row keyed on worker_name', async () => {
        const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null })
        const sb = { from: vi.fn(() => ({ upsert: upsertMock })) }

        await writeHeartbeat(sb as any, 'claude-local', 'busy')

        expect(sb.from).toHaveBeenCalledWith('generation_workers')
        expect(upsertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                worker_name: 'claude-local',
                status: 'busy',
                last_heartbeat_at: expect.any(String),
                updated_at: expect.any(String),
            }),
            { onConflict: 'worker_name' }
        )
    })

    it('defaults workerName to claude-local and status to busy', async () => {
        const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null })
        const sb = { from: vi.fn(() => ({ upsert: upsertMock })) }

        await writeHeartbeat(sb as any)

        expect(upsertMock).toHaveBeenCalledWith(
            expect.objectContaining({ worker_name: 'claude-local', status: 'busy' }),
            { onConflict: 'worker_name' }
        )
    })
})
