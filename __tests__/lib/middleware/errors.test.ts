import { describe, it, expect } from 'vitest'
import { ApiError, BadRequestError, UnauthorizedError, NotFoundError, TooManyRequestsError, InternalError } from '@/lib/middleware/errors'

describe('API Error classes', () => {
  it('BadRequestError has status 400', () => {
    const err = new BadRequestError('Invalid input')
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe('Invalid input')
    expect(err.code).toBe('BAD_REQUEST')
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toBeInstanceOf(Error)
  })

  it('UnauthorizedError has status 401', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
  })

  it('NotFoundError has status 404', () => {
    const err = new NotFoundError('Project not found')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Project not found')
  })

  it('TooManyRequestsError has status 429', () => {
    const err = new TooManyRequestsError()
    expect(err.statusCode).toBe(429)
  })

  it('InternalError has status 500', () => {
    const err = new InternalError()
    expect(err.statusCode).toBe(500)
  })

  it('supports custom error codes', () => {
    const err = new BadRequestError('Bad', 'CUSTOM_CODE')
    expect(err.code).toBe('CUSTOM_CODE')
  })
})
