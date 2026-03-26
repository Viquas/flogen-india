import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mock references are available when vi.mock factories execute
// (vi.mock calls are hoisted above all other code by vitest).
const {
  mockGetUser,
  mockMaybeSingle,
  mockFrom,
  mockSupabaseClient,
  mockRawClient,
} = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockMaybeSingle = vi.fn()
  const mockEqRole = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
  const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqRole })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUserId })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

  return {
    mockGetUser,
    mockMaybeSingle,
    mockFrom,
    mockSupabaseClient: { auth: { getUser: mockGetUser } },
    mockRawClient: { from: mockFrom },
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabaseClient),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockRawClient),
}))

// Set env vars the module expects
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')

import { requireAdmin, ForbiddenError } from '@/lib/auth/require-admin'

beforeEach(() => {
  vi.clearAllMocks()
  mockMaybeSingle.mockResolvedValue({ data: null })
})

describe('ForbiddenError', () => {
  it('has the correct name and default message', () => {
    const err = new ForbiddenError()
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ForbiddenError')
    expect(err.message).toBe('Forbidden')
  })

  it('accepts a custom message', () => {
    const err = new ForbiddenError('No access')
    expect(err.message).toBe('No access')
  })
})

describe('requireAdmin', () => {
  it('throws ForbiddenError when no user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(requireAdmin()).rejects.toThrow(ForbiddenError)
    await expect(requireAdmin()).rejects.toThrow('Not authenticated')
  })

  it('passes when user has admin role in app_metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          app_metadata: { role: 'admin' },
        },
      },
    })

    const result = await requireAdmin()
    expect(result).toEqual({ isAdmin: true, userId: 'user-123' })
  })

  it('falls back to user_roles table when app_metadata has no admin role', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-456',
          app_metadata: { role: 'user' },
        },
      },
    })
    // Simulate user_roles table returning an admin row
    mockMaybeSingle.mockResolvedValue({ data: { role: 'admin' } })

    const result = await requireAdmin()
    expect(result).toEqual({ isAdmin: true, userId: 'user-456' })
    expect(mockFrom).toHaveBeenCalledWith('user_roles')
  })

  it('throws ForbiddenError when user is not admin in either source', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-789',
          app_metadata: {},
        },
      },
    })
    mockMaybeSingle.mockResolvedValue({ data: null })

    await expect(requireAdmin()).rejects.toThrow(ForbiddenError)
    await expect(requireAdmin()).rejects.toThrow('Admin access required')
  })
})
