/**
 * API middleware wrapper — standardizes request validation, error handling,
 * and response formatting across all API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { ApiError, BadRequestError, InternalError } from './errors'

// Standardized API response envelope
interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
  requestId?: string
}

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function formatZodError(error: ZodError): string {
  return error.errors
    .map(e => `${e.path.join('.')}: ${e.message}`)
    .join('; ')
}

export interface MiddlewareOptions<T = unknown> {
  /** Zod schema to validate the request body */
  bodySchema?: ZodSchema<T>
  /** Check for AI API keys (returns 500 if none configured) */
  requireAiKeys?: boolean
  /** Maximum request body size in bytes (default: 1MB) */
  maxBodySize?: number
}

type RouteHandler<T = unknown> = (
  req: NextRequest,
  context: {
    body: T
    requestId: string
  }
) => Promise<NextResponse | Response>

/**
 * Wraps an API route handler with standardized middleware:
 * - Request ID generation
 * - Body parsing and Zod validation
 * - AI API key checking
 * - Standardized error responses
 * - Request timing
 */
export function withApiMiddleware<T = unknown>(
  handler: RouteHandler<T>,
  options: MiddlewareOptions<T> = {}
) {
  return async (req: NextRequest): Promise<NextResponse | Response> => {
    const requestId = generateRequestId()
    const start = Date.now()

    try {
      // Parse body
      let body: T = {} as T
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        try {
          body = await req.json()
        } catch {
          throw new BadRequestError('Invalid JSON body', 'INVALID_JSON')
        }
      }

      // Validate body with Zod schema
      if (options.bodySchema) {
        const result = options.bodySchema.safeParse(body)
        if (!result.success) {
          throw new BadRequestError(
            formatZodError(result.error),
            'VALIDATION_ERROR'
          )
        }
        body = result.data
      }

      // Check AI API keys
      if (options.requireAiKeys) {
        const hasKey = process.env.OPENAI_API_KEY ||
                       process.env.OPENROUTER_API_KEY ||
                       process.env.GOOGLE_GENERATIVE_AI_API_KEY
        if (!hasKey) {
          throw new InternalError('AI API key not configured', 'NO_AI_KEY')
        }
      }

      // Execute handler
      const response = await handler(req, { body, requestId })

      const duration = Date.now() - start
      console.log(`[API] ${req.method} ${req.nextUrl.pathname} | ${requestId} | ${duration}ms`)

      return response

    } catch (error) {
      const duration = Date.now() - start

      if (error instanceof ApiError) {
        console.error(`[API] ${req.method} ${req.nextUrl.pathname} | ${requestId} | ${error.statusCode} ${error.message} | ${duration}ms`)

        const response: ApiResponse = {
          success: false,
          error: error.message,
          code: error.code,
          requestId,
        }
        return NextResponse.json(response, { status: error.statusCode })
      }

      // Unexpected error
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[API] ${req.method} ${req.nextUrl.pathname} | ${requestId} | 500 ${message} | ${duration}ms`, error)

      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId,
      }
      return NextResponse.json(response, { status: 500 })
    }
  }
}

/**
 * Helper to create a success response with the standard envelope.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  return NextResponse.json(response, { status })
}

/**
 * Helper to check for AI keys — extracted from duplicated pattern across routes.
 */
export function hasAiApiKeys(): boolean {
  return !!(
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  )
}
